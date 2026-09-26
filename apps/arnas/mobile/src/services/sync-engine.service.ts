import { SQLiteService, LocalSyncAsset } from './sqlite.service';
import { MediaScannerService } from './media-scanner.service';
import { SentinelService, SentinelPolicy } from './sentinel.service';
import { MobileFileService } from './file.service';
import { ApiClient } from '../api/client';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';

export interface SyncProgressUpdate {
  activeFile?: string;
  chunkProgress?: number;
  totalPending: number;
  isSyncing: boolean;
  statusMessage: string;
}

export class SyncEngine {
  private static isRunning = false;

  public static async runSyncCycle(
    policy: SentinelPolicy,
    onProgress?: (update: SyncProgressUpdate) => void
  ): Promise<{ syncedCount: number; errors: string[] }> {
    if (this.isRunning) {
      return { syncedCount: 0, errors: ['Sync already in progress'] };
    }

    this.isRunning = true;
    const errors: string[] = [];
    let syncedCount = 0;

    try {
      onProgress?.({
        isSyncing: true,
        totalPending: 0,
        statusMessage: 'Scanning camera roll for new media...',
      });

      // 1. Scan device media
      await MediaScannerService.scanCameraRoll(50);

      // 2. Fetch pending assets
      const pendingAssets = await SQLiteService.getPendingAssets(15);
      if (pendingAssets.length === 0) {
        onProgress?.({
          isSyncing: false,
          totalPending: 0,
          statusMessage: 'All media is already synchronized.',
        });
        return { syncedCount: 0, errors: [] };
      }

      // 3. Sentinel check
      const sentinel = await SentinelService.canUpload(policy);
      if (!sentinel.allowed) {
        onProgress?.({
          isSyncing: false,
          totalPending: pendingAssets.length,
          statusMessage: `Sync paused: ${sentinel.reason}`,
        });
        return { syncedCount: 0, errors: [sentinel.reason || 'Hardware policy blocked sync'] };
      }

      // 4. Differential Sync Check with Server
      onProgress?.({
        isSyncing: true,
        totalPending: pendingAssets.length,
        statusMessage: 'Verifying delta with ARNAS Server...',
      });

      for (const asset of pendingAssets) {
        // Double check policy before each file
        const check = await SentinelService.canUpload(policy);
        if (!check.allowed) {
          break;
        }

        try {
          onProgress?.({
            isSyncing: true,
            activeFile: asset.file_name,
            totalPending: pendingAssets.length - syncedCount,
            statusMessage: `Uploading ${asset.file_name}...`,
          });

          await SQLiteService.updateAssetStatus(asset.local_asset_id, 'UPLOADING');

          // Upload the file via resumable chunked protocol
          await MobileFileService.uploadLocalFile(
            asset.uri,
            asset.file_name,
            asset.mime_type || 'image/jpeg',
            false
          );

          await SQLiteService.updateAssetStatus(asset.local_asset_id, 'COMPLETED');
          syncedCount++;
        } catch (err: any) {
          errors.push(`${asset.file_name}: ${err.message}`);
          await SQLiteService.updateAssetStatus(asset.local_asset_id, 'FAILED', {
            errorMessage: err.message,
          });
        }
      }

      onProgress?.({
        isSyncing: false,
        totalPending: 0,
        statusMessage: syncedCount > 0 ? `Successfully backed up ${syncedCount} items.` : 'Sync cycle completed.',
      });
    } finally {
      this.isRunning = false;
    }

    return { syncedCount, errors };
  }
}
