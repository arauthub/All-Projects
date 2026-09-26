import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';

export interface LocalSyncAsset {
  local_asset_id: string;
  file_name: string;
  uri: string;
  size_bytes: number;
  sha256?: string | null;
  mime_type?: string | null;
  creation_time: number;
  sync_status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';
  active_upload_id?: string | null;
  last_chunk_index: number;
  error_message?: string | null;
  retry_count: number;
  updated_at: number;
}

export interface SyncStats {
  totalSynced: number;
  inQueue: number;
  failed: number;
}

export class SQLiteService {
  private static dbInstance: SQLiteDatabase | null = null;

  public static async getDb(): Promise<SQLiteDatabase> {
    if (!this.dbInstance) {
      this.dbInstance = await openDatabaseAsync('arnas_sync.db');
      await this.initDatabase(this.dbInstance);
    }
    return this.dbInstance;
  }

  private static async initDatabase(db: SQLiteDatabase): Promise<void> {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS local_sync_journal (
        local_asset_id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        uri TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        sha256 TEXT,
        mime_type TEXT,
        creation_time INTEGER,
        sync_status TEXT CHECK(sync_status IN ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED')),
        active_upload_id TEXT,
        last_chunk_index INTEGER DEFAULT 0,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_journal_status ON local_sync_journal(sync_status);
      CREATE INDEX IF NOT EXISTS idx_journal_created ON local_sync_journal(creation_time DESC);
    `);
  }

  /**
   * Ingest a new media asset into the local journal
   */
  public static async upsertAsset(asset: {
    id: string;
    filename: string;
    uri: string;
    size: number;
    mimeType?: string;
    creationTime: number;
  }): Promise<void> {
    const db = await this.getDb();
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO local_sync_journal (
        local_asset_id, file_name, uri, size_bytes, mime_type,
        creation_time, sync_status, retry_count, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, ?)
      ON CONFLICT(local_asset_id) DO UPDATE SET
        file_name = excluded.file_name,
        uri = excluded.uri,
        size_bytes = excluded.size_bytes,
        updated_at = excluded.updated_at
      WHERE local_sync_journal.sync_status != 'COMPLETED'`,
      [
        asset.id,
        asset.filename,
        asset.uri,
        asset.size,
        asset.mimeType || 'image/jpeg',
        asset.creationTime,
        now,
      ]
    );
  }

  /**
   * Retrieve assets waiting to be uploaded
   */
  public static async getPendingAssets(limit: number = 20): Promise<LocalSyncAsset[]> {
    const db = await this.getDb();
    return await db.getAllAsync<LocalSyncAsset>(
      `SELECT * FROM local_sync_journal
       WHERE sync_status IN ('PENDING', 'FAILED') AND retry_count < 5
       ORDER BY creation_time DESC
       LIMIT ?`,
      [limit]
    );
  }

  /**
   * Update the sync status of an asset
   */
  public static async updateAssetStatus(
    localAssetId: string,
    status: 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED',
    options?: {
      errorMessage?: string;
      activeUploadId?: string | null;
      lastChunkIndex?: number;
      sha256?: string;
    }
  ): Promise<void> {
    const db = await this.getDb();
    const now = Date.now();

    let sql = `UPDATE local_sync_journal SET sync_status = ?, updated_at = ?`;
    const params: any[] = [status, now];

    if (options?.errorMessage !== undefined) {
      sql += `, error_message = ?`;
      params.push(options.errorMessage);
    }
    if (options?.activeUploadId !== undefined) {
      sql += `, active_upload_id = ?`;
      params.push(options.activeUploadId);
    }
    if (options?.lastChunkIndex !== undefined) {
      sql += `, last_chunk_index = ?`;
      params.push(options.lastChunkIndex);
    }
    if (options?.sha256 !== undefined) {
      sql += `, sha256 = ?`;
      params.push(options.sha256);
    }

    if (status === 'FAILED') {
      sql += `, retry_count = retry_count + 1`;
    }

    sql += ` WHERE local_asset_id = ?`;
    params.push(localAssetId);

    await db.runAsync(sql, params);
  }

  /**
   * Aggregated metrics for dashboard
   */
  public static async getSyncStats(): Promise<SyncStats> {
    const db = await this.getDb();
    const rows = await db.getAllAsync<{ sync_status: string; count: number }>(
      `SELECT sync_status, COUNT(*) as count FROM local_sync_journal GROUP BY sync_status`
    );

    let totalSynced = 0;
    let inQueue = 0;
    let failed = 0;

    for (const r of rows) {
      if (r.sync_status === 'COMPLETED') totalSynced = r.count;
      else if (r.sync_status === 'PENDING' || r.sync_status === 'UPLOADING') inQueue += r.count;
      else if (r.sync_status === 'FAILED') failed = r.count;
    }

    return { totalSynced, inQueue, failed };
  }
}
