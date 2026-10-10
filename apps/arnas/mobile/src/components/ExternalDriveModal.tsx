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
  Dimensions,
} from 'react-native';
import {
  HardDrive,
  Zap,
  Disc,
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Gauge,
  Thermometer,
  ShieldCheck,
  X,
  Radio,
  ArrowRight,
  LogOut,
  Sliders,
} from 'lucide-react-native';
import { theme } from '../theme';
import {
  ExternalDriveService,
  ExternalDriveInfo,
  BenchmarkResult,
} from '../services/external-drive.service';

interface ExternalDriveModalProps {
  visible: boolean;
  onClose: () => void;
  onTargetChanged?: (driveName: string) => void;
}

export const ExternalDriveModal: React.FC<ExternalDriveModalProps> = ({
  visible,
  onClose,
  onTargetChanged,
}) => {
  const [loading, setLoading] = useState(false);
  const [drives, setDrives] = useState<ExternalDriveInfo[]>([]);
  const [primaryTarget, setPrimaryTarget] = useState<ExternalDriveInfo | null>(null);

  // Add drive form
  const [showAddForm, setShowAddForm] = useState(false);
  const [customPath, setCustomPath] = useState('/Volumes/Samsung_T7');
  const [customName, setCustomName] = useState('Samsung T7 Shield 2TB');
  const [customMediaType, setCustomMediaType] = useState<'SSD' | 'HDD' | 'NVME'>('SSD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Benchmark state
  const [benchmarkingDriveId, setBenchmarkingDriveId] = useState<string | null>(null);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await ExternalDriveService.getExternalDrives();
      setDrives(res.drives);
      setPrimaryTarget(res.primaryTarget);
    } catch (err: any) {
      Alert.alert('Drive Scan Error', err.message || 'Failed to detect external drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchDrives();
    }
  }, [visible]);

  const handleSetPrimary = async (drive: ExternalDriveInfo) => {
    try {
      setLoading(true);
      await ExternalDriveService.setPrimaryWirelessTarget(drive.nodeId || drive.id);
      Alert.alert(
        '🎯 Wireless Sync Target Updated',
        `Mobile photos, videos, and vaults will now auto-sync wirelessly directly to ${drive.name} when connected to trusted Wi-Fi.`
      );
      if (onTargetChanged) {
        onTargetChanged(drive.name);
      }
      await fetchDrives();
    } catch (err: any) {
      Alert.alert('Target Update Failed', err.message || 'Unable to update sync target');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachDrive = async () => {
    if (!customPath.trim()) {
      Alert.alert('Validation Error', 'Mount path is required (e.g. /Volumes/Samsung_T7)');
      return;
    }
    try {
      setIsSubmitting(true);
      const attached = await ExternalDriveService.attachDrive({
        mountPath: customPath.trim(),
        name: customName.trim() || undefined,
        mediaType: customMediaType,
        setAsPrimaryTarget: true,
      });
      Alert.alert(
        '✅ External Drive Attached',
        `${attached.name} verified and set as primary wireless NAS target!`
      );
      setShowAddForm(false);
      if (onTargetChanged) {
        onTargetChanged(attached.name);
      }
      await fetchDrives();
    } catch (err: any) {
      Alert.alert('Attach Error', err.message || 'Failed to attach external drive');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBenchmark = async (drive: ExternalDriveInfo) => {
    try {
      setBenchmarkingDriveId(drive.id);
      const result = await ExternalDriveService.benchmarkDrive(drive.mountPath);
      setBenchmarkResult(result);
    } catch (err: any) {
      Alert.alert('Benchmark Error', err.message || 'Failed to benchmark drive');
    } finally {
      setBenchmarkingDriveId(null);
    }
  };

  const handleEject = async (drive: ExternalDriveInfo) => {
    Alert.alert(
      'Safely Eject Drive',
      `Flush pending sync buffers and disconnect ${drive.name}? Primary storage will fallback to server internal NVMe.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Eject Drive',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await ExternalDriveService.ejectDrive(drive.nodeId || drive.id);
              Alert.alert('Drive Safely Ejected', 'You can now safely unplug the hardware drive.');
              await fetchDrives();
            } catch (err: any) {
              Alert.alert('Eject Failed', err.message || 'Could not eject drive');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSimulatePreset = async (preset: 'samsung_t7' | 'seagate_hdd' | 'sandisk_ssd') => {
    try {
      setLoading(true);
      const attached = await ExternalDriveService.simulatePreset(preset);
      Alert.alert('⚡ Drive Simulated', `${attached.name} mounted and set as active wireless sync target.`);
      if (onTargetChanged) {
        onTargetChanged(attached.name);
      }
      await fetchDrives();
    } catch (err: any) {
      Alert.alert('Simulation Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytesStr: string) => {
    const bytes = Number(bytesStr);
    if (!bytes || isNaN(bytes)) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb > 900) {
      return `${(gb / 1024).toFixed(1)} TB`;
    }
    return `${Math.round(gb)} GB`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <HardDrive size={22} color={theme.colors.cyan} />
              </View>
              <View>
                <Text style={styles.headerTitle}>External HDD / SSD NAS</Text>
                <Text style={styles.headerSubtitle}>Direct Wireless Mobile-to-Drive Storage</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={fetchDrives}
                disabled={loading}
              >
                <RefreshCw size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconButton} onPress={onClose}>
                <X size={20} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Live Pipeline Banner */}
            <View style={styles.pipelineCard}>
              <View style={styles.pipelineHeader}>
                <Radio size={16} color={theme.colors.emerald} />
                <Text style={styles.pipelineTitle}>ACTIVE WIRELESS STORAGE PIPELINE</Text>
                <View style={styles.onlineBadge}>
                  <Text style={styles.onlineBadgeText}>READY</Text>
                </View>
              </View>

              <View style={styles.pipelineFlow}>
                <View style={styles.flowNode}>
                  <Wifi size={18} color={theme.colors.cyan} />
                  <Text style={styles.flowLabel}>Mobile Phone</Text>
                  <Text style={styles.flowSub}>Wi-Fi 6</Text>
                </View>
                <ArrowRight size={16} color={theme.colors.textMuted} />
                <View style={styles.flowNode}>
                  <Radio size={18} color={theme.colors.primary} />
                  <Text style={styles.flowLabel}>ARNAS Server</Text>
                  <Text style={styles.flowSub}>LAN 1 Gbps</Text>
                </View>
                <ArrowRight size={16} color={theme.colors.textMuted} />
                <View style={[styles.flowNode, styles.flowNodeActive]}>
                  {primaryTarget?.mediaType === 'HDD' ? (
                    <Disc size={18} color={theme.colors.warning} />
                  ) : (
                    <Zap size={18} color={theme.colors.emerald} />
                  )}
                  <Text style={[styles.flowLabel, { color: theme.colors.emerald }]}>
                    {primaryTarget ? primaryTarget.mediaType : 'SSD Target'}
                  </Text>
                  <Text style={styles.flowSub} numberOfLines={1}>
                    {primaryTarget?.name.split(' ')[0] || 'Direct Mount'}
                  </Text>
                </View>
              </View>

              <View style={styles.pipelineFooter}>
                <Text style={styles.pipelineFooterText}>
                  Target Destination:{' '}
                  <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
                    {primaryTarget ? primaryTarget.name : 'Server Internal NVMe (Default)'}
                  </Text>
                </Text>
                <Text style={styles.pipelinePath} numberOfLines={1}>
                  {primaryTarget?.mountPath || 'data/storage'}
                </Text>
              </View>
            </View>

            {/* Benchmark Result Toast */}
            {benchmarkResult && (
              <View style={styles.benchmarkCard}>
                <View style={styles.benchmarkHeader}>
                  <Gauge size={18} color={theme.colors.cyan} />
                  <Text style={styles.benchmarkTitle}>Real-Time Throughput Benchmark</Text>
                  <TouchableOpacity onPress={() => setBenchmarkResult(null)}>
                    <X size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.benchmarkGrid}>
                  <View style={styles.benchmarkStat}>
                    <Text style={styles.benchmarkValue}>{benchmarkResult.writeSpeedMBps} MB/s</Text>
                    <Text style={styles.benchmarkLabel}>Write Speed</Text>
                  </View>
                  <View style={styles.benchmarkStat}>
                    <Text style={styles.benchmarkValue}>{benchmarkResult.readSpeedMBps} MB/s</Text>
                    <Text style={styles.benchmarkLabel}>Read Speed</Text>
                  </View>
                  <View style={styles.benchmarkStat}>
                    <Text style={styles.benchmarkValue}>{benchmarkResult.iopsWrite.toLocaleString()}</Text>
                    <Text style={styles.benchmarkLabel}>Random IOPS</Text>
                  </View>
                </View>
                <Text style={styles.benchmarkPath}>Tested: {benchmarkResult.mountPath}</Text>
              </View>
            )}

            {/* Quick Demo Simulation Toolbar */}
            <View style={styles.simulationBar}>
              <Text style={styles.simulationTitle}>QUICK MOUNT SIMULATOR (DEMO & TEST)</Text>
              <View style={styles.simulationButtons}>
                <TouchableOpacity
                  style={styles.simBtn}
                  onPress={() => handleSimulatePreset('samsung_t7')}
                  disabled={loading}
                >
                  <Zap size={14} color={theme.colors.cyan} />
                  <Text style={styles.simBtnText}>Samsung T7 SSD (2TB)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.simBtn}
                  onPress={() => handleSimulatePreset('seagate_hdd')}
                  disabled={loading}
                >
                  <Disc size={14} color={theme.colors.warning} />
                  <Text style={styles.simBtnText}>Seagate HDD (8TB)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Connected Drives Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CONNECTED EXTERNAL DRIVES ({drives.length})</Text>
              <TouchableOpacity
                style={styles.addDriveBtn}
                onPress={() => setShowAddForm(!showAddForm)}
              >
                <Plus size={14} color={theme.colors.cyan} />
                <Text style={styles.addDriveBtnText}>{showAddForm ? 'Cancel' : 'Mount Drive'}</Text>
              </TouchableOpacity>
            </View>

            {/* Add Drive Form */}
            {showAddForm && (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Mount External Volume</Text>
                <Text style={styles.formHint}>
                  Specify the USB/Thunderbolt mount point where your SSD or HDD is connected to the server.
                </Text>

                <Text style={styles.inputLabel}>Mount Path on Server Host</Text>
                <TextInput
                  style={styles.input}
                  value={customPath}
                  onChangeText={setCustomPath}
                  placeholder="/Volumes/Samsung_T7 or /mnt/usb_ssd"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={styles.inputLabel}>Drive Label / Name</Text>
                <TextInput
                  style={styles.input}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="e.g. Samsung T7 Shield 2TB"
                  placeholderTextColor={theme.colors.textMuted}
                />

                <Text style={styles.inputLabel}>Media Technology</Text>
                <View style={styles.mediaTypeRow}>
                  {(['SSD', 'HDD', 'NVME'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.mediaTypeBtn,
                        customMediaType === type && styles.mediaTypeBtnActive,
                      ]}
                      onPress={() => setCustomMediaType(type)}
                    >
                      {type === 'HDD' ? (
                        <Disc size={14} color={customMediaType === type ? '#0B0F17' : theme.colors.textMuted} />
                      ) : (
                        <Zap size={14} color={customMediaType === type ? '#0B0F17' : theme.colors.textMuted} />
                      )}
                      <Text
                        style={[
                          styles.mediaTypeBtnText,
                          customMediaType === type && styles.mediaTypeBtnTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.submitAttachBtn}
                  onPress={handleAttachDrive}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#0B0F17" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} color="#0B0F17" />
                      <Text style={styles.submitAttachBtnText}>Attach & Route Mobile Sync</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Drive Cards */}
            {loading && drives.length === 0 ? (
              <ActivityIndicator size="large" color={theme.colors.cyan} style={{ marginVertical: 32 }} />
            ) : (
              drives.map((drive) => {
                const isTarget = drive.isPrimaryWirelessTarget;
                const isBenchmarking = benchmarkingDriveId === drive.id;

                return (
                  <View
                    key={drive.id}
                    style={[
                      styles.driveCard,
                      isTarget && styles.driveCardTarget,
                    ]}
                  >
                    {/* Top Row */}
                    <View style={styles.driveHeaderRow}>
                      <View style={styles.driveBadgeGroup}>
                        <View
                          style={[
                            styles.mediaBadge,
                            drive.mediaType === 'HDD' ? styles.badgeHdd : styles.badgeSsd,
                          ]}
                        >
                          {drive.mediaType === 'HDD' ? (
                            <Disc size={14} color={theme.colors.warning} />
                          ) : (
                            <Zap size={14} color={theme.colors.cyan} />
                          )}
                          <Text
                            style={[
                              styles.mediaBadgeText,
                              drive.mediaType === 'HDD' ? { color: theme.colors.warning } : { color: theme.colors.cyan },
                            ]}
                          >
                            {drive.mediaType}
                          </Text>
                        </View>
                        <Text style={styles.interfaceText}>{drive.interface}</Text>
                      </View>

                      {isTarget ? (
                        <View style={styles.targetBadge}>
                          <CheckCircle2 size={12} color="#0B0F17" />
                          <Text style={styles.targetBadgeText}>SYNC TARGET</Text>
                        </View>
                      ) : (
                        <View style={styles.availableBadge}>
                          <Text style={styles.availableBadgeText}>AVAILABLE</Text>
                        </View>
                      )}
                    </View>

                    {/* Drive Name & Mount */}
                    <Text style={styles.driveName}>{drive.name}</Text>
                    <Text style={styles.drivePath}>{drive.mountPath}</Text>

                    {/* Storage Capacity Bar */}
                    <View style={styles.capacityContainer}>
                      <View style={styles.capacityMeta}>
                        <Text style={styles.capacityText}>
                          Free: <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>{formatBytes(drive.freeBytes)}</Text>
                        </Text>
                        <Text style={styles.capacityText}>
                          Total: <Text style={{ color: theme.colors.textMuted }}>{formatBytes(drive.totalBytes)}</Text>
                        </Text>
                      </View>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.max(drive.usedPercent, 4)}%` },
                            isTarget && { backgroundColor: theme.colors.cyan },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Hardware Telemetry Pills */}
                    <View style={styles.telemetryRow}>
                      <View style={styles.telemetryPill}>
                        <Thermometer size={12} color={theme.colors.textMuted} />
                        <Text style={styles.telemetryText}>{drive.temperatureC}°C</Text>
                      </View>
                      <View style={styles.telemetryPill}>
                        <ShieldCheck size={12} color={theme.colors.emerald} />
                        <Text style={styles.telemetryText}>S.M.A.R.T. {drive.smartStatus}</Text>
                      </View>
                      <View style={styles.telemetryPill}>
                        <Gauge size={12} color={theme.colors.cyan} />
                        <Text style={styles.telemetryText}>{drive.readSpeedMBps} MB/s</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.driveActionsRow}>
                      {!isTarget ? (
                        <TouchableOpacity
                          style={styles.setTargetBtn}
                          onPress={() => handleSetPrimary(drive)}
                        >
                          <Radio size={14} color="#0B0F17" />
                          <Text style={styles.setTargetBtnText}>Set Wireless Sync Target</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.targetActiveBox}>
                          <Text style={styles.targetActiveBoxText}>Receiving Mobile Wi-Fi Sync</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.benchmarkBtn}
                        onPress={() => handleBenchmark(drive)}
                        disabled={isBenchmarking}
                      >
                        {isBenchmarking ? (
                          <ActivityIndicator size="small" color={theme.colors.cyan} />
                        ) : (
                          <>
                            <Gauge size={14} color={theme.colors.cyan} />
                            <Text style={styles.benchmarkBtnText}>Speed Test</Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.ejectBtn}
                        onPress={() => handleEject(drive)}
                      >
                        <LogOut size={14} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 14, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0B0F17',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    maxHeight: '92%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#161F2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  pipelineCard: {
    backgroundColor: '#121824',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  pipelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pipelineTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.emerald,
    letterSpacing: 0.8,
  },
  onlineBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  onlineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.emerald,
  },
  pipelineFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B0F17',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  flowNode: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  flowNodeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    paddingVertical: 4,
  },
  flowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 4,
  },
  flowSub: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  pipelineFooter: {
    marginTop: 4,
  },
  pipelineFooterText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  pipelinePath: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: theme.colors.cyan,
    marginTop: 2,
  },
  benchmarkCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: 16,
  },
  benchmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  benchmarkTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.cyan,
  },
  benchmarkGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  benchmarkStat: {
    alignItems: 'center',
  },
  benchmarkValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  benchmarkLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  benchmarkPath: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: theme.colors.textMuted,
  },
  simulationBar: {
    marginBottom: 16,
  },
  simulationTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  simulationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#161F2E',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  simBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  addDriveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addDriveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.cyan,
  },
  formCard: {
    backgroundColor: '#121824',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  formHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#F8FAFC',
    fontSize: 13,
    marginBottom: 12,
  },
  mediaTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  mediaTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0B0F17',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  mediaTypeBtnActive: {
    backgroundColor: theme.colors.cyan,
    borderColor: theme.colors.cyan,
  },
  mediaTypeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  mediaTypeBtnTextActive: {
    color: '#0B0F17',
  },
  submitAttachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.cyan,
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitAttachBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0B0F17',
  },
  driveCard: {
    backgroundColor: '#121824',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  driveCardTarget: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: '#141D2C',
  },
  driveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  driveBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeSsd: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  badgeHdd: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  mediaBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  interfaceText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.cyan,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  targetBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0B0F17',
  },
  availableBadge: {
    backgroundColor: '#161F2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  availableBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
  },
  driveName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  drivePath: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: theme.colors.textMuted,
    marginBottom: 12,
  },
  capacityContainer: {
    marginBottom: 12,
  },
  capacityMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  capacityText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  telemetryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0B0F17',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  telemetryText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  driveActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setTargetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.cyan,
    paddingVertical: 9,
    borderRadius: 8,
  },
  setTargetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B0F17',
  },
  targetActiveBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  targetActiveBoxText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.cyan,
  },
  benchmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#161F2E',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  benchmarkBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.cyan,
  },
  ejectBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1E1620',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
});
