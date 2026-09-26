import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  X,
  FileKey,
} from 'lucide-react-native';
import { theme } from '../theme';
import { E2EEService } from '../crypto/e2ee.service';
import { ApiClient } from '../api/client';

interface E2EESecurityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const E2EESecurityModal: React.FC<E2EESecurityModalProps> = ({ visible, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Setup state
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);

  const checkStatus = async () => {
    try {
      setLoading(true);
      const active = await E2EEService.isE2EEActive();
      setIsActive(active);
      setIsUnlocked(E2EEService.isVaultUnlocked());

      if (active) {
        const storedMnemonic = await E2EEService.getRecoveryPhrase();
        setMnemonic(storedMnemonic);
      }
    } catch (err: any) {
      console.warn('E2EE check error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      checkStatus();
    }
  }, [visible]);

  const handleSetup = async () => {
    if (passphrase.length < 8) {
      Alert.alert('Security Requirement', 'Master passphrase must be at least 8 characters long.');
      return;
    }

    if (passphrase !== confirmPassphrase) {
      Alert.alert('Passphrase Mismatch', 'Confirmation passphrase does not match.');
      return;
    }

    try {
      setLoading(true);
      const setup = await E2EEService.setupE2EE(passphrase);
      setMnemonic(setup.recoveryPhrase);

      // Register public key & salt on ARNAS server
      await ApiClient.post('/api/v1/e2ee/enable', {
        encryptionSalt: setup.salt,
        publicKey: setup.publicKey,
        encryptedPrivateKey: setup.encryptedPrivateKey,
        keyDerivationIterations: 100000,
        recoveryHint: 'User Master Key derived via PBKDF2',
      });

      setIsActive(true);
      setIsUnlocked(true);
      setPassphrase('');
      setConfirmPassphrase('');
      Alert.alert(
        'Zero-Knowledge E2EE Activated',
        'Your cryptographic vault is now initialized. Please securely write down your 12-word recovery mnemonic.'
      );
    } catch (err: any) {
      Alert.alert('E2EE Initialization Failed', err.message || 'Error configuring crypto engine');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    if (!passphrase) {
      Alert.alert('Error', 'Please enter your master passphrase');
      return;
    }

    setLoading(true);
    const success = await E2EEService.unlockVault(passphrase);
    setLoading(false);

    if (success) {
      setIsUnlocked(true);
      setPassphrase('');
      Alert.alert('Vault Unlocked', 'Zero-Knowledge cryptographic keys loaded into memory.');
    } else {
      Alert.alert('Unlock Failed', 'Invalid master passphrase.');
    }
  };

  const handleLock = () => {
    E2EEService.lockVault();
    setIsUnlocked(false);
    Alert.alert('Vault Locked', 'Master keys purged from memory.');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                <ShieldCheck color={isActive ? theme.colors.success : theme.colors.primary} size={22} />
              </View>
              <View>
                <Text style={styles.title}>Zero-Knowledge E2EE</Text>
                <Text style={styles.subtitle}>End-to-End Client Encryption</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={theme.colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Guarantee Badge */}
            <View style={styles.guaranteeBox}>
              <Lock color={theme.colors.success} size={18} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.guaranteeTitle}>True Zero-Knowledge Architecture</Text>
                <Text style={styles.guaranteeText}>
                  Data is encrypted on your device using AES-256-GCM before transmission. Neither ARNAS servers nor network eavesdroppers have access to your decryption keys.
                </Text>
              </View>
            </View>

            {/* Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Vault Status:</Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusDot,
                      isActive ? styles.statusDotActive : styles.statusDotInactive,
                    ]}
                  />
                  <Text style={styles.statusValueText}>
                    {isActive ? (isUnlocked ? 'UNLOCKED (ACTIVE)' : 'LOCKED (PROTECTED)') : 'NOT CONFIGURED'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Algorithm:</Text>
                <Text style={styles.statusValueSub}>AES-256-GCM / PBKDF2 (100k)</Text>
              </View>
            </View>

            {/* Setup / Unlock Form */}
            {!isActive ? (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Initialize Master Encryption Key</Text>
                <Text style={styles.formSubtitle}>
                  Choose a strong master passphrase to derive your client-side encryption keys.
                </Text>

                <Text style={styles.inputLabel}>Master Passphrase</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter Master Passphrase"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showPassphrase}
                    value={passphrase}
                    onChangeText={setPassphrase}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassphrase(!showPassphrase)}
                    style={styles.eyeBtn}
                  >
                    {showPassphrase ? (
                      <EyeOff color={theme.colors.textMuted} size={18} />
                    ) : (
                      <Eye color={theme.colors.textMuted} size={18} />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Confirm Passphrase</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter Master Passphrase"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showPassphrase}
                  value={confirmPassphrase}
                  onChangeText={setConfirmPassphrase}
                />

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleSetup}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Key color="#FFF" size={16} />
                      <Text style={styles.primaryBtnText}>Activate Zero-Knowledge Vault</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : !isUnlocked ? (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Unlock Cryptographic Vault</Text>
                <Text style={styles.formSubtitle}>
                  Enter your master passphrase to load your decryption keys into local memory.
                </Text>

                <Text style={styles.inputLabel}>Master Passphrase</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Master Passphrase"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry
                  value={passphrase}
                  onChangeText={setPassphrase}
                />

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleUnlock}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Unlock color="#FFF" size={16} />
                      <Text style={styles.primaryBtnText}>Unlock Vault</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.unlockedBox}>
                  <CheckCircle color={theme.colors.success} size={24} />
                  <Text style={styles.unlockedTitle}>Cryptographic Engine Armed</Text>
                  <Text style={styles.unlockedSubtitle}>
                    All camera roll backups and personal files are transparently encrypted and decrypted on this device.
                  </Text>
                </View>

                <TouchableOpacity style={styles.lockBtn} onPress={handleLock}>
                  <Lock color={theme.colors.danger} size={16} />
                  <Text style={styles.lockBtnText}>Lock Vault & Clear Memory</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 12-Word Recovery Mnemonic Card */}
            {mnemonic && (
              <View style={styles.mnemonicCard}>
                <View style={styles.mnemonicHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FileKey color={theme.colors.primary} size={18} />
                    <Text style={styles.mnemonicTitle}>12-Word Recovery Phrase</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowMnemonic(!showMnemonic)}
                    style={styles.togglePhraseBtn}
                  >
                    <Text style={styles.togglePhraseText}>
                      {showMnemonic ? 'Hide' : 'Reveal'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showMnemonic ? (
                  <View style={styles.wordGrid}>
                    {mnemonic.split(' ').map((word, index) => (
                      <View key={index} style={styles.wordChip}>
                        <Text style={styles.wordIndex}>{index + 1}.</Text>
                        <Text style={styles.wordText}>{word}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.mnemonicHiddenText}>
                    Phrase hidden for security. Tap Reveal to view your emergency mnemonic phrase.
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
  },
  content: {
    paddingHorizontal: 20,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  guaranteeText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 17,
  },
  statusCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotActive: {
    backgroundColor: theme.colors.success,
  },
  statusDotInactive: {
    backgroundColor: theme.colors.textMuted,
  },
  statusValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statusValueSub: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 14,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.text,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.text,
  },
  eyeBtn: {
    padding: 10,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  unlockedBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  unlockedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  unlockedSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  lockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    marginTop: 14,
    gap: 6,
  },
  lockBtnText: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  mnemonicCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mnemonicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mnemonicTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    marginLeft: 8,
  },
  togglePhraseBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.colors.surface,
  },
  togglePhraseText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  wordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  wordChip: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    width: '30%',
  },
  wordIndex: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginRight: 4,
  },
  wordText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '600',
  },
  mnemonicHiddenText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 17,
  },
});
