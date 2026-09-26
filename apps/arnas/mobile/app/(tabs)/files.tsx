import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { MobileFileService, FileItem } from '../../src/services/file.service';
import { MediaModal } from '../../src/components/MediaModal';
import {
  Folder,
  Users,
  FileText,
  HardDrive,
  Plus,
  Trash2,
  Download,
  ChevronRight,
  Image as ImageIcon,
  FileUp,
  Camera,
  Lock,
  ShieldCheck,
} from 'lucide-react-native';

export default function FilesScreen() {
  const { serverUrl, refreshProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my_files' | 'family_vault'>('my_files');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<{ id?: string; name: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  const isVault = activeTab === 'family_vault';

  const loadFiles = async () => {
    try {
      setLoading(true);
      const res = await MobileFileService.listFiles(isVault, currentFolder?.id);
      setFiles(res.items);
    } catch (err: any) {
      console.warn('Failed to load files:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [activeTab, currentFolder]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFiles();
  };

  const handlePickImage = async () => {
    setShowUploadMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await performUpload(
        asset.uri,
        asset.fileName || `media_${Date.now()}.jpg`,
        asset.mimeType || 'image/jpeg'
      );
    }
  };

  const handlePickDocument = async () => {
    setShowUploadMenu(false);
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await performUpload(
        asset.uri,
        asset.name,
        asset.mimeType || 'application/octet-stream'
      );
    }
  };

  const performUpload = async (uri: string, name: string, mime: string) => {
    setUploading(true);
    setUploadProgressText(`Uploading ${name}...`);
    try {
      await MobileFileService.uploadLocalFile(
        uri,
        name,
        mime,
        isVault,
        currentFolder?.id
      );
      await refreshProfile();
      await loadFiles();
      Alert.alert('Upload Complete', `${name} is now saved to ARNAS.`);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Error syncing file to server.');
    } finally {
      setUploading(false);
      setUploadProgressText('');
    }
  };

  const handleDelete = (fileId: string, filename: string) => {
    Alert.alert(
      'Delete File',
      `Move "${filename}" to trash? Storage quota will be freed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MobileFileService.deleteFile(fileId);
              setFiles((prev) => prev.filter((f) => f.id !== fileId));
              await refreshProfile();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const formatSize = (bytesStr: string): string => {
    const bytes = Number(bytesStr);
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderItem = ({ item }: { item: FileItem }) => {
    const isImage = item.mimeType?.startsWith('image/');
    const isVideo = item.mimeType?.startsWith('video/');
    const thumbUri = item.thumbnailUrl ? `${serverUrl}${item.thumbnailUrl}` : undefined;

    return (
      <TouchableOpacity
        style={styles.fileCard}
        activeOpacity={0.7}
        onPress={() => {
          if (item.isDirectory) {
            setCurrentFolder({ id: item.id, name: item.name });
          } else {
            setSelectedFile(item);
          }
        }}
      >
        <View style={styles.iconColumn}>
          {item.isDirectory ? (
            <Folder size={28} color={colors.accent} />
          ) : thumbUri ? (
            <Image source={{ uri: thumbUri }} style={styles.thumbnail} contentFit="cover" />
          ) : isImage || isVideo ? (
            <ImageIcon size={26} color={colors.primaryLight} />
          ) : (
            <FileText size={26} color={colors.textSecondary} />
          )}
        </View>

        <View style={styles.fileDetails}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isEncrypted && (
              <View style={styles.e2eeBadge}>
                <Lock size={10} color={colors.success} style={{ marginRight: 3 }} />
                <Text style={styles.e2eeBadgeText}>E2EE</Text>
              </View>
            )}
          </View>
          <Text style={styles.fileMeta}>
            {item.isDirectory
              ? 'Folder'
              : `${formatSize(item.sizeBytes)} • ${new Date(
                  item.takenAt || item.createdAt
                ).toLocaleDateString()}`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Trash2 size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Scope Segment Tabs */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'my_files' && styles.segmentBtnActive]}
          onPress={() => {
            setActiveTab('my_files');
            setCurrentFolder(null);
          }}
          activeOpacity={0.8}
        >
          <HardDrive
            size={16}
            color={activeTab === 'my_files' ? colors.accent : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.segmentText, activeTab === 'my_files' && styles.segmentTextActive]}
          >
            My Private Space
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'family_vault' && styles.segmentBtnActive]}
          onPress={() => {
            setActiveTab('family_vault');
            setCurrentFolder(null);
          }}
          activeOpacity={0.8}
        >
          <Users
            size={16}
            color={activeTab === 'family_vault' ? colors.accent : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.segmentText, activeTab === 'family_vault' && styles.segmentTextActive]}
          >
            Family Vault
          </Text>
        </TouchableOpacity>
      </View>

      {/* Breadcrumb Navigation */}
      {currentFolder && (
        <View style={styles.breadcrumbBar}>
          <TouchableOpacity onPress={() => setCurrentFolder(null)}>
            <Text style={styles.breadcrumbRoot}>Root</Text>
          </TouchableOpacity>
          <ChevronRight size={14} color={colors.textMuted} style={{ marginHorizontal: 4 }} />
          <Text style={styles.breadcrumbCurrent}>{currentFolder.name}</Text>
        </View>
      )}

      {/* Uploading Banner */}
      {uploading && (
        <View style={styles.uploadingBanner}>
          <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
          <Text style={styles.uploadingText}>{uploadProgressText}</Text>
        </View>
      )}

      {/* Files List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Folder size={44} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {isVault ? 'Family Vault is Empty' : 'No Files in Private Space'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Tap the (+) button below to upload documents or photos.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => setShowUploadMenu(true)}
      >
        <Plus size={24} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Upload Choice Modal */}
      <Modal
        visible={showUploadMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUploadMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowUploadMenu(false)}
        >
          <View style={styles.uploadSheet}>
            <Text style={styles.sheetTitle}>Upload to {isVault ? 'Family Vault' : 'My Drive'}</Text>
            <TouchableOpacity style={styles.sheetOption} onPress={handlePickImage}>
              <Camera size={20} color={colors.accent} style={styles.sheetIcon} />
              <View>
                <Text style={styles.sheetOptionTitle}>Photo or Video</Text>
                <Text style={styles.sheetOptionSub}>Select from device camera roll</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={handlePickDocument}>
              <FileUp size={20} color={colors.primaryLight} style={styles.sheetIcon} />
              <View>
                <Text style={styles.sheetOptionTitle}>Document or File</Text>
                <Text style={styles.sheetOptionSub}>PDFs, archives, raw files</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Fullscreen Photo Viewer */}
      <MediaModal
        visible={!!selectedFile}
        file={selectedFile}
        serverUrl={serverUrl}
        onClose={() => setSelectedFile(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: colors.surfaceCard,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: colors.surfaceHighlight,
  },
  segmentText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.textPrimary,
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  breadcrumbRoot: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  breadcrumbCurrent: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 16,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  uploadingText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconColumn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  fileMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  deleteAction: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  uploadSheet: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: colors.borderHighlight,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetIcon: {
    marginRight: 14,
  },
  sheetOptionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  sheetOptionSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  e2eeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  e2eeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.success,
  },
});
