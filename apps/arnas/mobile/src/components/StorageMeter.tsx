import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { ProgressBar } from './ProgressBar';

interface StorageMeterProps {
  usedBytes: number | string;
  quotaBytes: number | string;
}

export const StorageMeter: React.FC<StorageMeterProps> = ({ usedBytes, quotaBytes }) => {
  const used = Number(usedBytes);
  const quota = Number(quotaBytes);

  const ratio = quota > 0 ? used / quota : 0;
  const percentage = Math.min(Math.round(ratio * 100), 100);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getColor = () => {
    if (ratio > 0.95) return colors.danger;
    if (ratio > 0.8) return colors.warning;
    return colors.accent;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Family Cloud Storage</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>

      <ProgressBar progress={ratio} color={getColor()} height={8} style={styles.progress} />

      <View style={styles.footerRow}>
        <Text style={styles.usageText}>
          {formatBytes(used)} of {formatBytes(quota)} used
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  percentage: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  progress: {
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  usageText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
