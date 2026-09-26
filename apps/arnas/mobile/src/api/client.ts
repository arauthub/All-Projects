import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SERVER_URL_KEY = 'arnas_server_url';
const ACCESS_TOKEN_KEY = 'arnas_access_token';
const REFRESH_TOKEN_KEY = 'arnas_refresh_token';

// In-memory fallback if neither SecureStore nor localStorage is available
const memoryStorage = new Map<string, string>();

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryStorage.get(key) || null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStorage.set(key, value);
  }
}

async function deleteStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    memoryStorage.delete(key);
  }
}

export const storage = {
  getServerUrl: async (): Promise<string> => {
    return (await getStorageItem(SERVER_URL_KEY)) || 'http://localhost:8080';
  },
  setServerUrl: async (url: string): Promise<void> => {
    const cleanUrl = url.replace(/\/+$/, '');
    await setStorageItem(SERVER_URL_KEY, cleanUrl);
  },
  getAccessToken: async (): Promise<string | null> => {
    return await getStorageItem(ACCESS_TOKEN_KEY);
  },
  setTokens: async (accessToken: string, refreshToken?: string): Promise<void> => {
    await setStorageItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await setStorageItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },
  clearAuth: async (): Promise<void> => {
    await deleteStorageItem(ACCESS_TOKEN_KEY);
    await deleteStorageItem(REFRESH_TOKEN_KEY);
  },
};

export class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = await storage.getServerUrl();
    const token = await storage.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error: any = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (err: any) {
      if (err.status) throw err;
      throw new Error(`Unable to connect to ARNAS server at ${baseUrl}. Ensure device is on the same network or Tailscale is active.`);
    }
  }

  public static get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public static post<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  public static put<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    });
  }

  public static delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }
}
