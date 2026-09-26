import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../theme/colors';
import { FileItem, MobileFileService } from '../services/file.service';
import { X, Download, Share2, Calendar, HardDrive, Check, Info } from 'lucide-react-native';

interface MediaModalProps {
  visible: boolean;
  file: FileItem | null;
  serverUrl: string;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

const { width, height } = Dimensions.get('window');

export const MediaModal: React.FC<MediaModalProps> = ({
  visible,
  file,
  serverUrl,
  onClose,
  onDelete,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!file) return null;

  const imageUrl = `${serverUrl}/api/v1/files/${file.id}/download`;
  const thumbnailUrl = file.thumbnailUrl ? `${serverUrl}${file.thumbnailUrl}` : undefined;

  const formatBytes = (bytesStr: string): string => {
    const bytes = Number(bytesStr);
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await MobileFileService.downloadFile(file.id, file.name);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    } catch (e: any) {
      alert(`Download failed: ${e.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: file.name,
        message: `Sharing ${file.name} from ARNAS Private Drive`,
        url: imageUrl,
      });
    } catch (e) {
      // User cancelled
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
            <X size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {file.name}
            </Text>
          </View>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Info size={20} color={showDetails ? colors.accent : colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
              <Share2 size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Media Preview Centerpiece */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            placeholder={{ uri: thumbnailUrl }}
            style={styles.fullImage}
            contentFit="contain"
            transition={300}
          />
        </View>

        {/* Detailed Metadata Drawer */}
        {showDetails && (
          <View style={styles.detailsDrawer}>
            <View style={styles.detailRow}>
              <HardDrive size={15} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.detailLabel}>Size:</Text>
              <Text style={styles.detailValue}>{formatBytes(file.sizeBytes)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Calendar size={15} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(file.takenAt || file.createdAt).toLocaleDateString()}
              </Text>
            </View>
            {file.checksumSha256 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>SHA-256:</Text>
                <Text style={styles.detailHash} numberOfLines={1} ellipsizeMode="middle">
                  {file.checksumSha256}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom Actions Floating Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.downloadBtn, downloaded && styles.downloadBtnDone]}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : downloaded ? (
              <>
                <Check size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.downloadText}>Saved to Device</Text>
              </>
            ) : (
              <>
                <Download size={18} color={colors.textPrimary} style={{ marginRight: 6 }} />
                <Text style={styles.downloadText}>Download Offline</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000000E6',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#00000088',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width,
    height: height * 0.7,
  },
  detailsDrawer: {
    backgroundColor: colors.surfaceCard,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  detailHash: {
    color: colors.accent,
    fontSize: 12,
    flex: 1,
    fontFamily: 'monospace',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    width: '100%',
  },
  downloadBtnDone: {
    backgroundColor: colors.success,
  },
  downloadText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
