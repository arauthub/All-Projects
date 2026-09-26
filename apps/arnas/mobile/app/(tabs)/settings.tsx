import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { colors } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { StorageMeter } from '../../src/components/StorageMeter';
import { useAuthStore } from '../../src/stores/authStore';
import { User, Wifi, BatteryCharging, Cloud, LogOut, Server, Layers, ShieldCheck, ClipboardList, ChevronRight, Sparkles } from 'lucide-react-native';
import { StorageClusterModal } from '../../src/components/StorageClusterModal';
import { E2EESecurityModal } from '../../src/components/E2EESecurityModal';
import { AuditTrailModal } from '../../src/components/AuditTrailModal';
import { UserTutorialModal } from '../../src/components/UserTutorialModal';

export default function SettingsScreen() {
  const { user, serverUrl, logout } = useAuthStore();

  const [wifiOnly, setWifiOnly] = useState(true);
  const [chargingOnly, setChargingOnly] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Enterprise Modals
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [showE2EEModal, setShowE2EEModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

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
            <Text style={styles.userEmail}>{user?.email || 'abhijeet@example.com'}</Text>
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

      {/* Enterprise Security & Multi-Storage Cluster */}
      <Text style={styles.sectionTitle}>Enterprise Architecture</Text>
      <Card style={styles.sectionCard}>
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
              <Text style={styles.enterpriseTitle}>Storage Cluster</Text>
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
              <Text style={styles.enterpriseTitle}>Zero-Knowledge E2EE</Text>
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

      {/* Backup Sentinel Rules */}
      <Text style={styles.sectionTitle}>Sync & Battery Policies</Text>
      <Card style={styles.sectionCard}>
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

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Cloud size={18} color={colors.accent} style={styles.settingIcon} />
            <View>
              <Text style={styles.settingLabel}>Automatic Camera Roll Backup</Text>
              <Text style={styles.settingDesc}>Detect and upload newly taken media</Text>
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

      {/* Help & Walkthrough */}
      <Text style={styles.sectionTitle}>Help & Orientation</Text>
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
            <Text style={styles.enterpriseDesc}>Revisit features, sentinel sync & zero-knowledge security</Text>
          </View>
          <ChevronRight size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* Network Server Info */}
      <Text style={styles.sectionTitle}>Connection</Text>
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
        isManualLaunch
      />

      {/* Logout */}
      <Button
        title="Sign Out of Family Cloud"
        variant="danger"
        onPress={logout}
        icon={<LogOut size={18} color={colors.textPrimary} />}
        style={styles.logoutBtn}
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
  profileCard: {
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
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
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCard: {
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  settingDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  serverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  serverValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  logoutBtn: {
    marginTop: 20,
    marginBottom: 32,
  },
  enterpriseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  enterpriseIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  enterpriseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  enterpriseDesc: {
    fontSize: 12,
    color: colors.textSecondary,
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
    fontSize: 9,
    fontWeight: '700',
    color: colors.primaryLight,
  },
});
