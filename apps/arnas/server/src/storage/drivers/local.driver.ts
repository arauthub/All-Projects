import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { IStorageDriver, PingResult, StorageCapacity } from './storage-driver.interface.js';

export class LocalStorageDriver implements IStorageDriver {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = path.resolve(basePath);
  }

  private resolveKey(key: string): string {
    // Prevent directory traversal
    const safeKey = key.replace(/\.\./g, '').replace(/^\/+/, '');
    return path.join(this.basePath, safeKey);
  }

  public async init(): Promise<void> {
    if (!fsSync.existsSync(this.basePath)) {
      await fs.mkdir(this.basePath, { recursive: true });
    }
  }

  public async write(key: string, data: Buffer): Promise<void> {
    const fullPath = this.resolveKey(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    // Write atomically via temp file
    const tempPath = `${fullPath}.${Date.now()}.tmp`;
    await fs.writeFile(tempPath, data);
    await fs.rename(tempPath, fullPath);
  }

  public async writeStream(key: string, stream: Readable): Promise<void> {
    const fullPath = this.resolveKey(key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    const tempPath = `${fullPath}.${Date.now()}.tmp`;
    const writeStream = fsSync.createWriteStream(tempPath);

    await new Promise<void>((resolve, reject) => {
      stream.pipe(writeStream);
      writeStream.on('finish', () => resolve());
      writeStream.on('error', (err) => reject(err));
      stream.on('error', (err) => reject(err));
    });

    await fs.rename(tempPath, fullPath);
  }

  public async readStream(key: string, range?: { start: number; end: number }): Promise<Readable> {
    const fullPath = this.resolveKey(key);
    if (!fsSync.existsSync(fullPath)) {
      const err: any = new Error(`File not found: ${key}`);
      err.code = 'ENOENT';
      throw err;
    }

    if (range) {
      return fsSync.createReadStream(fullPath, { start: range.start, end: range.end });
    }
    return fsSync.createReadStream(fullPath);
  }

  public async readBuffer(key: string): Promise<Buffer> {
    const fullPath = this.resolveKey(key);
    return await fs.readFile(fullPath);
  }

  public async delete(key: string): Promise<void> {
    const fullPath = this.resolveKey(key);
    try {
      await fs.unlink(fullPath);
    } catch (err: any) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  public async exists(key: string): Promise<boolean> {
    const fullPath = this.resolveKey(key);
    return fsSync.existsSync(fullPath);
  }

  public async ping(): Promise<PingResult> {
    const start = Date.now();
    try {
      await this.init();
      const testFile = path.join(this.basePath, '.healthcheck');
      await fs.writeFile(testFile, 'ping');
      await fs.unlink(testFile);
      const latencyMs = Date.now() - start;
      return { ok: true, latencyMs };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  public async getCapacity(): Promise<StorageCapacity> {
    try {
      await this.init();
      // Node.js 18+ provides fs.statfs
      if (typeof fs.statfs === 'function') {
        const stats = await fs.statfs(this.basePath);
        const total = BigInt(stats.blocks) * BigInt(stats.bsize);
        const free = BigInt(stats.bfree) * BigInt(stats.bsize);
        const used = total > free ? total - free : 0n;
        return { totalBytes: total, freeBytes: free, usedBytes: used };
      }
    } catch {
      // Fallback if statfs fails or on unsupported OS
    }

    // Default 1TB fallback
    const fallbackTotal = 1099511627776n;
    return {
      totalBytes: fallbackTotal,
      usedBytes: 0n,
      freeBytes: fallbackTotal,
    };
  }
}
