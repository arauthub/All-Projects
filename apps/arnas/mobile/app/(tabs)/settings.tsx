import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { StorageMeter } from '../../src/components/StorageMeter';
import { Button } from '../../src/components/Button';
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
  BookOpen,
  Lock,
  RefreshCw,
  Users,
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
  const router = useRouter();
  const { user, serverUrl, login } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [wifiOnly, setWifiOnly] = useState(true);
  const [chargingOnly, setChargingOnly] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [geofenceSyncOnly, setGeofenceSyncOnly] = useState(true);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Modals
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [showE2EEModal, setShowE2EEModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showExternalDriveModal, setShowExternalDriveModal] = useState(false);

  const handleSwitchAccount = async () => {
    try {
      setSwitchingRole(true);
      if (isAdmin) {
        await login('user@example.com', 'UserPassword123!', serverUrl);
        Alert.alert('Role Switched', 'You are now signed in as Standard User (user@example.com). Storage drive configs are now hidden and access is isolated.');
      } else {
        await login('abhijeet@example.com', 'AdminPassword123!', serverUrl);
        Alert.alert('Role Switched', 'You are now signed in as Administrator (abhijeet@example.com). Storage drive controls and cluster admin privileges restored.');
      }
    } catch (e: any) {
      Alert.alert('Switch Failed', e.message || 'Cannot switch account in offline mode.');
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: isAdmin ? 'rgba(6, 182, 212, 0.15)' : 'rgba(99, 102, 241, 0.15)' },
            ]}
          >
            <User size={24} color={isAdmin ? colors.accent : colors.primaryLight} />
          </View>
          <View style={styles.profileDetails}>
            <Text style={styles.userName}>{user?.name || (isAdmin ? 'Abhijeet Raut' : 'Sarah Raut')}</Text>
            <Text style={styles.userEmail}>{user?.email || (isAdmin ? 'abhijeet@example.com' : 'user@example.com')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: isAdmin ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)' },
                ]}
              >
                <Text
                  style={[
                    styles.roleText,
                    { color: isAdmin ? colors.accent : colors.primaryLight },
                  ]}
                >
                  {isAdmin ? 'ADMINISTRATOR 👑' : 'STANDARD USER 👤'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Role Switcher for Seamless Demo */}
        <TouchableOpacity
          style={styles.switchAccountBtn}
          onPress={handleSwitchAccount}
          disabled={switchingRole}
          activeOpacity={0.8}
        >
          <RefreshCw size={14} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={styles.switchAccountBtnText}>
            {switchingRole
              ? 'Switching Account...'
              : isAdmin
              ? 'Switch to Standard User (Sarah)'
              : 'Switch to Administrator (Abhijeet)'}
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Storage Quota Usage */}
      <Card style={styles.sectionCard}>
        <StorageMeter
          usedBytes={user?.usedStorageBytes || 2415919104}
          quotaBytes={user?.storageQuotaBytes || (isAdmin ? 107374182400 : 53687091200)}
        />
      </Card>

      {/* Enterprise NAS Storage Infrastructure (Admin Only vs Member Info) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>
          {isAdmin ? 'Storage Infrastructure (Administrator)' : 'Storage Infrastructure Status'}
        </Text>
        <View
          style={[
            styles.authorityPill,
            { backgroundColor: isAdmin ? 'rgba(6, 182, 212, 0.15)' : 'rgba(100, 116, 139, 0.15)' },
          ]}
        >
          <Text
            style={[
              styles.authorityPillText,
              { color: isAdmin ? colors.accent : colors.textMuted },
            ]}
          >
            {isAdmin ? 'FULL ADMIN' : 'RESTRICTED'}
          </Text>
        </View>
      </View>

      {isAdmin ? (
        <Card style={styles.sectionCard}>
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
              <Text style={styles.enterpriseDesc}>Mount USB/Thunderbolt drives & route mobile uploads</Text>
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
              <Text style={styles.enterpriseDesc}>Configure S3, MinIO & Local redundancy tiers</Text>
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
            <View style={[styles.enterpriseIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Activity size={20} color={colors.success} />
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
              <Text style={styles.enterpriseDesc}>Immutable security & cluster access logs</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      ) : (
        <Card style={styles.sectionCard}>
          <View style={styles.nonAdminInfoBox}>
            <Lock size={20} color={colors.accent} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nonAdminTitle}>Hardware & Cluster Managed by Admin</Text>
              <Text style={styles.nonAdminDesc}>
                Physical SSD/HDD mountings, cluster nodes, and S.M.A.R.T. diagnostics are controlled by administrators. Your personal photos and documents are strictly isolated in your private vault.
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Personal Vault & Cloud Security (Available to All Roles) */}
      <Text style={styles.sectionTitle}>Personal Vault & Cloud Security</Text>
      <Card style={styles.sectionCard}>
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
            <Text style={styles.enterpriseDesc}>Client-side key derivation & recovery phrase</Text>
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

        <View style={styles.divider} />

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
      </Card>

      {/* Sync & Geofence Policies */}
      <Text style={styles.sectionTitle}>Sync & Mobile Policies</Text>
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

      {/* Help & Documentation (Dedicated Site Guide) */}
      <Text style={styles.sectionTitle}>Help & Documentation</Text>
      <Card style={styles.sectionCard}>
        {/* Dedicated Role-Based Site Guide */}
        <TouchableOpacity
          style={styles.enterpriseRow}
          onPress={() => router.push('/(tabs)/guide' as any)}
          activeOpacity={0.7}
        >
          <View style={[styles.enterpriseIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
            <BookOpen size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.enterpriseTitle}>Site Guide & Flow Center</Text>
              <View style={[styles.activePill, { backgroundColor: 'rgba(6, 182, 212, 0.2)' }]}>
                <Text style={[styles.activePillText, { color: colors.accent }]}>ROLE-BASED</Text>
              </View>
            </View>
            <Text style={styles.enterpriseDesc}>
              {isAdmin
                ? 'Full cluster, drive hot-plugging & deployment flows'
                : 'Personal cloud explorer, auto-sync & sharing guidelines'}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* App Walkthrough Tutorial */}
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  switchAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.borderHighlight,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 14,
  },
  switchAccountBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  authorityPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  authorityPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  nonAdminInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: 10,
    padding: 12,
  },
  nonAdminTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
  },
  nonAdminDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
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
