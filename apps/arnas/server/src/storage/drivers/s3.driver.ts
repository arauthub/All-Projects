import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { IStorageDriver, PingResult, StorageCapacity } from './storage-driver.interface.js';

export interface S3DriverConfig {
  endpoint?: string;
  bucket: string;
  region?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}

export class S3StorageDriver implements IStorageDriver {
  private client: S3Client;
  private bucket: string;

  constructor(config: S3DriverConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint || undefined,
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? true, // Crucial for MinIO and custom S3 endpoints
    });
  }

  private normalizeKey(key: string): string {
    return key.replace(/^\/+/, '');
  }

  public async write(key: string, data: Buffer, mimeType?: string): Promise<void> {
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.normalizeKey(key),
      Body: data,
      ContentType: mimeType || 'application/octet-stream',
    });
    await this.client.send(cmd);
  }

  public async writeStream(key: string, stream: Readable, sizeBytes?: number, mimeType?: string): Promise<void> {
    // S3 PutObject accepts Readable stream or Buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const fullBuffer = Buffer.concat(chunks);

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.normalizeKey(key),
      Body: fullBuffer,
      ContentLength: sizeBytes || fullBuffer.length,
      ContentType: mimeType || 'application/octet-stream',
    });
    await this.client.send(cmd);
  }

  public async readStream(key: string, range?: { start: number; end: number }): Promise<Readable> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.normalizeKey(key),
      Range: range ? `bytes=${range.start}-${range.end}` : undefined,
    });

    const response = await this.client.send(cmd);
    if (!response.Body) {
      throw new Error(`S3 object body empty for key: ${key}`);
    }

    return response.Body as Readable;
  }

  public async readBuffer(key: string): Promise<Buffer> {
    const stream = await this.readStream(key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  public async delete(key: string): Promise<void> {
    const cmd = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: this.normalizeKey(key),
    });
    await this.client.send(cmd);
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const cmd = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.normalizeKey(key),
      });
      await this.client.send(cmd);
      return true;
    } catch (err: any) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw err;
    }
  }

  public async ping(): Promise<PingResult> {
    const start = Date.now();
    try {
      const cmd = new HeadBucketCommand({
        Bucket: this.bucket,
      });
      await this.client.send(cmd, { abortSignal: AbortSignal.timeout(3000) });
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { ok: false, latencyMs: Date.now() - start, error: err.message };
    }
  }

  public async getCapacity(): Promise<StorageCapacity> {
    // S3 buckets generally have effectively unlimited or custom quotas
    const totalBytes = 10995116277760n; // 10TB representation
    return {
      totalBytes,
      usedBytes: 0n,
      freeBytes: totalBytes,
    };
  }
}
