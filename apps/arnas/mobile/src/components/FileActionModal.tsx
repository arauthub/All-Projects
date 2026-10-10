import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from './Card';
import { Button } from './Button';
import { FileItem, MobileFileService } from '../services/file.service';
import {
  Share2,
  Star,
  Edit2,
  Copy,
  Download,
  Trash2,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  HardDrive,
  Check,
} from 'lucide-react-native';

interface Props {
  visible: boolean;
  file: FileItem | null;
  onClose: () => void;
  onShare: (file: FileItem) => void;
  onRefresh: () => void;
}

export function FileActionModal({ visible, file, onClose, onShare, onRefresh }: Props) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!file) return null;

  const formatSize = (bytesStr: string) => {
    const bytes = parseInt(bytesStr, 10) || 0;
    if (bytes === 0) return 'Directory';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleToggleFavorite = async () => {
    try {
      await MobileFileService.toggleFavorite(file.id);
      onRefresh();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDuplicate = async () => {
    try {
      setLoading(true);
      await MobileFileService.duplicateFile(file.id);
      Alert.alert('Duplicated', `Created copy of "${file.name}"`);
      onRefresh();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRename = () => {
    setRenameText(file.name);
    setIsRenaming(true);
  };

  const handleSaveRename = async () => {
    if (!renameText.trim()) return;
    try {
      setLoading(true);
      await MobileFileService.renameFile(file.id, renameText.trim());
      setIsRenaming(false);
      onRefresh();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Move to Trash',
      `Move "${file.name}" to the recycle bin? You can restore it anytime within 30 days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Trash',
          style: 'destructive',
          onPress: async () => {
            await MobileFileService.deleteFile(file.id);
            onRefresh();
            onClose();
          },
        },
      ]
    );
  };

  const handleDownload = async () => {
    try {
      Alert.alert('Downloading', `Saving "${file.name}" to device storage...`);
      await MobileFileService.downloadFile(file.id, file.name);
      Alert.alert('Downloaded', `Saved to device successfully.`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.modalContent}>
          {/* File Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileMeta}>
                {formatSize(file.sizeBytes)} • {file.mimeType || 'Folder'} • {file.isSharedVault ? 'Family Vault' : 'Personal Drive'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {isRenaming ? (
            <View style={styles.renameBox}>
              <Text style={styles.fieldLabel}>Rename</Text>
              <TextInput
                style={styles.input}
                value={renameText}
                onChangeText={setRenameText}
                autoFocus
              />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsRenaming(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Save"
                  variant="primary"
                  onPress={handleSaveRename}
                  loading={loading}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.actionsList}>
              {/* Share */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  onClose();
                  onShare(file);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
                  <Share2 size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.actionTitle}>Share File Link</Text>
                  <Text style={styles.actionDesc}>Generate expiring link with optional password</Text>
                </View>
              </TouchableOpacity>

              {/* Favorite */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleToggleFavorite}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIcon,
                    {
                      backgroundColor: file.isFavorite
                        ? 'rgba(245, 158, 11, 0.2)'
                        : colors.surfaceHighlight,
                    },
                  ]}
                >
                  <Star
                    size={18}
                    color={file.isFavorite ? '#F59E0B' : colors.textSecondary}
                    fill={file.isFavorite ? '#F59E0B' : 'transparent'}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.actionTitle}>
                    {file.isFavorite ? 'Remove from Starred' : 'Add to Starred'}
                  </Text>
                  <Text style={styles.actionDesc}>Quick access in the Starred collection</Text>
                </View>
              </TouchableOpacity>

              {/* Rename */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleStartRename}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.surfaceHighlight }]}>
                  <Edit2 size={18} color={colors.primaryLight} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.actionTitle}>Rename</Text>
                  <Text style={styles.actionDesc}>Change the file or folder name</Text>
                </View>
              </TouchableOpacity>

              {/* Duplicate */}
              {!file.isDirectory && (
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleDuplicate}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.surfaceHighlight }]}>
                    <Copy size={18} color={colors.textPrimary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.actionTitle}>Duplicate File</Text>
                    <Text style={styles.actionDesc}>Create an instant copy</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Download */}
              {!file.isDirectory && (
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={handleDownload}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.surfaceHighlight }]}>
                    <Download size={18} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.actionTitle}>Download to Device</Text>
                    <Text style={styles.actionDesc}>Save offline copy to phone</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Move to Trash */}
              <TouchableOpacity
                style={[styles.actionRow, { borderBottomWidth: 0 }]}
                onPress={handleDelete}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                  <Trash2 size={18} color={colors.danger} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.actionTitle, { color: colors.danger }]}>Move to Trash</Text>
                  <Text style={styles.actionDesc}>Hold in 30-day recovery buffer</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  fileMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  closeBtn: {
    padding: 4,
  },
  actionsList: {
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionDesc: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  renameBox: {
    paddingVertical: 10,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 8,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
