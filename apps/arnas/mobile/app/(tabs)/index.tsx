import React, { useState, useEffect, useMemo } from 'react';
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
import {
  GeofenceSyncService,
  GeofenceState,
} from '../../src/services/geofence-sync.service';
import { MediaModal } from '../../src/components/MediaModal';
import { UserTutorialModal } from '../../src/components/UserTutorialModal';
import { LocationGeofenceModal } from '../../src/components/LocationGeofenceModal';
import {
  Sparkles,
  Image as ImageIcon,
  Camera,
  Play,
  MapPin,
  Wifi,
  ShieldCheck,
  ShieldAlert,
  Star,
  Film,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const COLUMN_SIZE = (width - 32 - 8) / 3; // 3 columns with gaps

export default function TimelineScreen() {
  const { user, serverUrl } = useAuthStore();
  const router = useRouter();

  const [mediaItems, setMediaItems] = useState<FileItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'photos' | 'videos' | 'favorites'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [geofence, setGeofence] = useState<GeofenceState | null>(null);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const res = await MobileFileService.listFiles(false);
      // Filter images and videos
      const media = res.items.filter(
        (i) => i.mimeType?.startsWith('image/') || i.mimeType?.startsWith('video/')
      );
      setMediaItems(media);
      const geo = await GeofenceSyncService.evaluateGeofence();
      setGeofence(geo);
    } catch (e: any) {
      console.warn('Failed to load media:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMedia();
    const unsub = GeofenceSyncService.subscribe(setGeofence);
    return unsub;
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMedia();
  };

  const filteredMedia = useMemo(() => {
    return mediaItems.filter((item) => {
      if (activeFilter === 'photos') return item.mimeType?.startsWith('image/');
      if (activeFilter === 'videos') return item.mimeType?.startsWith('video/');
      if (activeFilter === 'favorites') return item.isFavorite;
      return true;
    });
  }, [mediaItems, activeFilter]);

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
        {item.isFavorite && (
          <View style={styles.favoriteBadge}>
            <Star size={10} color="#F59E0B" fill="#F59E0B" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Geofence & Trusted Wi-Fi Status Bar */}
      <TouchableOpacity
        style={[
          styles.geofenceBar,
          geofence?.canAutoSync ? styles.geofenceBarActive : styles.geofenceBarHeld,
        ]}
        onPress={() => setShowGeofenceModal(true)}
        activeOpacity={0.8}
      >
        {geofence?.canAutoSync ? (
          <ShieldCheck size={14} color={colors.success} style={{ marginRight: 6 }} />
        ) : (
          <ShieldAlert size={14} color={colors.warning} style={{ marginRight: 6 }} />
        )}
        <Text style={styles.geofenceBarText} numberOfLines={1}>
          {geofence?.canAutoSync
            ? `📍 ${geofence.matchedLocation?.name || 'Home'} • 📶 ${geofence.currentSsid} • Auto-Sync Ready`
            : `📍 ${geofence?.statusMessage || 'Checking geofence policy...'}`}
        </Text>
      </TouchableOpacity>

      {/* Banner */}
      <Card style={styles.banner}>
        <View style={styles.bannerContent}>
          <View style={styles.avatarCircle}>
            <Sparkles size={22} color={colors.accent} />
          </View>
          <View style={styles.bannerText}>
            <Text style={styles.greeting}>Welcome, {user?.name || 'Abhijeet Raut'}</Text>
            <Text style={styles.subGreeting}>
              {user?.familyName || 'Family Cloud NAS'} • {mediaItems.length} Synced Media
            </Text>
          </View>
        </View>
      </Card>

      {/* Filter Chips */}
      <View style={styles.filterChipsRow}>
        <TouchableOpacity
          style={[styles.chip, activeFilter === 'all' && styles.chipActive]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.chipText, activeFilter === 'all' && styles.chipTextActive]}>
            All Media
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, activeFilter === 'photos' && styles.chipActive]}
          onPress={() => setActiveFilter('photos')}
        >
          <Text style={[styles.chipText, activeFilter === 'photos' && styles.chipTextActive]}>
            Photos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, activeFilter === 'videos' && styles.chipActive]}
          onPress={() => setActiveFilter('videos')}
        >
          <Text style={[styles.chipText, activeFilter === 'videos' && styles.chipTextActive]}>
            Videos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, activeFilter === 'favorites' && styles.chipActive]}
          onPress={() => setActiveFilter('favorites')}
        >
          <Text style={[styles.chipText, activeFilter === 'favorites' && styles.chipTextActive]}>
            Favorites ⭐
          </Text>
        </TouchableOpacity>
      </View>

      {/* Media Grid or Empty State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredMedia.length > 0 ? (
        <FlatList
          data={filteredMedia}
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

      {/* Location Geofence Modal */}
      <LocationGeofenceModal
        visible={showGeofenceModal}
        onClose={() => {
          setShowGeofenceModal(false);
          loadMedia();
        }}
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
  geofenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  geofenceBarActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  geofenceBarHeld: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  geofenceBarText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
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
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '700',
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
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  syncActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  syncActionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
});
