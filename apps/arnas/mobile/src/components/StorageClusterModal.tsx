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
  Server,
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  Trash2,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { theme } from '../theme';
import {
  StorageClusterService,
  ClusterMetricsResponse,
  StorageNodeItem,
  StorageNodeType,
} from '../services/storage-cluster.service';

interface StorageClusterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const StorageClusterModal: React.FC<StorageClusterModalProps> = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [clusterData, setClusterData] = useState<ClusterMetricsResponse | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs: number; error?: string } | null>(null);
  const [reconciling, setReconciling] = useState(false);

  // Form State
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState<StorageNodeType>('S3_COMPATIBLE');
  const [endpoint, setEndpoint] = useState('http://localhost:9000');
  const [bucket, setBucket] = useState('arnas-cluster-vault');
  const [region, setRegion] = useState('us-east-1');
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [localPath, setLocalPath] = useState('/mnt/secondary-nas/data');
  const [priority, setPriority] = useState('2');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await StorageClusterService.getClusterMetrics();
      setClusterData(res);
    } catch (err: any) {
      Alert.alert('Cluster Status Error', err.message || 'Failed to fetch cluster status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchMetrics();
    }
  }, [visible]);

  const handleTestConnection = async () => {
    try {
      setTestingPing(true);
      setTestResult(null);
      const res = await StorageClusterService.testStorageNode({
        type: nodeType,
        endpoint: nodeType === 'S3_COMPATIBLE' ? endpoint : undefined,
        bucket: nodeType === 'S3_COMPATIBLE' ? bucket : undefined,
        region: nodeType === 'S3_COMPATIBLE' ? region : undefined,
        accessKey: nodeType === 'S3_COMPATIBLE' ? accessKey : undefined,
        secretKey: nodeType === 'S3_COMPATIBLE' ? secretKey : undefined,
        localPath: nodeType === 'LOCAL_DISK' ? localPath : undefined,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ ok: false, latencyMs: 0, error: err.message });
    } finally {
      setTestingPing(false);
    }
  };

  const handleSaveNode = async () => {
    if (!nodeName.trim()) {
      Alert.alert('Validation', 'Please provide a friendly name for this storage node');
      return;
    }

    try {
      setLoading(true);
      await StorageClusterService.addStorageNode({
        name: nodeName.trim(),
        type: nodeType,
        endpoint: nodeType === 'S3_COMPATIBLE' ? endpoint.trim() : undefined,
        bucket: nodeType === 'S3_COMPATIBLE' ? bucket.trim() : undefined,
        region: nodeType === 'S3_COMPATIBLE' ? region.trim() : undefined,
        accessKey: nodeType === 'S3_COMPATIBLE' ? accessKey.trim() : undefined,
        secretKey: nodeType === 'S3_COMPATIBLE' ? secretKey.trim() : undefined,
        localPath: nodeType === 'LOCAL_DISK' ? localPath.trim() : undefined,
        priority: parseInt(priority, 10) || 2,
        isPrimary: false,
        isActive: true,
      });

      Alert.alert('Success', `Storage server "${nodeName}" added to cluster!`);
      setShowAddForm(false);
      // Reset form
      setNodeName('');
      setAccessKey('');
      setSecretKey('');
      setTestResult(null);
      await fetchMetrics();
    } catch (err: any) {
      Alert.alert('Error Adding Server', err.message || 'Failed to save storage node');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNode = (node: StorageNodeItem) => {
    if (node.isPrimary) {
      Alert.alert('Action Prohibited', 'Primary storage node cannot be removed.');
      return;
    }

    Alert.alert(
      'Remove Storage Server',
      `Are you sure you want to decouple "${node.name}" from the redundancy cluster?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await StorageClusterService.deleteStorageNode(node.id);
              await fetchMetrics();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReconcile = async () => {
    try {
      setReconciling(true);
      const res = await StorageClusterService.reconcileCluster();
      Alert.alert(
        'Replication Queue Complete',
        `Processed ${res.processed} pending items: ${res.succeeded} synced, ${res.failed} retrying.`
      );
      await fetchMetrics();
    } catch (err: any) {
      Alert.alert('Reconciliation Error', err.message);
    } finally {
      setReconciling(false);
    }
  };

  const formatBytes = (bytesStr: string) => {
    const bytes = Number(bytesStr);
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Layers color={theme.colors.primary} size={22} />
              </View>
              <View>
                <Text style={styles.title}>Enterprise Storage Cluster</Text>
                <Text style={styles.subtitle}>Multi-Server Redundancy & Failover</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={theme.colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Cluster Health Banner */}
            {clusterData && (
              <View style={styles.healthBanner}>
                <View style={styles.healthStat}>
                  <Text style={styles.healthStatValue}>{clusterData.summary.totalNodes}</Text>
                  <Text style={styles.healthStatLabel}>Nodes Active</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.healthStat}>
                  <Text style={[styles.healthStatValue, { color: theme.colors.success }]}>
                    {clusterData.summary.onlineNodes} Online
                  </Text>
                  <Text style={styles.healthStatLabel}>Health Status</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.healthStat}>
                  <Text style={styles.healthStatValue}>{clusterData.summary.replicas.synced}</Text>
                  <Text style={styles.healthStatLabel}>Synced Replicas</Text>
                </View>
              </View>
            )}

            {/* Redundancy Info Callout */}
            <View style={styles.infoCallout}>
              <ShieldCheck color={theme.colors.success} size={18} />
              <Text style={styles.infoCalloutText}>
                Enterprise Ingest Protocol: Instant primary disk upload with background fan-out replication and automatic read failover.
              </Text>
            </View>

            {/* Action Bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity
                style={styles.actionButtonOutline}
                onPress={handleReconcile}
                disabled={reconciling}
              >
                {reconciling ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <>
                    <RefreshCw color={theme.colors.primary} size={14} />
                    <Text style={styles.actionButtonOutlineText}>Reconcile Queue</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButtonPrimary}
                onPress={() => setShowAddForm(!showAddForm)}
              >
                <Plus color="#FFF" size={16} />
                <Text style={styles.actionButtonPrimaryText}>
                  {showAddForm ? 'Close Form' : 'Add Storage Server'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Add Node Form */}
            {showAddForm && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Connect Storage Server</Text>

                {/* Storage Type Tabs */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[styles.tab, nodeType === 'S3_COMPATIBLE' && styles.tabActive]}
                    onPress={() => setNodeType('S3_COMPATIBLE')}
                  >
                    <Cloud
                      color={nodeType === 'S3_COMPATIBLE' ? '#FFF' : theme.colors.textMuted}
                      size={16}
                    />
                    <Text
                      style={[styles.tabText, nodeType === 'S3_COMPATIBLE' && styles.tabTextActive]}
                    >
                      S3 / MinIO
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tab, nodeType === 'LOCAL_DISK' && styles.tabActive]}
                    onPress={() => setNodeType('LOCAL_DISK')}
                  >
                    <HardDrive
                      color={nodeType === 'LOCAL_DISK' ? '#FFF' : theme.colors.textMuted}
                      size={16}
                    />
                    <Text
                      style={[styles.tabText, nodeType === 'LOCAL_DISK' && styles.tabTextActive]}
                    >
                      Local / NAS Mount
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Node Name */}
                <Text style={styles.inputLabel}>Node Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MinIO Disaster Recovery Node"
                  placeholderTextColor={theme.colors.textMuted}
                  value={nodeName}
                  onChangeText={setNodeName}
                />

                {nodeType === 'S3_COMPATIBLE' ? (
                  <>
                    <Text style={styles.inputLabel}>S3 Endpoint URL</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. http://192.168.1.50:9000 or https://s3.amazonaws.com"
                      placeholderTextColor={theme.colors.textMuted}
                      value={endpoint}
                      onChangeText={setEndpoint}
                      autoCapitalize="none"
                    />

                    <Text style={styles.inputLabel}>Bucket Name</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="arnas-vault"
                      placeholderTextColor={theme.colors.textMuted}
                      value={bucket}
                      onChangeText={setBucket}
                      autoCapitalize="none"
                    />

                    <Text style={styles.inputLabel}>Access Key</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MinIO or AWS Access Key ID"
                      placeholderTextColor={theme.colors.textMuted}
                      value={accessKey}
                      onChangeText={setAccessKey}
                      autoCapitalize="none"
                    />

                    <Text style={styles.inputLabel}>Secret Key</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="MinIO or AWS Secret Access Key"
                      placeholderTextColor={theme.colors.textMuted}
                      value={secretKey}
                      onChangeText={setSecretKey}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.inputLabel}>Secondary Mount / Disk Path</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. /mnt/secondary-nas/data"
                      placeholderTextColor={theme.colors.textMuted}
                      value={localPath}
                      onChangeText={setLocalPath}
                      autoCapitalize="none"
                    />
                  </>
                )}

                {/* Test Connection Button */}
                <View style={styles.formActionRow}>
                  <TouchableOpacity
                    style={styles.testButton}
                    onPress={handleTestConnection}
                    disabled={testingPing}
                  >
                    {testingPing ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Text style={styles.testButtonText}>Test Ping</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveNode}>
                    <Text style={styles.saveButtonText}>Add to Cluster</Text>
                  </TouchableOpacity>
                </View>

                {/* Test Result Indicator */}
                {testResult && (
                  <View
                    style={[
                      styles.testResultBox,
                      testResult.ok ? styles.testResultSuccess : styles.testResultFail,
                    ]}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 color={theme.colors.success} size={16} />
                    ) : (
                      <XCircle color={theme.colors.danger} size={16} />
                    )}
                    <Text style={styles.testResultText}>
                      {testResult.ok
                        ? `Connected! Latency: ${testResult.latencyMs}ms`
                        : `Failed: ${testResult.error || 'Connection timed out'}`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Registered Storage Nodes */}
            <Text style={styles.sectionTitle}>Cluster Nodes ({clusterData?.nodes.length || 0})</Text>

            {loading && !clusterData ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }} />
            ) : (
              clusterData?.nodes.map((node) => (
                <View key={node.id} style={styles.nodeCard}>
                  <View style={styles.nodeHeader}>
                    <View style={styles.nodeTitleContainer}>
                      {node.type === 'S3_COMPATIBLE' ? (
                        <Cloud color={theme.colors.primary} size={20} />
                      ) : (
                        <HardDrive color={theme.colors.primary} size={20} />
                      )}
                      <View style={{ marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.nodeName}>{node.name}</Text>
                          {node.isPrimary && (
                            <View style={styles.primaryBadge}>
                              <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.nodeEndpoint}>
                          {node.type === 'S3_COMPATIBLE'
                            ? `S3: ${node.bucket} @ ${node.endpoint || 'AWS'}`
                            : `Local: ${node.localPath}`}
                        </Text>
                      </View>
                    </View>

                    {/* Status & Latency */}
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusDot,
                            node.status === 'ONLINE'
                              ? styles.statusOnline
                              : node.status === 'DEGRADED'
                              ? styles.statusDegraded
                              : styles.statusOffline,
                          ]}
                        />
                        <Text style={styles.statusText}>{node.status}</Text>
                      </View>
                      {node.lastPingMs !== null && node.lastPingMs !== undefined && (
                        <Text style={styles.latencyText}>{node.lastPingMs}ms</Text>
                      )}
                    </View>
                  </View>

                  {/* Capacity Bar */}
                  <View style={styles.capacityContainer}>
                    <View style={styles.capacityLabels}>
                      <Text style={styles.capacityLabel}>Used: {formatBytes(node.usedSpaceBytes)}</Text>
                      <Text style={styles.capacityLabel}>Total: {formatBytes(node.totalSpaceBytes)}</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.min(
                              100,
                              Math.max(
                                2,
                                (Number(node.usedSpaceBytes) / (Number(node.totalSpaceBytes) || 1)) * 100
                              )
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Node Actions */}
                  {!node.isPrimary && (
                    <View style={styles.nodeFooter}>
                      <Text style={styles.priorityText}>Priority: #{node.priority}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNode(node)}
                        style={styles.deleteNodeBtn}
                      >
                        <Trash2 color={theme.colors.danger} size={15} />
                        <Text style={styles.deleteNodeText}>Decouple</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
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
  healthBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    paddingVertical: 14,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  healthStat: {
    alignItems: 'center',
  },
  healthStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  healthStatLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoCalloutText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 17,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButtonOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 6,
  },
  actionButtonOutlineText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonPrimary: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    gap: 6,
  },
  actionButtonPrimaryText: {
    color: '#FFF',
    fontSize: 13,
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
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: '#FFF',
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
    paddingVertical: 9,
    fontSize: 13,
    color: theme.colors.text,
  },
  formActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  testButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1.4,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  testResultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    gap: 8,
  },
  testResultSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  testResultFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  testResultText: {
    fontSize: 12,
    color: theme.colors.text,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginVertical: 10,
  },
  nodeCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nodeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  nodeName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  primaryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  nodeEndpoint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: theme.colors.success,
  },
  statusDegraded: {
    backgroundColor: '#F59E0B',
  },
  statusOffline: {
    backgroundColor: theme.colors.danger,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text,
  },
  latencyText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  capacityContainer: {
    marginTop: 12,
  },
  capacityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  capacityLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  nodeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  priorityText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  deleteNodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteNodeText: {
    fontSize: 11,
    color: theme.colors.danger,
    fontWeight: '600',
  },
});
