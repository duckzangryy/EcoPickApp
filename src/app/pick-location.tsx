import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import MapView, { PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Colors, Fonts, BorderRadius } from '../constants';

const CUSTOM_MAP_STYLE = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#d4eaf7' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry.fill', stylers: [{ color: '#f0f4f0' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#e8e8e8' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d0d0d0' }] },
  { featureType: 'road.arterial', elementType: 'geometry.fill', stylers: [{ color: '#f0f0f0' }] },
  { featureType: 'road.local', elementType: 'geometry.fill', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] }
];

const DEFAULT_REGION = {
  latitude: 12.6828,
  longitude: 108.0378,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05
};

export default function PickLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    initialLat?: string;
    initialLng?: string;
    returnTo?: string;
    imageUri?: string;
    address?: string;
    locationSource?: string;
  }>();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { t } = useTranslation();

  const [region, setRegion] = useState(() => {
    if (params.initialLat && params.initialLng) {
      return {
        latitude: parseFloat(params.initialLat),
        longitude: parseFloat(params.initialLng),
        latitudeDelta: 0.008,
        longitudeDelta: 0.008
      };
    }
    return DEFAULT_REGION;
  });

  const [address, setAddress] = useState(() => {
    if (params.address) {
      const parts = params.address.split(', ');
      return parts[0] || '';
    }
    return '';
  });
  const [addressLine2, setAddressLine2] = useState(() => {
    if (params.address) {
      const parts = params.address.split(', ');
      return parts.length > 1 ? parts.slice(1).join(', ') : '';
    }
    return '';
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // PIN bounce animation
  const pinBounce = useSharedValue(0);
  const pinScale = useSharedValue(1);
  const shadowScale = useSharedValue(1);

  const animatedPinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pinBounce.value }, { scale: pinScale.value }]
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shadowScale.value }],
    opacity: 1 - (shadowScale.value - 0.8) * 1.5
  }));

  // Reverse geocode the center of the map
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsDetecting(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length > 0) {
        const r = results[0];
        const parts = [r.streetNumber, r.street].filter(Boolean);
        const line1 = parts.length > 0 ? parts.join(' ') : r.name || '';
        const cityParts = [r.district, r.city, r.region].filter(Boolean);
        const line2 = cityParts.join(', ');
        setAddress(line1 || t('pickLocation.moveMap'));
        setAddressLine2(line2);
      } else {
        setAddress(t('pickLocation.moveMap'));
        setAddressLine2('');
      }
    } catch {
      setAddress(t('pickLocation.moveMap'));
      setAddressLine2('');
    } finally {
      setIsDetecting(false);
    }
  }, [t]);

  // On map ready, get user location and center on it (if no initial coords)
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setHasLocationPermission(granted);
      if (granted && !params.initialLat && !params.initialLng) {
        const loc = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 800);
        reverseGeocode(loc.coords.latitude, loc.coords.longitude);
      }
    })();
    if (params.initialLat && params.initialLng) {
      const lat = parseFloat(params.initialLat);
      const lng = parseFloat(params.initialLng);
      const newRegion = {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);
      if (!params.address) {
        reverseGeocode(lat, lng);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On region change — update address
  const handleRegionChangeComplete = useCallback((newRegion: any) => {
    setRegion(newRegion);
    reverseGeocode(newRegion.latitude, newRegion.longitude);
    // Reset pin animation
    pinBounce.value = withSpring(0, { damping: 12, stiffness: 200 });
    pinScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    shadowScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [reverseGeocode, pinBounce, pinScale, shadowScale]);

  // On region change start — lift pin
  const handleRegionChange = useCallback(() => {
    pinBounce.value = withSpring(-14, { damping: 15, stiffness: 180 });
    pinScale.value = withSpring(1.1, { damping: 15, stiffness: 180 });
    shadowScale.value = withSpring(1.4, { damping: 15, stiffness: 180 });
  }, [pinBounce, pinScale, shadowScale]);

  const handleMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008
        };
        mapRef.current?.animateToRegion(newRegion, 800);
      }
    } catch (e) {
      console.log('Error getting location:', e);
    }
  }, []);

  const handleConfirm = () => {
    // Không lưu câu hướng dẫn "di chuyển bản đồ…" thành địa chỉ — dùng toạ độ thay thế
    const isPlaceholder = !address || address === t('pickLocation.moveMap');
    const fullAddress = isPlaceholder
      ? `${region.latitude.toFixed(6)}, ${region.longitude.toFixed(6)}`
      : [address, addressLine2].filter(Boolean).join(', ');
    if (params.returnTo === 'report') {
      // Coming from Report screen to edit location
      router.back();
      // Use setTimeout to ensure navigation completes before setting params
      setTimeout(() => {
        router.setParams({
          latitude: String(region.latitude),
          longitude: String(region.longitude),
          address: fullAddress,
          locationSource: 'custom'
        });
      }, 100);
    } else if (params.returnTo === 'report-gallery') {
      // Coming from gallery flow — navigate to report with image + location
      router.replace({
        pathname: '/report',
        params: {
          imageUri: params.imageUri || '',
          latitude: String(region.latitude),
          longitude: String(region.longitude),
          address: fullAddress,
          source: 'library',
          locationSource: params.locationSource || 'custom'
        }
      });
    } else if (params.returnTo === 'events/create') {
      // Coming from Create Event screen
      router.replace({
        pathname: '/events/create',
        params: {
          location: address || fullAddress,
          latitude: String(region.latitude),
          longitude: String(region.longitude),
          address: fullAddress,
        }
      });
    } else {
      // Default fallback — navigate to report
      router.replace({
        pathname: '/report',
        params: {
          imageUri: params.imageUri || '',
          latitude: String(region.latitude),
          longitude: String(region.longitude),
          address: fullAddress,
          source: 'library',
          locationSource: 'custom'
        }
      });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        mapType="none"
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsIndoors={false}
        showsTraffic={false}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={1}
        />
      </MapView>
      
      <View style={styles.pinContainer} pointerEvents="none">
        <Animated.View style={[styles.pinShadow, animatedShadowStyle]} />
        <Animated.View style={[styles.pinWrapper, animatedPinStyle]}>
          <View style={styles.pinHead}>
            <Ionicons name="location" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.pinTail} />
        </Animated.View>
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('pickLocation.title')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <TouchableOpacity
        style={[styles.myLocationBtn, { bottom: 255 }]}
        onPress={() => {
          mapRef.current?.animateToRegion({
            latitude: 12.6828,
            longitude: 108.0378,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 800);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="map-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.myLocationBtn, { bottom: 200 }]} onPress={handleMyLocation} activeOpacity={0.7}>
        <Ionicons name="locate" size={22} color={Colors.primary} />
      </TouchableOpacity>

      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.addressSection}>
          <View style={styles.addressIconContainer}>
            <Ionicons name="location" size={20} color={Colors.primary} />
          </View>
          <View style={styles.addressTextContainer}>
            {isDetecting ? (
              <View style={styles.detectingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.detectingText}>{t('pickLocation.detecting')}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.addressMain} numberOfLines={1}>{address}</Text>
                {addressLine2 ? (
                  <Text style={styles.addressSub} numberOfLines={1}>{addressLine2}</Text>
                ) : null}
              </>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.confirmBtnText}>{t('pickLocation.confirm')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // ─── Center PIN ───
  pinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -58,
    width: 48,
    height: 58,
    alignItems: 'center',
    zIndex: 10,
  },
  pinWrapper: {
    alignItems: 'center',
  },
  pinHead: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#20693A',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#20693A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#20693A',
    marginTop: -3,
  },
  pinShadow: {
    position: 'absolute',
    bottom: -4,
    width: 20,
    height: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignSelf: 'center',
  },
  // ─── Top Bar ───
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    zIndex: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: '#1E293B',
  },
  headerPlaceholder: {
    width: 40,
    height: 40,
  },
  // ─── My Location FAB ───
  myLocationBtn: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 15,
  },
  // ─── Bottom Card ───
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 20,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(32, 105, 58, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressMain: {
    fontFamily: Fonts.semiBold,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 2,
  },
  addressSub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#64748B',
  },
  detectingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detectingText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#94A3B8',
  },
  confirmBtn: {
    backgroundColor: '#2D5A3D',
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
