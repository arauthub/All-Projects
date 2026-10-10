import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { MobileFileService, FileItem } from '../../src/services/file.service';
import { MediaModal } from '../../src/components/MediaModal';
import { CreateFolderModal } from '../../src/components/CreateFolderModal';
import { FileActionModal } from '../../src/components/FileActionModal';
import { ShareModal } from '../../src/components/ShareModal';
import { RecycleBinModal } from '../../src/components/RecycleBinModal';
import { NASStorageHealthModal } from '../../src/components/NASStorageHealthModal';
import { ExternalDriveModal } from '../../src/components/ExternalDriveModal';
import {
  Folder,
  Star,
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  Image as ImageIcon,
  Film,
  Lock,
  Search,
  Activity,
  MoreVertical,
  ArrowLeft,
  FolderPlus,
  Upload,
  HardDrive,
} from 'lucide-react-native';

export default function FilesScreen() {
  const { serverUrl, refreshProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'starred' | 'vault'>('all');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentFolder, setCurrentFolder] = useState<{ id?: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedMedia, setSelectedMedia] = useState<FileItem | null>(null);
  const [actionFile, setActionFile] = useState<FileItem | null>(null);
  const [shareFile, setShareFile] = useState<FileItem | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [showNasHealth, setShowNasHealth] = useState(false);
  const [showExternalDrives, setShowExternalDrives] = useState(false);

  const isVault = activeTab === 'vault';

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

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      if (activeTab === 'starred' && !f.isFavorite) return false;
      if (searchQuery.trim()) {
        return f.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [files, activeTab, searchQuery]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await MobileFileService.uploadLocalFile(
        asset.uri,
        asset.fileName || `media_${Date.now()}.jpg`,
        asset.mimeType || 'image/jpeg',
        isVault,
        currentFolder?.id
      );
      loadFiles();
      refreshProfile();
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await MobileFileService.uploadLocalFile(
        asset.uri,
        asset.name,
        asset.mimeType || 'application/octet-stream',
        isVault,
        currentFolder?.id
      );
      loadFiles();
      refreshProfile();
    }
  };

  const handleCreateFolderSubmit = async (name: string, isShared: boolean) => {
    await MobileFileService.createFolder(name, currentFolder?.id, isShared);
    loadFiles();
  };

  const formatSize = (bytesStr: string) => {
    const bytes = parseInt(bytesStr, 10) || 0;
    if (bytes === 0) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderIcon = (item: FileItem) => {
    if (item.isDirectory) return <Folder size={22} color={colors.accent} fill={colors.accent} />;
    if (item.isEncrypted) return <Lock size={20} color={colors.success} />;
    if (item.mimeType?.startsWith('image/')) return <ImageIcon size={20} color={colors.accent} />;
    if (item.mimeType?.startsWith('video/')) return <Film size={20} color={colors.primaryLight} />;
    return <FileText size={20} color="#F59E0B" />;
  };

  return (
    <View style={styles.container}>
      {/* Top Quick Actions Bar (NAS Health, Recycle Bin, New Folder, Upload) */}
      <View style={styles.quickBar}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => setShowNasHealth(true)}
          activeOpacity={0.8}
        >
          <Activity size={15} color={colors.accent} style={{ marginRight: 5 }} />
          <Text style={styles.quickBtnText}>NAS Health</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => setShowExternalDrives(true)}
          activeOpacity={0.8}
        >
          <HardDrive size={15} color={colors.cyan || '#38BDF8'} style={{ marginRight: 5 }} />
          <Text style={styles.quickBtnText}>External SSD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => setShowRecycleBin(true)}
          activeOpacity={0.8}
        >
          <Trash2 size={15} color={colors.danger} style={{ marginRight: 5 }} />
          <Text style={styles.quickBtnText}>Trash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => setShowCreateFolder(true)}
          activeOpacity={0.8}
        >
          <FolderPlus size={15} color={colors.primaryLight} style={{ marginRight: 5 }} />
          <Text style={styles.quickBtnText}>New Folder</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickBtn, styles.uploadQuickBtn]}
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          <Upload size={15} color={colors.textPrimary} style={{ marginRight: 5 }} />
          <Text style={[styles.quickBtnText, { color: colors.textPrimary }]}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All Files
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'starred' && styles.activeTab]}
          onPress={() => setActiveTab('starred')}
        >
          <Text style={[styles.tabText, activeTab === 'starred' && styles.activeTabText]}>
            Starred ⭐
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'vault' && styles.activeTab]}
          onPress={() => setActiveTab('vault')}
        >
          <Text style={[styles.tabText, activeTab === 'vault' && styles.activeTabText]}>
            E2EE Vault 🛡️
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBar}>
        <Search size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search files, documents, or photos..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Breadcrumb Navigation */}
      {currentFolder && (
        <View style={styles.breadcrumbBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setCurrentFolder(null)}
            activeOpacity={0.7}
          >
            <ArrowLeft size={16} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.breadcrumbText}>Root</Text>
          </TouchableOpacity>
          <ChevronRight size={14} color={colors.textMuted} style={{ marginHorizontal: 4 }} />
          <Text style={styles.currentFolderText} numberOfLines={1}>
            {currentFolder.name}
          </Text>
        </View>
      )}

      {/* File List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredFiles.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconCircle}>
            <Folder size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Folder is Empty</Text>
          <Text style={styles.emptyDesc}>
            Upload photos, documents, or create sub-folders to organize your enterprise NAS.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <Card style={styles.fileCard}>
              <TouchableOpacity
                style={styles.fileRow}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.isDirectory) {
                    setCurrentFolder({ id: item.id, name: item.name });
                  } else if (item.mimeType?.startsWith('image/') || item.mimeType?.startsWith('video/')) {
                    setSelectedMedia(item);
                  } else {
                    setActionFile(item);
                  }
                }}
              >
                <View style={styles.fileIconBox}>{renderIcon(item)}</View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.isFavorite && (
                      <Star
                        size={12}
                        color="#F59E0B"
                        fill="#F59E0B"
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </View>
                  <Text style={styles.fileMeta}>
                    {item.isDirectory ? 'Directory' : `${formatSize(item.sizeBytes)} • ${item.mimeType || 'File'}`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => setActionFile(item)}
                  activeOpacity={0.7}
                >
                  <MoreVertical size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}

      {/* Modals */}
      <CreateFolderModal
        visible={showCreateFolder}
        isSharedVault={isVault}
        onClose={() => setShowCreateFolder(false)}
        onCreate={handleCreateFolderSubmit}
      />

      <FileActionModal
        visible={!!actionFile}
        file={actionFile}
        onClose={() => setActionFile(null)}
        onShare={(f) => setShareFile(f)}
        onRefresh={loadFiles}
      />

      <ShareModal
        visible={!!shareFile}
        file={shareFile}
        onClose={() => setShareFile(null)}
      />

      <RecycleBinModal
        visible={showRecycleBin}
        onClose={() => setShowRecycleBin(false)}
        onRestored={loadFiles}
      />

      <NASStorageHealthModal
        visible={showNasHealth}
        onClose={() => setShowNasHealth(false)}
      />

      <ExternalDriveModal
        visible={showExternalDrives}
        onClose={() => setShowExternalDrives(false)}
        onTargetChanged={() => loadFiles()}
      />

      <MediaModal
        visible={!!selectedMedia}
        file={selectedMedia}
        serverUrl={serverUrl}
        onClose={() => setSelectedMedia(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  quickBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadQuickBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: colors.surfaceCard,
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.surfaceHighlight,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    padding: 0,
  },
  breadcrumbBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  currentFolderText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  fileCard: {
    marginBottom: 8,
    padding: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  fileMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  moreBtn: {
    padding: 8,
  },
});
