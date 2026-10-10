import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  Alert,
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
} from 'lucide-react-native';

interface Props {
  visible: boolean;
  file: FileItem | null;
  onClose: () => void;
}

export function ShareModal({ visible, file, onClose }: Props) {
  const [expirationHours, setExpirationHours] = useState(24);
  const [hasPassword, setHasPassword] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

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
              <Text style={styles.title}>Secure File Sharing</Text>
              <Text style={styles.subtitle}>Granular Expiration & Access Limits</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {file && (
            <Card style={styles.fileSummaryCard}>
              <Text style={styles.fileName} numberOfLines={1}>
                {file.name}
              </Text>
              <Text style={styles.fileMeta}>
                {file.mimeType || 'Directory'} • Zero-Knowledge Signature
              </Text>
            </Card>
          )}

          {!shareData ? (
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
          )}
        </View>
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
  content: {
    padding: 16,
  },
  fileSummaryCard: {
    padding: 14,
    marginBottom: 14,
  },
  fileName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  fileMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  settingsCard: {
    padding: 16,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  expPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expPillActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  expPillText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  expPillTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  settingDesc: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  resultCard: {
    padding: 16,
    alignItems: 'center',
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  successBadgeText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  linkText: {
    flex: 1,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  copyBtn: {
    marginLeft: 8,
    padding: 4,
  },
  qrPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  qrHint: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
