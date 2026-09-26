import { create } from 'zustand';
import { ApiClient, storage } from '../api/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER' | 'GUEST';
  familyId: string;
  familyName?: string;
  storageQuotaBytes: string;
  usedStorageBytes: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  serverUrl: string;
  login: (email: string, pass: string, serverUrl?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setServerUrl: (url: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  serverUrl: 'http://localhost:8080',

  setServerUrl: async (url: string) => {
    await storage.setServerUrl(url);
    set({ serverUrl: url });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const savedUrl = await storage.getServerUrl();
      const token = await storage.getAccessToken();

      if (!token) {
        set({ isAuthenticated: false, user: null, serverUrl: savedUrl, isLoading: false });
        return;
      }

      // Verify token by calling /api/v1/auth/me
      const profile = await ApiClient.get<User>('/api/v1/auth/me');
      set({
        user: profile,
        isAuthenticated: true,
        serverUrl: savedUrl,
        isLoading: false,
      });
    } catch (err) {
      await storage.clearAuth();
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },

  login: async (email: string, password: string, serverUrl?: string) => {
    if (serverUrl) {
      await get().setServerUrl(serverUrl);
    }

    const response = await ApiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/api/v1/auth/login', {
      email,
      password,
      deviceName: 'Mobile App',
      platform: 'ios',
    });

    await storage.setTokens(response.accessToken, response.refreshToken);

    set({
      user: response.user,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await storage.clearAuth();
    set({ user: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    try {
      const profile = await ApiClient.get<User>('/api/v1/auth/me');
      set({ user: profile });
    } catch (e) {
      // Ignore background refresh errors
    }
  },
}));
