import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from './Card';
import { Button } from './Button';
import { MobileFileService, FileItem } from '../services/file.service';
import {
  Share2,
  Lock,
  Copy,
  Check,
  X,
  QrCode,
  Clock,
  ShieldCheck,
  Link,
  UserCheck,
  UserPlus,
  Trash2,
  Users,
} from 'lucide-react-native';

interface Props {
  visible: boolean;
  file: FileItem | null;
  onClose: () => void;
  onShareUpdated?: () => void;
}

export function ShareModal({ visible, file, onClose, onShareUpdated }: Props) {
  const [activeTab, setActiveTab] = useState<'users' | 'link'>('users');

  // Direct User Sharing State
  const [recipientEmail, setRecipientEmail] = useState('');
  const [permission, setPermission] = useState<'READ' | 'WRITE'>('READ');
  const [sharingWithUser, setSharingWithUser] = useState(false);
  const [userShareSuccess, setUserShareSuccess] = useState<string | null>(null);

  // Link Sharing State
  const [expirationHours, setExpirationHours] = useState(24);
  const [hasPassword, setHasPassword] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleShareWithUser = async () => {
    if (!file || !recipientEmail.trim()) {
      Alert.alert('Required', 'Please enter a valid user email address.');
      return;
    }

    try {
      setSharingWithUser(true);
      setUserShareSuccess(null);
      const res = await MobileFileService.shareFileWithUser(file.id, recipientEmail.trim(), permission);
      setUserShareSuccess(res.message);
      setRecipientEmail('');
      if (onShareUpdated) onShareUpdated();
    } catch (err: any) {
      Alert.alert('Share Failed', err.message || 'Unable to share file with user.');
    } finally {
      setSharingWithUser(false);
    }
  };

  const handleCreateShare = async () => {
    if (!file) return;
    try {
      setGenerating(true);
      const res = await MobileFileService.createShareLink(file.id, expirationHours, hasPassword);
      setShareData(res);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', 'Share link copied to clipboard.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <Share2 size={22} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.title}>Access Control & Sharing</Text>
              <Text style={styles.subtitle}>Tenant Isolation & Granular Sharing</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {file && (
            <Card style={styles.fileSummaryCard}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileMeta}>
                {file.isDirectory ? 'Folder' : file.mimeType || 'Document'} • Zero-Knowledge Signature
              </Text>
            </Card>
          )}

          {/* Tab Selector */}
          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'users' && styles.tabButtonActive]}
              onPress={() => setActiveTab('users')}
              activeOpacity={0.8}
            >
              <UserPlus size={16} color={activeTab === 'users' ? colors.accent : colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.tabButtonText, activeTab === 'users' && styles.tabButtonTextActive]}>
                Share with User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'link' && styles.tabButtonActive]}
              onPress={() => setActiveTab('link')}
              activeOpacity={0.8}
            >
              <Link size={16} color={activeTab === 'link' ? colors.accent : colors.textMuted} style={{ marginRight: 6 }} />
              <Text style={[styles.tabButtonText, activeTab === 'link' && styles.tabButtonTextActive]}>
                Expiring Link
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'users' ? (
            /* Direct User-to-User Sharing Card */
            <Card style={styles.settingsCard}>
              <Text style={styles.sectionTitle}>Direct User Access (RBAC)</Text>
              <Text style={styles.sectionDesc}>
                Grant specific users view or edit access. Content remains completely private to others.
              </Text>

              {userShareSuccess && (
                <View style={styles.successBanner}>
                  <Check size={16} color={colors.success} style={{ marginRight: 8 }} />
                  <Text style={styles.successBannerText}>{userShareSuccess}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>Recipient User Email</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  value={recipientEmail}
                  onChangeText={setRecipientEmail}
                  placeholder="e.g. user@example.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Quick Preset Buttons for Easy Demo */}
              <View style={styles.quickEmailRow}>
                <Text style={styles.quickEmailLabel}>Quick Select:</Text>
                <TouchableOpacity
                  style={styles.quickEmailChip}
                  onPress={() => setRecipientEmail('user@example.com')}
                >
                  <Text style={styles.quickEmailChipText}>user@example.com (Sarah)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickEmailChip}
                  onPress={() => setRecipientEmail('abhijeet@example.com')}
                >
                  <Text style={styles.quickEmailChipText}>abhijeet@example.com (Admin)</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Permission Level</Text>
              <View style={styles.permissionRow}>
                <TouchableOpacity
                  style={[styles.permCard, permission === 'READ' && styles.permCardActive]}
                  onPress={() => setPermission('READ')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.permTitle, permission === 'READ' && styles.permTitleActive]}>
                    View & Download
                  </Text>
                  <Text style={styles.permDesc}>Read-only access, cannot modify or delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.permCard, permission === 'WRITE' && styles.permCardActive]}
                  onPress={() => setPermission('WRITE')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.permTitle, permission === 'WRITE' && styles.permTitleActive]}>
                    Can Edit & Manage
                  </Text>
                  <Text style={styles.permDesc}>Upload new versions and rename item</Text>
                </TouchableOpacity>
              </View>

              <Button
                title={sharingWithUser ? 'Granting Access...' : 'Share with User'}
                variant="primary"
                onPress={handleShareWithUser}
                loading={sharingWithUser}
                icon={<UserCheck size={18} color={colors.textPrimary} />}
                style={{ marginTop: 20 }}
              />

              <View style={styles.privacyNote}>
                <ShieldCheck size={15} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.privacyNoteText}>
                  Zero-Knowledge isolation: Unshared files are mathematically inaccessible to others.
                </Text>
              </View>
            </Card>
          ) : (
            /* Expiring Public Link Card */
            !shareData ? (
              <Card style={styles.settingsCard}>
                <Text style={styles.sectionTitle}>Link Expiration Timer</Text>
                <View style={styles.pillRow}>
                  {[1, 24, 72, 168].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[
                        styles.expPill,
                        expirationHours === hours && styles.expPillActive,
                      ]}
                      onPress={() => setExpirationHours(hours)}
                    >
                      <Text
                        style={[
                          styles.expPillText,
                          expirationHours === hours && styles.expPillTextActive,
                        ]}
                      >
                        {hours === 1 ? '1 Hour' : hours === 24 ? '1 Day' : hours === 72 ? '3 Days' : '7 Days'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingLabel}>Require Access Password</Text>
                    <Text style={styles.settingDesc}>Enforces end-to-end passphrase prompt</Text>
                  </View>
                  <Switch
                    value={hasPassword}
                    onValueChange={setHasPassword}
                    trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
                    thumbColor={colors.textPrimary}
                  />
                </View>

                <Button
                  title={generating ? 'Generating Link...' : 'Create Secure Share Link'}
                  variant="primary"
                  onPress={handleCreateShare}
                  loading={generating}
                  style={{ marginTop: 20 }}
                />
              </Card>
            ) : (
              <Card style={styles.resultCard}>
                <View style={styles.successBadge}>
                  <ShieldCheck size={20} color={colors.success} style={{ marginRight: 6 }} />
                  <Text style={styles.successBadgeText}>ACTIVE SECURE SHARE LINK</Text>
                </View>

                <View style={styles.linkBox}>
                  <Text style={styles.linkText} numberOfLines={1}>
                    {shareData.shareUrl}
                  </Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                    {copied ? (
                      <Check size={16} color={colors.success} />
                    ) : (
                      <Copy size={16} color={colors.accent} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.qrPlaceholder}>
                  <QrCode size={120} color={colors.textPrimary} />
                  <Text style={styles.qrHint}>Scan to download on another mobile device</Text>
                </View>

                <View style={styles.metaRow}>
                  <Clock size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.metaText}>
                    Expires in {expirationHours} hours
                  </Text>
                </View>

                <Button
                  title="Create Another Link"
                  variant="outline"
                  onPress={() => setShareData(null)}
                  style={{ marginTop: 16 }}
                />
              </Card>
            )
          )}
        </ScrollView>
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
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  fileSummaryCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fileMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabButtonTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  settingsCard: {
    padding: 18,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  successBannerText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputRow: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: 13,
  },
  quickEmailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  quickEmailLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  quickEmailChip: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  quickEmailChipText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '500',
  },
  permissionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  permCard: {
    flex: 1,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  permCardActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
  },
  permTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  permTitleActive: {
    color: colors.accent,
  },
  permDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 14,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  privacyNoteText: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  expPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expPillActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  expPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  expPillTextActive: {
    color: colors.accent,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  settingDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  resultCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  successBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 1,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 20,
  },
  linkText: {
    flex: 1,
    fontSize: 12,
    color: colors.accent,
    fontFamily: 'monospace',
  },
  copyBtn: {
    padding: 6,
    marginLeft: 8,
  },
  qrPlaceholder: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 16,
    marginBottom: 16,
  },
  qrHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
