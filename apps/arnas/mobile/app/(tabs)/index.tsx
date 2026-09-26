import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { useAuthStore } from '../../src/stores/authStore';
import { MobileFileService, FileItem } from '../../src/services/file.service';
import { MediaModal } from '../../src/components/MediaModal';
import { UserTutorialModal } from '../../src/components/UserTutorialModal';
import { Sparkles, Image as ImageIcon, Camera, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const COLUMN_SIZE = (width - 32 - 8) / 3; // 3 columns with gaps

export default function TimelineScreen() {
  const { user, serverUrl } = useAuthStore();
  const router = useRouter();

  const [mediaItems, setMediaItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await MobileFileService.listFiles(false);
      // Filter images and videos
      const media = res.items.filter(
        (i) => i.mimeType?.startsWith('image/') || i.mimeType?.startsWith('video/')
      );
      setMediaItems(media);
    } catch (e: any) {
      console.warn('Failed to load media:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMedia();
  };

  const renderGridItem = ({ item }: { item: FileItem }) => {
    const isVideo = item.mimeType?.startsWith('video/');
    const thumbUri = item.thumbnailUrl
      ? `${serverUrl}${item.thumbnailUrl}`
      : `${serverUrl}/api/v1/files/${item.id}/download`;

    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPress={() => setSelectedFile(item)}
      >
        <Image
          source={{ uri: thumbUri }}
          style={styles.gridImage}
          contentFit="cover"
          transition={200}
        />
        {isVideo && (
          <View style={styles.videoBadge}>
            <Play size={12} color={colors.textPrimary} fill={colors.textPrimary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Banner */}
      <Card style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.avatarCircle}>
            <Sparkles size={22} color={colors.accent} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.greeting}>Welcome, {user?.name || 'Family Member'}</Text>
            <Text style={styles.subGreeting}>
              {user?.familyName || 'Family Cloud'} • {mediaItems.length} Media Synced
            </Text>
          </View>
        </View>
      </Card>

      {/* Media Grid or Empty State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : mediaItems.length > 0 ? (
        <FlatList
          data={mediaItems}
          keyExtractor={(item) => item.id}
          renderItem={renderGridItem}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ImageIcon size={44} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your Family Timeline</Text>
          <Text style={styles.emptySubtitle}>
            Photos and videos backed up from your mobile devices will appear here automatically, organized chronologically.
          </Text>
          <TouchableOpacity
            style={styles.syncActionBtn}
            onPress={() => router.push('/(tabs)/sync')}
            activeOpacity={0.8}
          >
            <Camera size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.syncActionText}>Start Mobile Backup</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Media Viewer Modal */}
      <MediaModal
        visible={!!selectedFile}
        file={selectedFile}
        serverUrl={serverUrl}
        onClose={() => setSelectedFile(null)}
      />

      {/* New User Walkthrough / Onboarding Tutorial */}
      <UserTutorialModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    margin: 16,
    marginBottom: 12,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  greeting: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  subGreeting: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  gridRow: {
    gap: 4,
    marginBottom: 4,
  },
  gridItem: {
    width: COLUMN_SIZE,
    height: COLUMN_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceCard,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  syncActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  syncActionText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
});
