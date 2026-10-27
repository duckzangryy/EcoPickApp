import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Tabs, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, DeviceEventEmitter, Platform, StyleSheet, Text, View } from 'react-native';
import { ImageSourceSheet } from '../../components/ImageSourceSheet';
import { useAuthStore } from '../../stores/authStore';
import { Colors, Fonts, FontSizes } from '../../constants';

import Toast from 'react-native-toast-message';
import { useLayout } from '../../hooks/use-layout';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';
import { extractGpsFromExif } from '../../utils/exif';

export default function TabLayout() {
  const {bottomTabHeight } = useLayout();
  const router = useRouter();
  const { t } = useTranslation();
  const [showSheet, setShowSheet] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useThemeStore((state) => state.theme);
  const colors = getColors(theme);

  const handleReportPress = (e: any) => {
    e.preventDefault();
    setShowSheet(true);
  };

  // ── Camera flow ──
  const handleSelectCamera = useCallback(async () => {
    let perm = await ImagePicker.getCameraPermissionsAsync();
    if (perm.status !== 'granted') {
      perm = await ImagePicker.requestCameraPermissionsAsync();
    }
    if (perm.status !== 'granted') {
      Alert.alert(
        t('permissions.title'),
        t('permissions.cameraMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('permissions.goWithoutPhoto'), onPress: () => router.push('/report') }
        ]
      );
      return;
    }

    try {
      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
          exif: true,
        });
      } catch (exifError) {
        console.warn('Camera retry without EXIF:', exifError);
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
          exif: false,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.uri;

        // Vị trí chụp: ưu tiên EXIF, chỉ fallback sang GPS thiết bị
        let latitude = '';
        let longitude = '';
        let address = '';
        let locationSource: string | undefined;

        const photoGps = extractGpsFromExif(asset.exif);
        if (photoGps) {
          latitude = String(photoGps.latitude);
          longitude = String(photoGps.longitude);
          locationSource = 'exif';
        } else {
          try {
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            if (locStatus === 'granted') {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              latitude = String(loc.coords.latitude);
              longitude = String(loc.coords.longitude);
            }
          } catch {
            // Location fetch failed, proceed without it
          }
        }

        if (latitude && longitude) {
          try {
            const results = await Location.reverseGeocodeAsync({
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            });
            if (results.length > 0) {
              const r = results[0];
              const parts = [r.streetNumber, r.street].filter(Boolean);
              const line1 = parts.length > 0 ? parts.join(' ') : r.name || '';
              const cityParts = [r.district, r.city, r.region].filter(Boolean);
              address = [line1, cityParts.join(', ')].filter(Boolean).join(', ');
            }
          } catch {
            // Reverse geocode failed — coordinates are enough
          }
        }

        router.push({
          pathname: '/report',
          params: { imageUri, latitude, longitude, address, source: 'camera', ...(locationSource ? { locationSource } : {}) }
        });
      }
    } catch (error: any) {
      console.error('Error opening camera:', error);
      Toast.show({
        type: 'error',
        text1: t('permissions.cameraError'),
        text2: error?.message || String(error),
      });
    }
  }, [router, t]);

  // ── Gallery flow: pick image → extract EXIF GPS → pick-location → /report ──
  const handleSelectGallery = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      // Alert.alert(t('common.error'), t('report.galleryPermissionRequired'));
      Toast.show({ type: 'error', text1: t('report.galleryPermissionRequired') });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.uri;
        const coords = extractGpsFromExif(asset.exif);

        let initialLat = '';
        let initialLng = '';
        let address = '';

        if (coords) {
          initialLat = String(coords.latitude);
          initialLng = String(coords.longitude);
          try {
            const results = await Location.reverseGeocodeAsync({
              latitude: coords.latitude,
              longitude: coords.longitude,
            });
            if (results.length > 0) {
              const r = results[0];
              const parts = [r.streetNumber, r.street].filter(Boolean);
              const line1 = parts.length > 0 ? parts.join(' ') : r.name || '';
              const cityParts = [r.district, r.city, r.region].filter(Boolean);
              address = [line1, cityParts.join(', ')].filter(Boolean).join(', ');
            }
          } catch {
            // Geocode failed, proceed with coordinates
          }
        }

        // Navigate to pick-location, which will center on photo coordinates and forward to /report
        router.push({
          pathname: '/pick-location',
          params: {
            imageUri,
            initialLat,
            initialLng,
            address,
            locationSource: coords ? 'exif' : undefined,
            returnTo: 'report-gallery',
          },
        });
      }
    } catch (error: any) {
      console.error('Error opening gallery:', error);
      Toast.show({
        type: 'error',
        text1: t('permissions.galleryError'),
        text2: error?.message || String(error),
      });
    }
  }, [router, t]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [styles.tabBar, { height: bottomTabHeight, backgroundColor: colors.card, borderTopColor: colors.border }],
          sceneStyle: { backgroundColor: colors.background },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textInactive,
          tabBarLabelStyle: styles.tabBarLabel
        }}
      >
        <Tabs.Screen
          name="map"
          options={{
            title: t('tabs.explore'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={[styles.tabBarLabel, { color }]}>{t('tabs.explore')}</Text>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              DeviceEventEmitter.emit('tabPress_map');
            },
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: t('tabs.events'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={[styles.tabBarLabel, { color }]}>{t('tabs.events')}</Text>
            ),
          }}
          listeners={{
            tabPress: () => {
              DeviceEventEmitter.emit('tabPress_events');
            },
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: t('tabs.report'),
            tabBarAccessibilityLabel: t('tabs.report'),
            tabBarStyle: { display: 'none' },
            tabBarIcon: () => (
              <View style={styles.floatingReportBtn}>
                <Ionicons name="camera" size={28} color={Colors.white} />
              </View>
            ),
            tabBarLabel: () => null,
          }}
          listeners={{
            tabPress: handleReportPress,
          }}
        />
        <Tabs.Screen
          name="badges"
          options={{
            title: t('tabs.badges'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={24} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={[styles.tabBarLabel, { color }]}>{t('tabs.badges')}</Text>
            ),
          }}
          listeners={{
            tabPress: () => {
              DeviceEventEmitter.emit('tabPress_badges');
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
            tabBarLabel: ({ color }) => (
              <Text style={[styles.tabBarLabel, { color }]}>{t('tabs.profile')}</Text>
            ),
          }}
          listeners={{
            tabPress: (event) => {
              if (!isAuthenticated) {
                event.preventDefault();
                router.push('/auth/login');
                return;
              }
              DeviceEventEmitter.emit('tabPress_profile');
            },
          }}
        />
      </Tabs>

      <ImageSourceSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onSelectCamera={handleSelectCamera}
        onSelectGallery={handleSelectGallery}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.overlayWhiteStrong,
    borderTopColor: Colors.borderMedium,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
    }),
  },
  tabBarLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    textTransform: 'capitalize',
    marginTop: -4,
  },
  floatingReportBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 22 : 18,
    ...Platform.select({
      ios: {
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
      default: {
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
    }),
  },
});
