import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { AppTheme } from '@/constants/Colors';

interface ThemeState {
  theme: AppTheme;
  isLoaded: boolean;
  loadTheme: () => Promise<void>;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  isLoaded: false,
  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem('@app_theme');
      if (stored === 'light' || stored === 'dark') set({ theme: stored, isLoaded: true });
      else set({ isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
  toggleTheme: () => {
    const theme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme });
    void AsyncStorage.setItem('@app_theme', theme).catch((error) => {
      console.warn('[ThemeStore] Could not persist theme:', error);
    });
  },
}));
