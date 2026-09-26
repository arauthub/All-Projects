import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ProgressBar } from '../../src/components/ProgressBar';
import { SyncEngine, SyncProgressUpdate } from '../../src/services/sync-engine.service';
import { SQLiteService, SyncStats } from '../../src/services/sqlite.service';
import { SentinelService } from '../../src/services/sentinel.service';
import { useAuthStore } from '../../src/stores/authStore';
import {
  RefreshCw,
  CheckCircle2,
  Wifi,
  BatteryCharging,
  Play,
  Pause,
  AlertTriangle,
  UploadCloud,
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
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const currentStats = await SQLiteService.getSyncStats();
      setStats(currentStats);
      const hardware = await SentinelService.getHardwareStatus();
      setHwStatus(hardware);
    } catch (e) {
      // Ignore
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartSync = async () => {
    setIsSyncing(true);
    try {
      await SyncEngine.runSyncCycle(
        { wifiOnly: true, chargingOnly: false },
        (update: SyncProgressUpdate) => {
          setIsSyncing(update.isSyncing);
          setStatusMessage(update.statusMessage);
          setActiveFile(update.activeFile || null);
          loadData();
        }
      );
      await refreshProfile();
    } catch (err: any) {
      setStatusMessage(`Sync error: ${err.message}`);
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
              <Text style={styles.uploadChunkText}>Uploading chunks</Text>
            </View>
            <ProgressBar progress={0.65} color={colors.accent} height={8} />
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
          <Text style={[styles.statNumber, { color: stats.failed > 0 ? colors.danger : colors.textPrimary }]}>
            {stats.failed}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </Card>
      </View>
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
  statusPill: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: colors.surfaceCard,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    alignItems: 'center',
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.borderHighlight,
    marginHorizontal: 12,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  heroCard: {
    marginBottom: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  activeUploadSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  uploadMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  uploadFileName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  uploadChunkText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  heroActions: {
    marginTop: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
