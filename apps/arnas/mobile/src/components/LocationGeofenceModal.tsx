import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { Card } from './Card';
import { Button } from './Button';
import {
  GeofenceSyncService,
  TrustedLocation,
  GeofenceState,
} from '../services/geofence-sync.service';
import {
  MapPin,
  Wifi,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Plus,
  Trash2,
  X,
  Compass,
  CheckCircle2,
  Sliders,
  HardDrive,
  Info,
} from 'lucide-react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LocationGeofenceModal({ visible, onClose }: Props) {
  const [geofenceState, setGeofenceState] = useState<GeofenceState | null>(null);
  const [locations, setLocations] = useState<TrustedLocation[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // New location form state
  const [newName, setNewName] = useState('');
  const [newLat, setNewLat] = useState('37.7749');
  const [newLng, setNewLng] = useState('-122.4194');
  const [newRadius, setNewRadius] = useState('200');
  const [newSsids, setNewSsids] = useState('Home-5GHz, ARNAS-Mesh');
  const [newStorage, setNewStorage] = useState('Primary Local NVMe + S3 Mirror');

  useEffect(() => {
    if (!visible) return;

    GeofenceSyncService.getTrustedLocations().then(setLocations);
    const unsubscribe = GeofenceSyncService.subscribe((state) => {
      setGeofenceState(state);
    });

    return unsubscribe;
  }, [visible]);

  const handleToggleLocation = async (id: string, current: boolean) => {
    await GeofenceSyncService.updateTrustedLocation(id, { enabled: !current });
    const updated = await GeofenceSyncService.getTrustedLocations();
    setLocations(updated);
  };

  const handleDeleteLocation = async (id: string) => {
    await GeofenceSyncService.deleteTrustedLocation(id);
    const updated = await GeofenceSyncService.getTrustedLocations();
    setLocations(updated);
  };

  const handleAddLocation = async () => {
    if (!newName.trim()) {
      Alert.alert('Required', 'Please enter a location name');
      return;
    }
    const ssids = newSsids
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    await GeofenceSyncService.addTrustedLocation({
      name: newName.trim(),
      latitude: parseFloat(newLat) || 37.7749,
      longitude: parseFloat(newLng) || -122.4194,
      radiusMeters: parseInt(newRadius, 10) || 200,
      trustedWifiSsids: ssids.length > 0 ? ssids : ['Home-5GHz'],
      targetStorageClusterId: 'custom-node',
      targetStorageName: newStorage.trim() || 'Primary Local NVMe',
      enabled: true,
    });

    const updated = await GeofenceSyncService.getTrustedLocations();
    setLocations(updated);
    setIsAdding(false);
    setNewName('');
  };

  const handleSimulate = (locId: string | null, ssid: string | null) => {
    GeofenceSyncService.setSimulation(locId, ssid);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.iconCircle}>
              <Radio size={22} color={colors.accent} />
            </View>
            <View>
              <Text style={styles.title}>Location & Trusted Wi-Fi</Text>
              <Text style={styles.subtitle}>Geofenced Auto-Sync Sentinel</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Live Geofence Radar / Status Card */}
          <Card
            style={[
              styles.statusCard,
              geofenceState?.canAutoSync
                ? styles.statusCardActive
                : geofenceState?.isInsideGeofence
                ? styles.statusCardWarning
                : styles.statusCardInactive,
            ]}
          >
            <View style={styles.radarHeader}>
              <View style={styles.radarBadge}>
                {geofenceState?.canAutoSync ? (
                  <ShieldCheck size={20} color={colors.success} />
                ) : (
                  <ShieldAlert
                    size={20}
                    color={geofenceState?.isInsideGeofence ? colors.warning : colors.danger}
                  />
                )}
                <Text
                  style={[
                    styles.radarBadgeText,
                    {
                      color: geofenceState?.canAutoSync
                        ? colors.success
                        : geofenceState?.isInsideGeofence
                        ? colors.warning
                        : colors.danger,
                    },
                  ]}
                >
                  {geofenceState?.canAutoSync
                    ? 'AUTO-SYNC READY'
                    : geofenceState?.isInsideGeofence
                    ? 'UNTRUSTED WI-FI'
                    : 'OUTSIDE GEOFENCE'}
                </Text>
              </View>

              <View style={styles.gpsPill}>
                <Compass size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.gpsPillText}>
                  {geofenceState?.currentLocation
                    ? `${geofenceState.currentLocation.latitude.toFixed(3)}, ${geofenceState.currentLocation.longitude.toFixed(3)}`
                    : 'Acquiring GPS...'}
                </Text>
              </View>
            </View>

            <Text style={styles.statusDetailText}>{geofenceState?.statusMessage}</Text>

            {geofenceState?.matchedLocation && (
              <View style={styles.targetStorageRow}>
                <HardDrive size={14} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.targetStorageLabel}>
                  Active Target:{' '}
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                    {geofenceState.matchedLocation.targetStorageName}
                  </Text>
                </Text>
              </View>
            )}
          </Card>

          {/* Quick Simulation Bar (For Simulators, Emulators & Testing) */}
          <View style={styles.sectionHeaderRow}>
            <Sliders size={16} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Simulation & Testing Radar</Text>
          </View>
          <Text style={styles.sectionHint}>
            Instant test triggers for iOS Simulator, Android Emulator, and Web preview:
          </Text>

          <View style={styles.simRow}>
            <TouchableOpacity
              style={[
                styles.simChip,
                geofenceState?.simulatedLocationId === 'loc-home' &&
                  geofenceState?.simulatedSsid === 'Home-5GHz' &&
                  styles.simChipActive,
              ]}
              onPress={() => handleSimulate('loc-home', 'Home-5GHz')}
            >
              <Text style={styles.simChipText}>🏠 At Home (Trusted Wi-Fi)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.simChip,
                geofenceState?.simulatedLocationId === 'loc-home' &&
                  geofenceState?.simulatedSsid === 'Guest-Untrusted' &&
                  styles.simChipActive,
              ]}
              onPress={() => handleSimulate('loc-home', 'Guest-Untrusted')}
            >
              <Text style={styles.simChipText}>⚠️ At Home (Guest Wi-Fi)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.simRow}>
            <TouchableOpacity
              style={[
                styles.simChip,
                geofenceState?.simulatedLocationId === 'loc-studio' && styles.simChipActive,
              ]}
              onPress={() => handleSimulate('loc-studio', 'Studio-5G')}
            >
              <Text style={styles.simChipText}>🎨 Studio (MinIO NAS)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.simChip,
                geofenceState?.simulatedLocationId === null && styles.simChipActive,
              ]}
              onPress={() => handleSimulate(null, 'Cellular 5G')}
            >
              <Text style={styles.simChipText}>🚗 Roaming (Cellular 5G)</Text>
            </TouchableOpacity>
          </View>

          {/* Configured Trusted Locations */}
          <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
            <MapPin size={16} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>Configured Geofences & Wi-Fi Networks</Text>
          </View>

          {locations.map((loc) => (
            <Card key={loc.id} style={styles.locCard}>
              <View style={styles.locCardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.locNameRow}>
                    <Text style={styles.locName}>{loc.name}</Text>
                    <View style={styles.radiusBadge}>
                      <Text style={styles.radiusBadgeText}>{loc.radiusMeters}m radius</Text>
                    </View>
                  </View>
                  <Text style={styles.locCoords}>
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                  </Text>
                </View>
                <Switch
                  value={loc.enabled}
                  onValueChange={(val) => handleToggleLocation(loc.id, !val)}
                  trackColor={{ false: colors.surfaceHighlight, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.locDetailRow}>
                <Wifi size={14} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={styles.locDetailTitle}>Trusted Wi-Fi SSIDs:</Text>
              </View>
              <View style={styles.ssidChipsRow}>
                {loc.trustedWifiSsids.map((ssid, idx) => (
                  <View key={idx} style={styles.ssidChip}>
                    <Text style={styles.ssidChipText}>{ssid}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.locDetailRow, { marginTop: 8 }]}>
                <HardDrive size={14} color={colors.primaryLight} style={{ marginRight: 6 }} />
                <Text style={styles.locDetailTitle}>
                  Sync Destination: <Text style={{ color: colors.textPrimary }}>{loc.targetStorageName}</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteLocBtn}
                onPress={() => handleDeleteLocation(loc.id)}
                activeOpacity={0.7}
              >
                <Trash2 size={13} color={colors.danger} style={{ marginRight: 4 }} />
                <Text style={styles.deleteLocText}>Remove Location</Text>
              </TouchableOpacity>
            </Card>
          ))}

          {/* Add Location Form Toggle */}
          {!isAdding ? (
            <TouchableOpacity
              style={styles.addLocBtn}
              onPress={() => setIsAdding(true)}
              activeOpacity={0.8}
            >
              <Plus size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.addLocBtnText}>Add New Trusted Location</Text>
            </TouchableOpacity>
          ) : (
            <Card style={styles.addFormCard}>
              <Text style={styles.addFormTitle}>Add Geofenced Location</Text>

              <Text style={styles.fieldLabel}>Location Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Vacation Home / Remote Studio"
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Latitude</Text>
                  <TextInput
                    style={styles.input}
                    value={newLat}
                    onChangeText={setNewLat}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Longitude</Text>
                  <TextInput
                    style={styles.input}
                    value={newLng}
                    onChangeText={setNewLng}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Geofence Radius (meters)</Text>
              <TextInput
                style={styles.input}
                value={newRadius}
                onChangeText={setNewRadius}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Trusted Wi-Fi SSIDs (comma-separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. MyWiFi-5G, MyWiFi-IoT"
                placeholderTextColor={colors.textMuted}
                value={newSsids}
                onChangeText={setNewSsids}
              />

              <Text style={styles.fieldLabel}>Storage Target Node</Text>
              <TextInput
                style={styles.input}
                value={newStorage}
                onChangeText={setNewStorage}
              />

              <View style={styles.formBtnRow}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setIsAdding(false)}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Save Location"
                  variant="primary"
                  onPress={handleAddLocation}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          <View style={{ height: 40 }} />
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
    flex: 1,
    padding: 16,
  },
  statusCard: {
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  statusCardActive: {
    borderLeftColor: colors.success,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  statusCardWarning: {
    borderLeftColor: colors.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  statusCardInactive: {
    borderLeftColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  radarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radarBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  gpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gpsPillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  statusDetailText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  targetStorageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  targetStorageLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  simRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  simChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  simChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  simChipText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  locCard: {
    marginBottom: 12,
    padding: 14,
  },
  locCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
  },
  radiusBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  radiusBadgeText: {
    color: colors.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  locCoords: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  locDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locDetailTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  ssidChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 20,
  },
  ssidChip: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ssidChipText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingTop: 6,
  },
  deleteLocText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '600',
  },
  addLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    marginTop: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  addLocBtnText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  addFormCard: {
    padding: 16,
    marginTop: 8,
  },
  addFormTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 8,
    padding: 10,
    color: colors.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formBtnRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
});
