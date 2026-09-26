import { Readable } from 'stream';

export interface StorageCapacity {
  totalBytes: bigint;
  usedBytes: bigint;
  freeBytes: bigint;
}

export interface PingResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface IStorageDriver {
  /**
   * Write data buffer to storage under given key/path
   */
  write(key: string, data: Buffer, mimeType?: string): Promise<void>;

  /**
   * Stream data to storage
   */
  writeStream(key: string, stream: Readable, sizeBytes?: number, mimeType?: string): Promise<void>;

  /**
   * Read file as a stream, optionally supporting byte range
   */
  readStream(key: string, range?: { start: number; end: number }): Promise<Readable>;

  /**
   * Read file completely into buffer
   */
  readBuffer(key: string): Promise<Buffer>;

  /**
   * Delete an object from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Check if object exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Ping storage backend to measure health and latency
   */
  ping(): Promise<PingResult>;

  /**
   * Get capacity metrics
   */
  getCapacity(): Promise<StorageCapacity>;
}
