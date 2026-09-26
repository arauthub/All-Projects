import * as MediaLibrary from 'expo-media-library/legacy';
import { SQLiteService } from './sqlite.service';

export class MediaScannerService {
  /**
   * Request read permissions for Camera Roll / DCIM
   */
  public static async requestPermissions(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Scan camera roll and journal media items in SQLite
   */
  public static async scanCameraRoll(limit: number = 100): Promise<number> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.warn('Media Library permission denied');
      return 0;
    }

    const { assets } = await MediaLibrary.getAssetsAsync({
      first: limit,
      sortBy: [MediaLibrary.SortBy.creationTime],
      mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
    });

    let ingestedCount = 0;

    for (const asset of assets) {
      await SQLiteService.upsertAsset({
        id: asset.id,
        filename: asset.filename,
        uri: asset.uri,
        size: (asset as any).fileSize || 1024 * 1024,
        mimeType: asset.mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        creationTime: asset.creationTime,
      });
      ingestedCount++;
    }

    return ingestedCount;
  }
}
