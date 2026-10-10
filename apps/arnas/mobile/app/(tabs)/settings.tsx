import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { StorageMeter } from '../../src/components/StorageMeter';
import { useAuthStore } from '../../src/stores/authStore';
import {
  User,
  Wifi,
  BatteryCharging,
  Cloud,
  Server,
  Layers,
  ShieldCheck,
  ClipboardList,
  ChevronRight,
  Sparkles,
  MapPin,
  Activity,
  Trash2,
  HardDrive,
} from 'lucide-react-native';
import { StorageClusterModal } from '../../src/components/StorageClusterModal';
import { ExternalDriveModal } from '../../src/components/ExternalDriveModal';
import { E2EESecurityModal } from '../../src/components/E2EESecurityModal';
import { AuditTrailModal } from '../../src/components/AuditTrailModal';
import { UserTutorialModal } from '../../src/components/UserTutorialModal';
import { LocationGeofenceModal } from '../../src/components/LocationGeofenceModal';
import { NASStorageHealthModal } from '../../src/components/NASStorageHealthModal';
import { RecycleBinModal } from '../../src/components/RecycleBinModal';

export default function SettingsScreen() {
  const { user, serverUrl } = useAuthStore();

  const [wifiOnly, setWifiOnly] = useState(true);
  const [chargingOnly, setChargingOnly] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [geofenceSyncOnly, setGeofenceSyncOnly] = useState(true);

  // Modals
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [showE2EEModal, setShowE2EEModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showExternalDriveModal, setShowExternalDriveModal] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <User size={24} color={colors.accent} />
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.userName}>{user?.name || 'Abhijeet Raut'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'theabhijeetraut@gmail.com'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.role || 'ADMIN'}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Storage Quota Usage */}
      <Card style={styles.sectionCard}>
        <StorageMeter
          usedBytes={user?.usedStorageBytes || 2415919104}
          quotaBytes={user?.storageQuotaBytes || 107374182400}
        />
      </Card>

      {/* Enterprise NAS Architecture & Security */}
      <Text style={styles.sectionTitle}>Enterprise NAS Infrastructure</Text>
      <Card style={styles.sectionCard}>
        {/* Location & Trusted Wi-Fi Geofence */}
        <TouchableOpacity
          style={styles.enterpriseRow}
          onPress={() => setShowGeofenceModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.enterpriseIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
            <MapPin size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.enterpriseTitle}>Location & Trusted Wi-Fi</Text>
              <View style={[styles.activePill, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                <Text style={[styles.activePillText, { color: colors.accent }]}>GEOFENCE</Text>
              </View>
            </View>
            <Text style={styles.enterpriseDesc}>Auto-sync only in trusted sites & Wi-Fi networks</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* NAS Storage Health & S.M.A.R.T. */}
        <TouchableOpacity
          style={styles.enterpriseRow}
          onPress={() => setShowHealthModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.enterpriseIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Activity size={20} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.enterpriseTitle}>NAS Health & S.M.A.R.T.</Text>
              <View style={[styles.activePill, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Text style={[styles.activePillText, { color: colors.success }]}>HEALTHY</Text>
              </View>
            </View>
            <Text style={styles.enterpriseDesc}>RAID pools, IOPS, temperatures & volume metrics</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Recycle Bin & Trash */}
        <TouchableOpacity
          style={styles.enterpriseRow}
          onPress={() => setShowTrashModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.enterpriseIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Trash2 size={20} color={colors.danger} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.enterpriseTitle}>Recycle Bin (Trash Recovery)</Text>
            <Text style={styles.enterpriseDesc}>Restore soft-deleted files within 30-day buffer</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* External HDD / SSD Storage */}
        <TouchableOpacity
          style={styles.enterpriseRow}
          onPress={() => setShowExternalDriveModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.enterpriseIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <HardDrive size={20} color={colors.cyan || '#38BDF8'} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.enterpriseTitle}>External HDD / SSD Storage</Text>
              <View style={[styles.activePill, { backgroundColor: 'rgba(56, 189, 248, 0.2)' }]}>
                <Text style={[styles.activePillText, { color: colors.cyan || '#38BDF8' }]}>WIRELESS TARGET</Text>
              </View>
            </View>
            <Text style={styles.enterpriseDesc}>Direct mobile Wi-Fi sync to connected USB/Thunderbolt drives</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Storage Cluster */}
        <TouchableOpacity
          style={styles.enterpriseRow}
          onPress={() => setShowClusterModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.enterpriseIconBox}>
            <Layers size={20} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.enterpriseTitle}>Multi-Node Storage Cluster</Text>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>MULTI-NODE</Text>
              </View>
            </View>
            <Text style={styles.enterpriseDesc}>Configure S3, MinIO & Local redundancy</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Zero-Knowledge E2EE */}
        <TouchableOpacity
          style={styles.enterpriseRow}
          onPress={() => setShowE2EEModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.enterpriseIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <ShieldCheck size={20} color={colors.success} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.enterpriseTitle}>Zero-Knowledge E2EE Vault</Text>
              <View style={[styles.activePill, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Text style={[styles.activePillText, { color: colors.success }]}>AES-256-GCM</Text>
              </View>
            </View>
            <Text style={styles.enterpriseDesc}>Client-side key derivation & recovery</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Audit Logs */}
        <TouchableOpacity
          style={styles.enterpriseRow}
          onPress={() => setShowAuditModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.enterpriseIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <ClipboardList size={20} color="#F59E0B" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.enterpriseTitle}>Compliance Audit Trail</Text>
            <Text style={styles.enterpriseDesc}>Immutable security & access logs</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Backup Sentinel Policies */}
      <Text style={styles.sectionTitle}>Sync & Geofence Policies</Text>
      <Card style={styles.sectionCard}>
        {/* Geofence Rule Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <MapPin size={18} color={colors.accent} style={styles.settingIcon} />
            <View>
              <Text style={styles.settingLabel}>Sync Only in Trusted Locations</Text>
              <Text style={styles.settingDesc}>Enforces location geofence & trusted Wi-Fi</Text>
            </View>
          </View>
          <Switch
            value={geofenceSyncOnly}
            onValueChange={setGeofenceSyncOnly}
            trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
            thumbColor={colors.textPrimary}
          />
        </View>

        <View style={styles.divider} />

        {/* Wi-Fi Rule */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Wifi size={18} color={colors.accent} style={styles.settingIcon} />
            <View>
              <Text style={styles.settingLabel}>Upload on Wi-Fi Only</Text>
              <Text style={styles.settingDesc}>Prevents consuming mobile data</Text>
            </View>
          </View>
          <Switch
            value={wifiOnly}
            onValueChange={setWifiOnly}
            trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
            thumbColor={colors.textPrimary}
          />
        </View>

        <View style={styles.divider} />

        {/* Charging Rule */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <BatteryCharging size={18} color={colors.accent} style={styles.settingIcon} />
            <View>
              <Text style={styles.settingLabel}>Sync Only When Charging</Text>
              <Text style={styles.settingDesc}>Preserves battery on the go</Text>
            </View>
          </View>
          <Switch
            value={chargingOnly}
            onValueChange={setChargingOnly}
            trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
            thumbColor={colors.textPrimary}
          />
        </View>

        <View style={styles.divider} />

        {/* Auto Camera Roll */}
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Cloud size={18} color={colors.accent} style={styles.settingIcon} />
            <View>
              <Text style={styles.settingLabel}>Automatic Camera Roll Backup</Text>
              <Text style={styles.settingDesc}>Auto-detect and upload newly captured media</Text>
            </View>
          </View>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
            thumbColor={colors.textPrimary}
          />
        </View>
      </Card>

      {/* Orientation Tutorial */}
      <Text style={styles.sectionTitle}>Help & Tutorial</Text>
      <Card style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.enterpriseRow}
          onPress={() => setShowTutorialModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.enterpriseIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Sparkles size={20} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.enterpriseTitle}>App Walkthrough Tutorial</Text>
            <Text style={styles.enterpriseDesc}>Revisit location geofencing, NAS health & E2EE</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Network Server Info */}
      <Text style={styles.sectionTitle}>Connection Host</Text>
      <Card style={styles.sectionCard}>
        <View style={styles.serverRow}>
          <Server size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.serverLabel}>Connected Host</Text>
            <Text style={styles.serverValue}>{serverUrl}</Text>
          </View>
        </View>
      </Card>

      {/* Modals */}
      <LocationGeofenceModal
        visible={showGeofenceModal}
        onClose={() => setShowGeofenceModal(false)}
      />
      <NASStorageHealthModal
        visible={showHealthModal}
        onClose={() => setShowHealthModal(false)}
      />
      <RecycleBinModal
        visible={showTrashModal}
        onClose={() => setShowTrashModal(false)}
      />
      <ExternalDriveModal
        visible={showExternalDriveModal}
        onClose={() => setShowExternalDriveModal(false)}
      />
      <StorageClusterModal
        visible={showClusterModal}
        onClose={() => setShowClusterModal(false)}
      />
      <E2EESecurityModal
        visible={showE2EEModal}
        onClose={() => setShowE2EEModal(false)}
      />
      <AuditTrailModal
        visible={showAuditModal}
        onClose={() => setShowAuditModal(false)}
      />
      <UserTutorialModal
        visible={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
      />

      <View style={{ height: 40 }} />
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
  profileCard: {
    padding: 16,
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileDetails: {
    flex: 1,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  userEmail: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  roleText: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 10,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  enterpriseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  enterpriseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enterpriseTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  enterpriseDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  activePillText: {
    color: colors.primaryLight,
    fontSize: 9,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  settingDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  serverValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
});
