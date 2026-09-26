import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  ShieldAlert,
  ClipboardList,
  Clock,
  User,
  X,
  FileCheck,
  Trash2,
  Server,
  Key,
} from 'lucide-react-native';
import { theme } from '../theme';
import { AuditService, AuditLogItem } from '../services/audit.service';

interface AuditTrailModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await AuditService.getLogs(40, 0);
      setLogs(res.logs || []);
    } catch (err: any) {
      console.warn('Failed to fetch audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchLogs();
    }
  }, [visible]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'FILE_UPLOAD':
        return <FileCheck color={theme.colors.success} size={16} />;
      case 'FILE_DELETE':
        return <Trash2 color={theme.colors.danger} size={16} />;
      case 'STORAGE_NODE_ADDED':
        return <Server color={theme.colors.primary} size={16} />;
      case 'E2EE_INITIALIZED':
        return <Key color="#F59E0B" size={16} />;
      default:
        return <ClipboardList color={theme.colors.textMuted} size={16} />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <ShieldAlert color={theme.colors.primary} size={22} />
              </View>
              <View>
                <Text style={styles.title}>Enterprise Audit Trail</Text>
                <Text style={styles.subtitle}>Immutable Security & Access Log</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={theme.colors.textMuted} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 30 }} />
            ) : logs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ClipboardList color={theme.colors.textMuted} size={36} />
                <Text style={styles.emptyText}>No audit records logged yet</Text>
              </View>
            ) : (
              logs.map((log) => (
                <View key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={styles.actionBadgeRow}>
                      {getActionIcon(log.action)}
                      <Text style={styles.actionName}>{log.action}</Text>
                    </View>
                    <View style={styles.timeRow}>
                      <Clock color={theme.colors.textMuted} size={11} />
                      <Text style={styles.timeText}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>

                  {log.details && (
                    <Text style={styles.detailsText} numberOfLines={2}>
                      {JSON.stringify(log.details)}
                    </Text>
                  )}

                  <View style={styles.logFooter}>
                    <Text style={styles.dateText}>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </Text>
                    {log.ipAddress && (
                      <Text style={styles.ipText}>IP: {log.ipAddress}</Text>
                    )}
                  </View>
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
    paddingTop: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: theme.colors.textMuted,
    marginTop: 10,
    fontSize: 13,
  },
  logCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionName: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  detailsText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  dateText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  ipText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
});
