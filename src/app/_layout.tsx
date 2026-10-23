import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { ActivityIndicator, Appearance, StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';
import { Colors, getColors } from '../constants/Colors';
import i18n, { loadSavedLanguage } from '../i18n';
import { useThemeStore } from '../stores/themeStore';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';

SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const { t } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // Chờ auth state load xong từ AsyncStorage (splash đã xử lý loadStoredAuth)
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inPublicGroup =
      segments[0] === 'splash' ||
      segments[0] === 'onboarding' ||
      segments[0] === 'index' ||
      segments.length < 1;

    if (!isAuthenticated && !inAuthGroup && !inPublicGroup) {
      router.replace('/auth/login');
      Toast.show({
        type: 'success',
        text1: t('auth.logoutSuccess'),
        text2: t('auth.logoutSuccessDesc'),
      });
    }
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/map');
      Toast.show({
        type: 'success',
        text1: t('auth.loginSuccess'),
        text2: t('auth.loginSuccessDesc'),
      });
    }
  }, [isAuthenticated, isLoading, segments]);

  return null;
}

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const theme = useThemeStore((s) => s.theme);
  const colors = getColors(theme);
  const [themeLoaded, setThemeLoaded] = React.useState(false);

  useEffect(() => {
    loadSavedLanguage();
    useAuthStore.getState().loadStoredAuth();
    void useThemeStore.getState().loadTheme().finally(() => setThemeLoaded(true));
  }, []);

  // Theme là lựa chọn thủ công trong app, không theo OS. Ép native components
  // (Alert, DateTimePicker, keyboard, system dialogs) khớp với theme đang bật.
  useEffect(() => {
    Appearance.setColorScheme?.(theme);
  }, [theme]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if ((!fontsLoaded && !fontError) || !themeLoaded) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <I18nextProvider i18n={i18n}>
            <View style={[styles.container, { backgroundColor: colors.background }]} onLayout={onLayoutRootView}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} initialRouteName="index">
                <Stack.Screen name="index" options={{ headerShown: false, animation: 'none' }} />
                <Stack.Screen name="splash" options={{ headerShown: false, animation: 'none' }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="auth" options={{ headerShown: false, animation: 'slide_from_right' }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
                <Stack.Screen name="location/[id]/index" options={{ presentation: 'card' }} />
                <Stack.Screen name="events/[id]/index" options={{ presentation: 'card' }} />
                <Stack.Screen name="events/participants" />
                <Stack.Screen name="badges/[id]/index" options={{ headerShown: false, presentation: 'card' }} />
                <Stack.Screen name="settings/index" options={{ headerShown: false, presentation: 'card' }} />
                <Stack.Screen name="profile/edit-profile" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
              </Stack>
            </View>
            {/* Guard phải nằm bên trong Stack để có thể dùng useRouter/useSegments */}
            <NavigationGuard />
          </I18nextProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
      <Toast config={toastConfig} topOffset={60} visibilityTime={3000} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
