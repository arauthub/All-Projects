import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { SyncEngine, SyncProgressUpdate } from '../../src/services/sync-engine.service';
import { SQLiteService, SyncStats } from '../../src/services/sqlite.service';
import { SentinelService } from '../../src/services/sentinel.service';
import {
  GeofenceSyncService,
  GeofenceState,
} from '../../src/services/geofence-sync.service';
import { LocationGeofenceModal } from '../../src/components/LocationGeofenceModal';
import { useAuthStore } from '../../src/stores/authStore';
import {
  RefreshCw,
  CheckCircle2,
  Wifi,
  BatteryCharging,
  Play,
  UploadCloud,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Sliders,
  HardDrive,
  Compass,
} from 'lucide-react-native';

export default function SyncScreen() {
  const { refreshProfile } = useAuthStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('All media up to date');
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [stats, setStats] = useState<SyncStats>({ totalSynced: 0, inQueue: 0, failed: 0 });
  const [hwStatus, setHwStatus] = useState({
    isWifi: true,
    isCharging: false,
    batteryPercent: 100,
  });
  const [geofence, setGeofence] = useState<GeofenceState | null>(null);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const currentStats = await SQLiteService.getSyncStats();
      setStats(currentStats);
      const hardware = await SentinelService.getHardwareStatus();
      setHwStatus(hardware);
      const geo = await GeofenceSyncService.evaluateGeofence();
      setGeofence(geo);
    } catch {
      // Ignore
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = GeofenceSyncService.subscribe(setGeofence);
    return unsub;
  }, []);

  const handleStartSync = async () => {
    setIsSyncing(true);
    try {
      await SyncEngine.runSyncCycle(
        { wifiOnly: true, chargingOnly: false, trustedGeofenceOnly: true },
        (update: SyncProgressUpdate) => {
          setIsSyncing(update.isSyncing);
          setStatusMessage(update.statusMessage);
          setActiveFile(update.activeFile || null);
          loadData();
        }
      );
      await refreshProfile();
    } catch (err: any) {
      setStatusMessage(`Sync paused: ${err.message}`);
    } finally {
      setIsSyncing(false);
      await loadData();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {/* Geofence Radar & Trusted Wi-Fi Hero Banner */}
      <Card
        style={[
          styles.radarCard,
          geofence?.canAutoSync
            ? styles.radarCardActive
            : geofence?.isInsideGeofence
            ? styles.radarCardWarning
            : styles.radarCardHeld,
        ]}
      >
        <View style={styles.radarTopRow}>
          <View style={styles.radarTitleRow}>
            <View
              style={[
                styles.radarIconBox,
                {
                  backgroundColor: geofence?.canAutoSync
                    ? 'rgba(16, 185, 129, 0.2)'
                    : geofence?.isInsideGeofence
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)',
                },
              ]}
            >
              <Radio
                size={20}
                color={
                  geofence?.canAutoSync
                    ? colors.success
                    : geofence?.isInsideGeofence
                    ? colors.warning
                    : colors.danger
                }
              />
            </View>
            <View>
              <Text style={styles.radarTitle}>
                {geofence?.canAutoSync
                  ? 'GEOFENCE & TRUSTED WI-FI ACTIVE'
                  : geofence?.isInsideGeofence
                  ? 'UNTRUSTED WI-FI DETECTED'
                  : 'OUTSIDE TRUSTED GEOFENCE'}
              </Text>
              <Text style={styles.radarSubtitle}>
                {geofence?.matchedLocation
                  ? `${geofence.matchedLocation.name} (${geofence.distanceMeters}m)`
                  : 'Roaming / Roaming Network'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.configureGeofenceBtn}
            onPress={() => setShowGeofenceModal(true)}
            activeOpacity={0.8}
          >
            <Sliders size={14} color={colors.accent} style={{ marginRight: 4 }} />
            <Text style={styles.configureGeofenceText}>Configure</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.radarDesc}>{geofence?.statusMessage}</Text>

        <View style={styles.geofenceMetaRow}>
          <View style={styles.metaPill}>
            <Wifi size={12} color={geofence?.isTrustedWifi ? colors.success : colors.warning} style={{ marginRight: 4 }} />
            <Text style={styles.metaPillText}>{geofence?.currentSsid || 'No Wi-Fi'}</Text>
          </View>

          {geofence?.matchedLocation && (
            <View style={styles.metaPill}>
              <HardDrive size={12} color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={styles.metaPillText}>{geofence.matchedLocation.targetStorageName}</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Sentinel Hardware Status Pill */}
      <View style={styles.statusPill}>
        <View style={styles.pillItem}>
          <Wifi
            size={14}
            color={hwStatus.isWifi ? colors.accent : colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.pillText}>
            {hwStatus.isWifi ? 'Wi-Fi Connected' : 'Cellular Data'}
          </Text>
        </View>
        <View style={styles.pillDivider} />
        <View style={styles.pillItem}>
          <BatteryCharging
            size={14}
            color={hwStatus.isCharging ? colors.success : colors.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.pillText}>
            {hwStatus.isCharging ? 'Charging' : 'Battery'} ({hwStatus.batteryPercent}%)
          </Text>
        </View>
      </View>

      {/* Main Sync Status Hero Card */}
      <Card style={styles.heroCard} elevated>
        <View style={styles.heroHeader}>
          <View style={styles.heroIconCircle}>
            {isSyncing ? (
              <RefreshCw size={28} color={colors.accent} />
            ) : stats.inQueue > 0 ? (
              <UploadCloud size={28} color={colors.primaryLight} />
            ) : (
              <CheckCircle2 size={28} color={colors.success} />
            )}
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>
              {isSyncing
                ? 'Synchronizing Media...'
                : stats.inQueue > 0
                ? `${stats.inQueue} Items Waiting in Queue`
                : 'All Media Backed Up'}
            </Text>
            <Text style={styles.heroSubtitle}>{statusMessage}</Text>
          </View>
        </View>

        {isSyncing && activeFile && (
          <View style={styles.activeUploadSection}>
            <View style={styles.uploadMetaRow}>
              <Text style={styles.uploadFileName} numberOfLines={1}>
                {activeFile}
              </Text>
              <Text style={styles.uploadChunkText}>Streaming chunks @ 14.8 MB/s</Text>
            </View>
            <ProgressBar progress={0.72} color={colors.accent} height={8} />
          </View>
        )}

        <View style={styles.heroActions}>
          <Button
            title={isSyncing ? 'Syncing...' : 'Sync Camera Roll Now'}
            variant="primary"
            onPress={handleStartSync}
            disabled={isSyncing}
            loading={isSyncing}
            icon={<Play size={18} color={colors.textPrimary} />}
          />
        </View>
      </Card>

      {/* Sync Ledger Metrics */}
      <Text style={styles.sectionHeader}>Local Journal Status</Text>
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {stats.totalSynced}
          </Text>
          <Text style={styles.statLabel}>Backed Up</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>
            {stats.inQueue}
          </Text>
          <Text style={styles.statLabel}>In Queue</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text
            style={[
              styles.statNumber,
              { color: stats.failed > 0 ? colors.danger : colors.textPrimary },
            ]}
          >
            {stats.failed}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </Card>
      </View>

      {/* Geofence Modal */}
      <LocationGeofenceModal
        visible={showGeofenceModal}
        onClose={() => {
          setShowGeofenceModal(false);
          loadData();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  radarCard: {
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
  },
  radarCardActive: {
    borderLeftColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  radarCardWarning: {
    borderLeftColor: colors.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  radarCardHeld: {
    borderLeftColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  radarTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  radarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radarTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  radarSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  configureGeofenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  configureGeofenceText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  radarDesc: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  geofenceMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaPillText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  statusPill: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.surfaceCard,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  pillDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: 12,
    alignSelf: 'center',
  },
  heroCard: {
    padding: 20,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  activeUploadSection: {
    marginBottom: 16,
  },
  uploadMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  uploadFileName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  uploadChunkText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  heroActions: {
    marginTop: 4,
  },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});
