import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserInfo } from '@/types/user';

// ============================================================
// Types
// ============================================================

interface AuthState {
  // State
  token: string | null;
  refreshToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (token: string, refreshToken: string, user: UserInfo) => void;
  setToken: (token: string, refreshToken: string) => void;
  setUser: (user: UserInfo) => void;
  logout: () => void;
  loadStoredAuth: () => Promise<void>;
  updateUser: (updates: Partial<UserInfo>) => void;
}

// ============================================================
// Auth Store – Quản lý trạng thái đăng nhập
// Token format: Bearer token (không phải JWT)
// ============================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state (mặc định sẵn sàng với LOCAL_USER để không bị treo loading)
  token: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  // Login: lưu token + user vào store và AsyncStorage
  setAuth: async (token: string, refreshToken: string, user: UserInfo) => {
    set({ token, refreshToken, user, isAuthenticated: true, isLoading: false });

    try {
      await AsyncStorage.multiSet([
        ['@auth_token', token],
        ['@auth_refresh_token', refreshToken],
        ['@auth_user', JSON.stringify(user)],
      ]);
    } catch (error) {
      console.error('[AuthStore] Lỗi lưu auth:', error);
    }
  },

  // Lưu token tạm thời để gọi các API cần auth
  setToken: (token: string, refreshToken: string) => {
    set({ token, refreshToken });
  },

  // Cập nhật user info (sau khi fetch userinfo)
  setUser: async (user: UserInfo) => {
    set({ user });
    try {
      await AsyncStorage.setItem('@auth_user', JSON.stringify(user));
    } catch (error) {
      console.error('[AuthStore] Lỗi lưu user:', error);
    }
  },

  // Logout: xóa tất cả auth data
  logout: async () => {
    set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isLoading: false });

    try {
      await AsyncStorage.multiRemove(['@auth_token', '@auth_refresh_token', '@auth_user']);
    } catch (error) {
      console.error('[AuthStore] Lỗi xóa auth:', error);
    }
  },

  // Load auth từ AsyncStorage khi app khởi động
  loadStoredAuth: async () => {
    try {
      const [[, token], [, refreshToken], [, userJson]] = await AsyncStorage.multiGet([
        '@auth_token',
        '@auth_refresh_token',
        '@auth_user',
      ]);

      if (token && userJson && !token.startsWith('mock_')) {
        const user = JSON.parse(userJson) as UserInfo;
        set({ token, refreshToken: refreshToken ?? null, user, isAuthenticated: true, isLoading: false });
      } else {
        await AsyncStorage.multiRemove(['@auth_token', '@auth_refresh_token', '@auth_user']);
        set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('[AuthStore] Lỗi load auth:', error);
      set({ token: null, refreshToken: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Cập nhật thông tin user
  updateUser: async (updates: Partial<UserInfo>) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, ...updates };
    set({ user: updatedUser });

    try {
      await AsyncStorage.setItem('@auth_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('[AuthStore] Lỗi cập nhật user:', error);
    }
  },
}));
