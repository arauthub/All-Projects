import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from './Card';
import { Button } from './Button';
import { FolderPlus, X } from 'lucide-react-native';

interface Props {
  visible: boolean;
  isSharedVault: boolean;
  onClose: () => void;
  onCreate: (name: string, isShared: boolean) => Promise<void>;
}

export function CreateFolderModal({ visible, isSharedVault, onClose, onCreate }: Props) {
  const [folderName, setFolderName] = useState('');
  const [isShared, setIsShared] = useState(isSharedVault);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!folderName.trim()) {
      Alert.alert('Required', 'Please enter a folder name');
      return;
    }
    try {
      setLoading(true);
      await onCreate(folderName.trim(), isShared);
      setFolderName('');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.dialog}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <FolderPlus size={20} color={colors.accent} />
            </View>
            <Text style={styles.title}>New Directory</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Folder Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Q4 Tax Receipts / Video Footage"
            placeholderTextColor={colors.textMuted}
            value={folderName}
            onChangeText={setFolderName}
            autoFocus
          />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Family Shared Vault</Text>
              <Text style={styles.switchDesc}>Visible to all permitted family devices</Text>
            </View>
            <Switch
              value={isShared}
              onValueChange={setIsShared}
              trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
              thumbColor={colors.textPrimary}
            />
          </View>

          <View style={styles.btnRow}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Create"
              variant="primary"
              onPress={handleCreate}
              loading={loading}
              style={{ flex: 1 }}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 8,
    padding: 12,
    color: colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  switchDesc: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
  },
});
