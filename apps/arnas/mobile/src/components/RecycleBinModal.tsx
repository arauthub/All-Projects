import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from './Card';
import { Button } from './Button';
import { MobileFileService, FileItem } from '../services/file.service';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  HardDrive,
} from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  onRestored?: () => void;
}

export function RecycleBinModal({ visible, onClose, onRestored }: Props) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTrash = async () => {
    try {
      setLoading(true);
      const res = await MobileFileService.listTrash();
      setItems(res.items);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadTrash();
    }
  }, [visible]);

  const handleRestore = async (id: string, name: string) => {
    try {
      await MobileFileService.restoreFile(id);
      Alert.alert('Restored', `"${name}" restored to your cloud drive.`);
      await loadTrash();
      onRestored?.();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handlePermanentDelete = (id: string, name: string) => {
    Alert.alert(
      'Permanently Delete',
      `Are you sure you want to permanently purge "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge Forever',
          style: 'destructive',
          onPress: async () => {
            await MobileFileService.permanentDelete(id);
            await loadTrash();
          },
        },
      ]
    );
  };

  const handleEmptyTrash = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Empty Recycle Bin',
      `Permanently delete all ${items.length} items from the recycle bin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Empty Everything',
          style: 'destructive',
          onPress: async () => {
            await MobileFileService.emptyTrash();
            await loadTrash();
          },
        },
      ]
    );
  };

  const formatSize = (bytesStr: string) => {
    const bytes = parseInt(bytesStr, 10) || 0;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderIcon = (mime?: string) => {
    if (mime?.startsWith('image/')) return <ImageIcon size={20} color={colors.accent} />;
    if (mime?.startsWith('video/')) return <Film size={20} color={colors.primaryLight} />;
    return <FileText size={20} color="#F59E0B" />;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <Trash2 size={22} color={colors.danger} />
            </View>
            <View>
              <Text style={styles.title}>Recycle Bin & Trash</Text>
              <Text style={styles.subtitle}>30-Day Safe Recovery Buffer</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Action Banner */}
        {items.length > 0 && (
          <View style={styles.banner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerText}>
                {items.length} soft-deleted items stored in trash buffer.
              </Text>
              <Text style={styles.bannerSubText}>
                Items are permanently purged after 30 days.
              </Text>
            </View>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleEmptyTrash} activeOpacity={0.8}>
              <Trash2 size={13} color={colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={styles.emptyBtnText}>Empty Trash</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Trash List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIconCircle}>
              <Trash2 size={40} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Recycle Bin is Clean</Text>
            <Text style={styles.emptyDesc}>
              No deleted items. Deleted files and media remain here for 30 days before permanent erasure.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemIconCircle}>{renderIcon(item.mimeType)}</View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemMeta}>
                      {formatSize(item.sizeBytes)} • Auto-purges in {item.daysRemaining || 30} days
                    </Text>
                  </View>
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.restoreBtn}
                    onPress={() => handleRestore(item.id, item.name)}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={14} color={colors.accent} style={{ marginRight: 4 }} />
                    <Text style={styles.restoreBtnText}>Restore File</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.purgeBtn}
                    onPress={() => handlePermanentDelete(item.id, item.name)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color={colors.danger} style={{ marginRight: 4 }} />
                    <Text style={styles.purgeBtnText}>Purge Permanently</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  bannerSubText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
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
    padding: 16,
  },
  itemCard: {
    padding: 14,
    marginBottom: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  itemMeta: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  restoreBtnText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  purgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  purgeBtnText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
});
