import * as Network from 'expo-network';
import * as Battery from 'expo-battery';
import { GeofenceSyncService, GeofenceState } from './geofence-sync.service';

export interface SentinelPolicy {
  wifiOnly: boolean;
  chargingOnly: boolean;
  trustedGeofenceOnly?: boolean;
}

export class SentinelService {
  /**
   * Verify if current location, network, and battery conditions permit background uploading
   */
  public static async canUpload(policy: SentinelPolicy): Promise<{
    allowed: boolean;
    reason?: string;
    geofenceState?: GeofenceState;
  }> {
    // 1. Evaluate Location Geofence & Trusted Wi-Fi Policy
    const geofence = await GeofenceSyncService.evaluateGeofence();
    if (policy.trustedGeofenceOnly !== false) {
      if (!geofence.isInsideGeofence) {
        return {
          allowed: false,
          reason: `Auto-sync held: Device is outside trusted location geofence (${geofence.distanceMeters || 'unknown'}m away).`,
          geofenceState: geofence,
        };
      }
      if (!geofence.isTrustedWifi) {
        return {
          allowed: false,
          reason: `Auto-sync held: Connected to untrusted network '${geofence.currentSsid}'. Auto-sync requires trusted location Wi-Fi.`,
          geofenceState: geofence,
        };
      }
    }

    // 2. Network connectivity check
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isConnected) {
      return { allowed: false, reason: 'Device is offline', geofenceState: geofence };
    }

    if (policy.wifiOnly && netState.type !== Network.NetworkStateType.WIFI && !geofence.simulationActive) {
      return { allowed: false, reason: 'Wi-Fi required by user policy', geofenceState: geofence };
    }

    // 3. Battery check
    const batteryState = await Battery.getBatteryStateAsync();
    const isCharging =
      batteryState === Battery.BatteryState.CHARGING ||
      batteryState === Battery.BatteryState.FULL;
    const batteryLevel = await Battery.getBatteryLevelAsync();

    if (policy.chargingOnly && !isCharging) {
      return { allowed: false, reason: 'Charging required by user policy', geofenceState: geofence };
    }

    if (batteryLevel >= 0 && batteryLevel < 0.15 && !isCharging) {
      return { allowed: false, reason: 'Battery is critical (<15%) and not charging', geofenceState: geofence };
    }

    return { allowed: true, geofenceState: geofence };
  }

  public static async getHardwareStatus() {
    const netState = await Network.getNetworkStateAsync();
    const batteryState = await Battery.getBatteryStateAsync();
    const isCharging =
      batteryState === Battery.BatteryState.CHARGING ||
      batteryState === Battery.BatteryState.FULL;
    const batteryLevel = await Battery.getBatteryLevelAsync();

    const isWifi = netState.type === Network.NetworkStateType.WIFI;
    const batteryPercent = batteryLevel >= 0 ? Math.round(batteryLevel * 100) : 100;
    const geofence = await GeofenceSyncService.evaluateGeofence();

    return {
      isWifi,
      isCharging,
      batteryPercent,
      networkType: netState.type,
      geofence,
    };
  }
}
