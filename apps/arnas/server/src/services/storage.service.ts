import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { env } from '../config/env.js';

export class StorageService {
  private rootPath: string;

  constructor(customRoot?: string) {
    this.rootPath = customRoot || path.resolve(env.STORAGE_ROOT);
  }

  /**
   * Initializes host directories on startup
   */
  public async init(): Promise<void> {
    const dirs = [
      this.rootPath,
      path.join(this.rootPath, 'families'),
      path.join(this.rootPath, 'thumbnails'),
      path.join(this.rootPath, 'staging'),
    ];

    for (const dir of dirs) {
      if (!fsSync.existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  public getRootPath(): string {
    return this.rootPath;
  }

  public getFamilyPath(familyId: string): string {
    return path.join(this.rootPath, 'families', familyId);
  }

  public getFamilyVaultPath(familyId: string): string {
    return path.join(this.getFamilyPath(familyId), 'shared');
  }

  public getMemberPath(familyId: string, userId: string, subfolder: string = 'files'): string {
    return path.join(this.getFamilyPath(familyId), 'members', userId, subfolder);
  }

  public getStagingPath(uploadId: string): string {
    return path.join(this.rootPath, 'staging', uploadId);
  }

  public getThumbnailPath(sha256: string): string {
    const prefix = sha256.substring(0, 2);
    return path.join(this.rootPath, 'thumbnails', prefix, `${sha256}_thumb.webp`);
  }

  /**
   * Ensures a specific member's directory hierarchy exists
   */
  public async ensureMemberDirs(familyId: string, userId: string): Promise<void> {
    const dirs = [
      this.getFamilyVaultPath(familyId),
      this.getMemberPath(familyId, userId, 'files'),
      this.getMemberPath(familyId, userId, 'camera_roll'),
    ];

    for (const d of dirs) {
      await fs.mkdir(d, { recursive: true });
    }
  }

  /**
   * Compute SHA-256 hash of a buffer
   */
  public computeHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Compute SHA-256 hash of a file on disk
   */
  public async computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fsSync.createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Generates a high quality WebP thumbnail for images
   */
  public async generateThumbnail(sourceFilePath: string, sha256: string, width: number = 384): Promise<string | null> {
    try {
      const destPath = this.getThumbnailPath(sha256);
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      await sharp(sourceFilePath)
        .rotate() // auto-orient from EXIF
        .resize({ width, height: width, fit: 'cover' })
        .webp({ quality: env.THUMBNAIL_QUALITY })
        .toFile(destPath);

      return destPath;
    } catch (err) {
      // If file is not an image or unsupported format, return null
      return null;
    }
  }
}

export const storageService = new StorageService();
