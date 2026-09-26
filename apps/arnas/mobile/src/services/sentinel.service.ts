import * as Network from 'expo-network';
import * as Battery from 'expo-battery';

export interface SentinelPolicy {
  wifiOnly: boolean;
  chargingOnly: boolean;
}

export class SentinelService {
  /**
   * Verify if current network and battery conditions permit background uploading
   */
  public static async canUpload(policy: SentinelPolicy): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // 1. Network check
    const netState = await Network.getNetworkStateAsync();
    if (!netState.isConnected) {
      return { allowed: false, reason: 'Device is offline' };
    }

    if (policy.wifiOnly && netState.type !== Network.NetworkStateType.WIFI) {
      return { allowed: false, reason: 'Wi-Fi required by user policy' };
    }

    // 2. Battery check
    const batteryState = await Battery.getBatteryStateAsync();
    const isCharging =
      batteryState === Battery.BatteryState.CHARGING ||
      batteryState === Battery.BatteryState.FULL;
    const batteryLevel = await Battery.getBatteryLevelAsync();

    if (policy.chargingOnly && !isCharging) {
      return { allowed: false, reason: 'Charging required by user policy' };
    }

    if (batteryLevel >= 0 && batteryLevel < 0.15 && !isCharging) {
      return { allowed: false, reason: 'Battery is critical (<15%) and not charging' };
    }

    return { allowed: true };
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

    return {
      isWifi,
      isCharging,
      batteryPercent,
      networkType: netState.type,
    };
  }
}
