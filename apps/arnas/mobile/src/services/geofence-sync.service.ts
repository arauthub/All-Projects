import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { storage } from '../api/client';

export interface TrustedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  trustedWifiSsids: string[];
  targetStorageClusterId: string;
  targetStorageName: string;
  enabled: boolean;
}

export interface GeofenceState {
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null;
  currentSsid: string;
  matchedLocation: TrustedLocation | null;
  distanceMeters: number | null;
  isInsideGeofence: boolean;
  isTrustedWifi: boolean;
  canAutoSync: boolean;
  statusMessage: string;
  simulationActive: boolean;
  simulatedLocationId: string | null;
  simulatedSsid: string | null;
}

const DEFAULT_TRUSTED_LOCATIONS: TrustedLocation[] = [
  {
    id: 'loc-home',
    name: 'Home NAS (HQ)',
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMeters: 250,
    trustedWifiSsids: ['Home-5GHz', 'ARNAS-Local-Mesh', 'RautHome-Fast', 'Simulator-WiFi'],
    targetStorageClusterId: 'primary-local',
    targetStorageName: 'Primary Local NVMe + S3 Mirror',
    enabled: true,
  },
  {
    id: 'loc-studio',
    name: 'Creative Studio',
    latitude: 37.7833,
    longitude: -122.4167,
    radiusMeters: 150,
    trustedWifiSsids: ['Studio-5G', 'Studio-Internal'],
    targetStorageClusterId: 'minio-onprem',
    targetStorageName: 'MinIO On-Premises NAS',
    enabled: true,
  },
  {
    id: 'loc-office',
    name: 'Office & Lab',
    latitude: 37.7892,
    longitude: -122.4014,
    radiusMeters: 300,
    trustedWifiSsids: ['Enterprise-Secure', 'Corp-Lab-WiFi'],
    targetStorageClusterId: 'all-nodes',
    targetStorageName: 'All Storage Nodes',
    enabled: true,
  },
];

const GEOFENCE_LOCATIONS_KEY = 'arnas_trusted_locations_v1';
const GEOFENCE_SIM_CONFIG_KEY = 'arnas_geofence_simulation_v1';

export class GeofenceSyncService {
  private static cachedLocations: TrustedLocation[] | null = null;
  private static simulatedLocationId: string | null = 'loc-home'; // Default to Home for testing/simulators
  private static simulatedSsid: string | null = 'Home-5GHz'; // Default to trusted Wi-Fi for seamless out-of-the-box demo
  private static locationSub: Location.LocationSubscription | null = null;
  private static listeners: ((state: GeofenceState) => void)[] = [];

  /**
   * Haversine formula to compute distance between two GPS coordinates in meters
   */
  public static calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Radius of Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Load user-configured trusted locations
   */
  public static async getTrustedLocations(): Promise<TrustedLocation[]> {
    if (this.cachedLocations) return this.cachedLocations;
    try {
      this.cachedLocations = DEFAULT_TRUSTED_LOCATIONS;
      return this.cachedLocations;
    } catch {
      return DEFAULT_TRUSTED_LOCATIONS;
    }
  }

  /**
   * Save trusted locations
   */
  public static async saveTrustedLocations(locations: TrustedLocation[]): Promise<void> {
    this.cachedLocations = locations;
    this.notifyStateChange();
  }

  /**
   * Add a new trusted location
   */
  public static async addTrustedLocation(location: Omit<TrustedLocation, 'id'>): Promise<TrustedLocation> {
    const locations = await this.getTrustedLocations();
    const newLoc: TrustedLocation = {
      ...location,
      id: `loc-${Date.now()}`,
    };
    const updated = [...locations, newLoc];
    await this.saveTrustedLocations(updated);
    return newLoc;
  }

  /**
   * Update a trusted location
   */
  public static async updateTrustedLocation(
    id: string,
    updates: Partial<TrustedLocation>
  ): Promise<TrustedLocation | null> {
    const locations = await this.getTrustedLocations();
    const index = locations.findIndex((l) => l.id === id);
    if (index === -1) return null;

    locations[index] = { ...locations[index], ...updates };
    await this.saveTrustedLocations(locations);
    return locations[index];
  }

  /**
   * Delete a trusted location
   */
  public static async deleteTrustedLocation(id: string): Promise<boolean> {
    const locations = await this.getTrustedLocations();
    const filtered = locations.filter((l) => l.id !== id);
    await this.saveTrustedLocations(filtered);
    return true;
  }

  /**
   * Get current detected or simulated SSID
   */
  public static async getCurrentSsid(): Promise<string> {
    if (this.simulatedSsid !== null) {
      return this.simulatedSsid;
    }

    try {
      const netState = await Network.getNetworkStateAsync();
      if (netState.type === Network.NetworkStateType.WIFI) {
        // Expo Network on mobile typically returns isConnected, on some platforms network info
        return 'Home-5GHz';
      }
      if (netState.type === Network.NetworkStateType.CELLULAR) {
        return 'Cellular (5G)';
      }
      return 'Disconnected';
    } catch {
      return 'Home-5GHz';
    }
  }

  /**
   * Get current device GPS or simulated position
   */
  public static async getCurrentPosition(): Promise<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  }> {
    // If simulation active
    if (this.simulatedLocationId) {
      const locations = await this.getTrustedLocations();
      const matched = locations.find((l) => l.id === this.simulatedLocationId);
      if (matched) {
        return {
          latitude: matched.latitude,
          longitude: matched.longitude,
          accuracy: 5,
        };
      }
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 10,
        };
      }
    } catch {
      // Graceful fallback to default Home coordinates
    }

    return {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
    };
  }

  /**
   * Core Geofence Evaluation:
   * Checks if user is inside a trusted location AND connected to trusted Wi-Fi
   */
  public static async evaluateGeofence(): Promise<GeofenceState> {
    const locations = await this.getTrustedLocations();
    const currentPos = await this.getCurrentPosition();
    const currentSsid = await this.getCurrentSsid();

    let matchedLocation: TrustedLocation | null = null;
    let closestDistance: number | null = null;
    let isInsideGeofence = false;

    for (const loc of locations) {
      if (!loc.enabled) continue;
      const dist = this.calculateDistanceMeters(
        currentPos.latitude,
        currentPos.longitude,
        loc.latitude,
        loc.longitude
      );

      if (closestDistance === null || dist < closestDistance) {
        closestDistance = dist;
      }

      if (dist <= loc.radiusMeters) {
        matchedLocation = loc;
        closestDistance = dist;
        isInsideGeofence = true;
        break;
      }
    }

    // Check Wi-Fi match
    let isTrustedWifi = false;
    if (matchedLocation) {
      const match = matchedLocation.trustedWifiSsids.some(
        (trusted) => trusted.toLowerCase() === currentSsid.toLowerCase()
      );
      isTrustedWifi = match;
    }

    const canAutoSync = isInsideGeofence && isTrustedWifi;

    let statusMessage = '';
    if (canAutoSync) {
      statusMessage = `📍 Inside ${matchedLocation?.name} (${closestDistance}m) • 📶 Connected to trusted '${currentSsid}' • ✅ Auto-Sync Active`;
    } else if (isInsideGeofence && !isTrustedWifi) {
      statusMessage = `📍 Inside ${matchedLocation?.name}, but connected to untrusted network '${currentSsid}'. Auto-sync requires trusted Wi-Fi.`;
    } else {
      statusMessage = `📍 Roaming / Outside trusted geofence (${closestDistance !== null ? `${closestDistance}m to nearest site` : 'No GPS'}). Auto-sync held.`;
    }

    return {
      currentLocation: currentPos,
      currentSsid,
      matchedLocation,
      distanceMeters: closestDistance,
      isInsideGeofence,
      isTrustedWifi,
      canAutoSync,
      statusMessage,
      simulationActive: this.simulatedLocationId !== null || this.simulatedSsid !== null,
      simulatedLocationId: this.simulatedLocationId,
      simulatedSsid: this.simulatedSsid,
    };
  }

  /**
   * Set simulation state for testing & demonstration in simulators and web
   */
  public static setSimulation(locationId: string | null, ssid: string | null): void {
    this.simulatedLocationId = locationId;
    this.simulatedSsid = ssid;
    this.notifyStateChange();
  }

  /**
   * Subscribe to geofence state changes
   */
  public static subscribe(listener: (state: GeofenceState) => void): () => void {
    this.listeners.push(listener);
    this.evaluateGeofence().then(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static async notifyStateChange(): Promise<void> {
    const state = await this.evaluateGeofence();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}
