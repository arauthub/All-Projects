import { ApiClient, storage } from '../api/client';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';
import { E2EEService } from '../crypto/e2ee.service';

export interface FileItem {
  id: string;
  name: string;
  isDirectory: boolean;
  mimeType?: string;
  sizeBytes: string;
  checksumSha256?: string;
  thumbnailUrl?: string;
  isSharedVault: boolean;
  isFavorite: boolean;
  isEncrypted?: boolean;
  encryptionAlgo?: string;
  initializationVector?: string;
  authTag?: string;
  encryptedFileKey?: string;
  encryptedMetadata?: string;
  takenAt?: string;
  createdAt: string;
}

export interface FileListResponse {
  total: number;
  items: FileItem[];
  limit: number;
  offset: number;
}

export class MobileFileService {
  /**
   * Fetch directory listing from backend
   */
  public static async listFiles(vault: boolean = false, folderId?: string): Promise<FileListResponse> {
    const params = new URLSearchParams();
    if (vault) params.append('vault', 'true');
    if (folderId) params.append('folderId', folderId);

    const query = params.toString() ? `?${params.toString()}` : '';
    return await ApiClient.get<FileListResponse>(`/api/v1/files/list${query}`);
  }

  /**
   * Delete a file
   */
  public static async deleteFile(fileId: string): Promise<void> {
    await ApiClient.delete(`/api/v1/files/${fileId}`);
  }

  /**
   * Download a file to local device cache/downloads
   */
  public static async downloadFile(fileId: string, filename: string): Promise<string> {
    const baseUrl = await storage.getServerUrl();
    const token = await storage.getAccessToken();

    const downloadUrl = `${baseUrl}/api/v1/files/${fileId}/download`;
    const destinationUri = `${FileSystem.documentDirectory}${filename}`;

    const downloadRes = await FileSystem.downloadAsync(downloadUrl, destinationUri, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return downloadRes.uri;
  }

  /**
   * Uploads a picked local file through the chunked sync protocol
   */
  public static async uploadLocalFile(
    fileUri: string,
    filename: string,
    mimeType: string,
    isSharedVault: boolean = false,
    parentFolderId?: string
  ): Promise<FileItem> {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Local file not found');
    }

    const totalSizeBytes = fileInfo.size;
    const chunkSizeBytes = 2 * 1024 * 1024; // 2MB chunks

    const base64Content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    let totalBytesToUpload = totalSizeBytes;
    let uploadBase64 = base64Content;
    let expectedSha256 = '';
    let encMetadata: any = {};

    const isE2EEUnlocked = E2EEService.isVaultUnlocked();
    if (isE2EEUnlocked) {
      const plainBuffer = Buffer.from(base64Content, 'base64');
      const encrypted = await E2EEService.encryptBuffer(plainBuffer);
      uploadBase64 = encrypted.ciphertextBase64;
      totalBytesToUpload = Buffer.from(uploadBase64, 'base64').length;
      expectedSha256 = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        uploadBase64
      );
      encMetadata = {
        isEncrypted: true,
        encryptionAlgo: 'AES-256-GCM',
        initializationVector: encrypted.ivHex,
        authTag: encrypted.authTagHex,
        encryptedFileKey: encrypted.encryptedFileKeyHex,
      };
    } else {
      expectedSha256 = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        base64Content
      );
    }

    // 1. Initialize upload session
    const initRes = await ApiClient.post<any>('/api/v1/sync/upload/init', {
      filename,
      mimeType,
      totalSizeBytes: totalBytesToUpload,
      chunkSizeBytes,
      expectedSha256,
      isSharedVault,
      parentFolderId,
      ...encMetadata,
    });

    if (initRes.status === 'DEDUPLICATED') {
      return initRes.file;
    }

    const uploadId = initRes.uploadId;
    const totalChunks = initRes.totalChunks;
    const uploadedChunks: number[] = initRes.uploadedChunks || [];

    const baseUrl = await storage.getServerUrl();
    const token = await storage.getAccessToken();

    const fullUploadBuffer = Buffer.from(uploadBase64, 'base64');

    // 2. Upload missing chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      if (uploadedChunks.includes(chunkIndex)) {
        continue;
      }

      const position = chunkIndex * chunkSizeBytes;
      const end = Math.min(fullUploadBuffer.length, position + chunkSizeBytes);
      const chunkBuffer = fullUploadBuffer.subarray(position, end);
      const chunkBase64 = Buffer.from(chunkBuffer).toString('base64');

      const chunkSha256 = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        chunkBase64
      );

      const chunkResponse = await fetch(`${baseUrl}/api/v1/sync/upload/chunk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
          'x-upload-id': uploadId,
          'x-chunk-index': chunkIndex.toString(),
          'x-chunk-sha256': chunkSha256,
        },
        body: chunkBuffer,
      });

      if (!chunkResponse.ok) {
        throw new Error(`Chunk ${chunkIndex} upload failed with status ${chunkResponse.status}`);
      }
    }

    // 3. Finalize upload
    const finalizeRes = await ApiClient.post<any>('/api/v1/sync/upload/finalize', {
      uploadId,
    });

    return finalizeRes.file;
  }
}
