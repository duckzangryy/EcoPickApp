import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Alert, DeviceEventEmitter, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { ENV } from '@/config/env';
import type { Report } from '../../api/services/reportService';
import { ReportsBottomSheet, SearchBar, SeverityChip } from '../../components';
import { FilterSheet, MarkerPreviewSheet, SearchOverlay, type MarkerPreviewSheetRef } from '../../components/map';
import { BorderRadius, Colors, Fonts, FontSizes, getColors, Spacing } from '../../constants';
import { useLayout } from '@/hooks/use-layout';
import { INITIAL_REGION, SEVERITY_FILTERS, STATUS_CONFIGS, WASTE_TYPE_CONFIGS, type ReportStatus, type SeverityLevel, type WasteReport, type WasteType } from '../../data/mockData';
import { useReports } from '../../hooks/useReportQueries';
import { useMapStore } from '../../stores/mapStore';
import { useThemeStore } from '../../stores/themeStore';
import { formatDistanceInfo, formatRouteInfo } from '../../utils/distance';

// ─── Marker Design Config ───────────────────────────────────────────
const MARKER_THEMES: Record<SeverityLevel, { bg: string; border: string; icon: string; glow: string }> = {
  light: {
    bg: '#16A34A',
    border: '#15803D',
    icon: 'leaf',
    glow: 'rgba(22, 163, 74, 0.25)',
  },
  medium: {
    bg: '#F59E0B',
    border: '#D97706',
    icon: 'alert-circle',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  heavy: {
    bg: '#EF4444',
    border: '#DC2626',
    icon: 'trash',
    glow: 'rgba(239, 68, 68, 0.25)',
  },
  extreme: {
    bg: '#8B5CF6',
    border: '#7C3AED',
    icon: 'warning',
    glow: 'rgba(139, 92, 246, 0.25)',
  },
};

// ─── Clean Map Style ────────────────────────────────────────────────
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
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#d4eaf7' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f0f4f0' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.fill',
    stylers: [{ color: '#e8e8e8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d0d0d0' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f0f0f0' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry.fill',
    stylers: [{ color: '#f8f8f8' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
];

// ─── Custom Marker Component ────────────────────────────────────────
const CustomMarkerView = React.memo(({ severity, image }: { severity: SeverityLevel; image?: string }) => {
  const theme = MARKER_THEMES[severity];
  const [imgErr, setImgErr] = React.useState(false);
  const showImage = Boolean(image && !imgErr);

  return (
    <View style={markerStyles.wrapper}>
      {/* Glow */}
      <View style={[markerStyles.glow, { backgroundColor: theme.glow }]} />

      {/* Circle + Photo Thumbnail or Icon */}
      <View
        style={[
          markerStyles.circle,
          {
            backgroundColor: showImage ? '#FFFFFF' : theme.bg,
            borderColor: theme.border,
          },
        ]}
      >
        {showImage ? (
          <Image
            source={{ uri: image }}
            style={markerStyles.photo}
            resizeMode="cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <Ionicons
            name={theme.icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color="#FFFFFF"
            style={markerStyles.icon}
          />
        )}
      </View>

      {/* Pointer (đuôi marker) */}
      <View style={[markerStyles.pointer, { borderTopColor: theme.border }]} />
    </View>
  );
});

CustomMarkerView.displayName = 'CustomMarkerView';

const markerStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },

  glow: {
    position: 'absolute',
    top: -4,
    width: 52,
    height: 52,
    borderRadius: 26,
    opacity: 0.6,
  },

  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
  },

  photo: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  icon: {
    zIndex: 2,
  },

  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});

// ─── API → UI severity mapping ──────────────────────────────────────
const API_SEVERITY_TO_UI: Record<string, SeverityLevel> = {
  low: 'light',
  light: 'light',
  medium: 'medium',
  high: 'heavy',
  heavy: 'heavy',
  critical: 'extreme',
  extreme: 'extreme',
};

function transformReportToWasteReport(r: Report): WasteReport {
  // Marker chỉ 46px nên dùng ảnh thu nhỏ; chỉ lùi về ảnh gốc khi server chưa có thumb.
  const photoUrl = r.thumb || r.report_img || (Array.isArray((r as any).photo_urls) && (r as any).photo_urls[0]) || '';
  // waste_types/status chỉ có từ /api/photos sau khi server lưu kèm; nếu bản ghi cũ
  // thiếu thì để rỗng thay vì bịa — bộ lọc sẽ bỏ qua thay vì ẩn oan marker.
  const rawTypes = Array.isArray(r.waste_types) ? r.waste_types : [];
  return {
    id: r.id,
    title: r.location || r.title || (r.address as string | undefined) || `Report #${r.id.slice(0, 6)}`,
    description: r.description || '',
    severity: API_SEVERITY_TO_UI[r.severity || 'low'] || 'light',
    wasteTypes: rawTypes.filter((t): t is WasteType => (WASTE_TYPE_CONFIGS as { key: string }[]).some((c) => c.key === t)),
    status: (STATUS_CONFIGS.some((c) => c.key === r.status) ? r.status : 'reported') as ReportStatus,
    distance: '',
    latitude: r.latitude || 0,
    longitude: r.longitude || 0,
    image: photoUrl,
    createdAt: r.created_at || new Date().toISOString(),
    upvotes: 0,
    comments: 0,
    reporterName: r.reporter?.email || 'Anonymous',
  };
}

// ─── Main MapScreen ─────────────────────────────────────────────────
export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ destLat?: string; destLng?: string; destTitle?: string; focusLat?: string; focusLng?: string }>();
  const insets = useSafeAreaInsets();
  const { bottomTabHeight } = useLayout();
  const mapRef = useRef<MapView>(null);
  const markerSheetRef = useRef<MarkerPreviewSheetRef>(null);
  const { t } = useTranslation();
  const themeMode = useThemeStore((s) => s.theme);
  const colors = getColors(themeMode);

  // ── Zustand Store ──
  const {
    searchQuery,
    setSearchQuery,
    isSearchFocused,
    setSearchFocused,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,

    filters,
    isFilterSheetOpen,
    setFilterSheetOpen,
    toggleSeverityFilter,
    toggleWasteTypeFilter,
    toggleStatusFilter,
    setDistanceRange,
    resetFilters,

    selectedMarker,
    selectMarker,

    isRouting,
    setRouting,
    routeCoordinates,
    setRouteCoordinates,
    routeInfo,
    setRouteInfo,
    isLoadingRoute,
    setLoadingRoute,
    cancelRoute: cancelRouteStore,
  } = useMapStore();

  // ── User Location ──
  const [userLocation, setUserLocation] = React.useState<Location.LocationObject | null>(null);

  // ── Marker rendering lifecycle for remote photo thumbnails ──
  const [tracksViewChanges, setTracksViewChanges] = React.useState(true);

  // ── Fetch reports from API ──
  const { data: apiReports = [], refetch: refetchReports } = useReports();
  useFocusEffect(
    useCallback(() => {
      refetchReports();
    }, [refetchReports])
  );
  const allReports: WasteReport[] = useMemo(() => apiReports.map(transformReportToWasteReport), [apiReports]);

  // Compute distance for each report
  const reportsWithDistance: WasteReport[] = useMemo(() => {
    if (!userLocation) return allReports;
    const uLat = userLocation.coords.latitude;
    const uLng = userLocation.coords.longitude;
    return allReports.map((r) => ({
      ...r,
      distance: formatDistanceInfo(uLat, uLng, r.latitude, r.longitude),
    }));
  }, [userLocation, allReports]);

  // Apply filters
  const filteredReports = useMemo(() => {
    return reportsWithDistance.filter((r) => {
      // Severity filter
      if (!filters.severity.includes(r.severity)) return false;
      // Waste type filter (empty = show all)
      if (filters.wasteTypes.length > 0 && !r.wasteTypes.some((wt) => filters.wasteTypes.includes(wt))) {
        return false;
      }
      // Status filter
      if (!filters.status.includes(r.status)) return false;
      return true;
    });
  }, [reportsWithDistance, filters]);

  // Allow tracksViewChanges to render remote images, then turn off for performance
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [filteredReports]);

  // Filter count for FilterSheet apply button
  const filterMatchCount = filteredReports.length;

  // ── Location Permission ──
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('map.permissionDenied'), t('map.locationDenied'));
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    })();
  }, [t]);

  // ── Handle incoming route params ──
  useEffect(() => {
    if (params.destLat && params.destLng) {
      const destLat = parseFloat(params.destLat);
      const destLng = parseFloat(params.destLng);
      const title = params.destTitle || 'Destination';
      if (!Number.isFinite(destLat) || !Number.isFinite(destLng)) return;

      const triggerRoute = async () => {
        let sLat = userLocation?.coords.latitude;
        let sLng = userLocation?.coords.longitude;
        if (!sLat || !sLng) {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              setUserLocation(loc);
              sLat = loc.coords.latitude;
              sLng = loc.coords.longitude;
            }
          } catch {}
        }
        sLat = sLat || INITIAL_REGION.latitude;
        sLng = sLng || INITIAL_REGION.longitude;
        calculateRoute(sLat, sLng, destLat, destLng, title);
      };
      triggerRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.destLat, params.destLng, params.destTitle]);

  // ── Vừa gửi báo cáo: tự động cập nhật dữ liệu và bay bản đồ tới vị trí ảnh ──
  useEffect(() => {
    const lat = parseFloat(params.focusLat || '');
    const lng = parseFloat(params.focusLng || '');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    refetchReports();
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: 0.012, longitudeDelta: 0.012 },
        1000,
      );
      router.setParams({ focusLat: '', focusLng: '' });
    }, 450);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.focusLat, params.focusLng]);



  // ── Route Calculation ──
  const calculateRoute = useCallback(
    async (startLat: number, startLng: number, destLat: number, destLng: number, title: string) => {
      setLoadingRoute(true);

      try {
        const response = await fetch(
          `${ENV.OSRM_ROUTER_URL}/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`,
        );
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));

          const info = formatRouteInfo(route.distance, route.duration);
          setRouteInfo({ distance: info.distance, duration: info.duration, destTitle: title });
          setRouteCoordinates(coords);
          setRouting(true);

          if (mapRef.current) {
            mapRef.current.fitToCoordinates(
              coords,
              {
                edgePadding: { top: 120, right: 60, bottom: 120, left: 60 },
                animated: true,
              },
            );
          }
        } else {
          Alert.alert(t('map.routeErrorTitle'), t('map.routeError'));
        }
      } catch (error) {
        Alert.alert(t('common.error'), t('map.fetchError'));
        console.log(error);
      } finally {
        setLoadingRoute(false);
      }
    },
    [setLoadingRoute, setRouteInfo, setRouteCoordinates, setRouting, t],
  );

  const cancelRoute = useCallback(() => {
    cancelRouteStore();
    router.setParams({ destLat: '', destLng: '', destTitle: '' });
  }, [cancelRouteStore, router]);

  // ── Handlers ──
  const handleSearchFocus = useCallback(() => {
    setSearchFocused(true);
  }, [setSearchFocused]);

  const handleSearchClose = useCallback(() => {
    setSearchFocused(false);
  }, [setSearchFocused]);

  const handleSearchSelect = useCallback(
    (report: WasteReport) => {
      setSearchFocused(false);
      addRecentSearch(report.title);
      setSearchQuery('');

      // Zoom to marker
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: report.latitude,
            longitude: report.longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          },
          600,
        );
      }

      // Show marker preview
      selectMarker(report);
      markerSheetRef.current?.show(report);
    },
    [addRecentSearch, setSearchFocused, setSearchQuery, selectMarker],
  );

  const handleFilterPress = useCallback(() => {
    setFilterSheetOpen(true);
  }, [setFilterSheetOpen]);

  const handleFilterApply = useCallback(() => {
    setFilterSheetOpen(false);
    Toast.show({
      type: 'success',
      text1: t('filter.apply'),
      text2: `${filterMatchCount} ${t('filter.reportsFound')}`,
    });
  }, [setFilterSheetOpen, filterMatchCount, t]);

  const handleFilterReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const handleFilterClose = useCallback(() => {
    setFilterSheetOpen(false);
  }, [setFilterSheetOpen]);

  const handleViewDetails = useCallback(
    (report: WasteReport) => {
      router.push(`/location/${report.id}`);
    },
    [router],
  );

  const handleMarkerClick = useCallback(
    (report: WasteReport) => {
      selectMarker(report);
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: report.latitude,
            longitude: report.longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          },
          400,
        );
      }
      setTimeout(() => {
        markerSheetRef.current?.show(report);
      }, 50);
    },
    [selectMarker],
  );

  // ── Web postMessage bridge from Leaflet map ──
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'ECOPICK_SELECT_REPORT') {
          const reportId = String(data.reportId || '');
          let targetReport = reportsWithDistance.find((r) => String(r.id) === reportId);
          if (!targetReport && data.photo) {
            const p = data.photo;
            targetReport = {
              id: String(p.id || reportId),
              title: p.title || p.name || `Báo cáo #${String(reportId).slice(0, 6)}`,
              description: p.exif?.model ? `Thiết bị: ${p.exif.model}` : '',
              severity: 'medium',
              wasteTypes: [],
              status: 'reported',
              distance: '',
              latitude: Number(p.lat) || 0,
              longitude: Number(p.lng) || 0,
              image: p.thumb || '',
              createdAt: p.exif?.datetime || new Date().toISOString(),
              upvotes: 0,
              comments: 0,
              reporterName: p.userid || p.name || 'Anonymous',
            };
          }
          if (targetReport) {
            selectMarker(targetReport);
            markerSheetRef.current?.show(targetReport);
          }
        } else if (data.type === 'ECOPICK_VIEW_REPORT') {
          if (data.reportId) {
            router.push(`/location/${data.reportId}`);
          }
        }
      } catch (err) {
        console.warn('Error handling postMessage from map:', err);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [reportsWithDistance, selectMarker, router]);


  const handleStartDirections = useCallback(
    async (report: WasteReport) => {
      markerSheetRef.current?.dismiss();
      selectMarker(null);
      let sLat = userLocation?.coords.latitude;
      let sLng = userLocation?.coords.longitude;
      if (!sLat || !sLng) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setUserLocation(loc);
            sLat = loc.coords.latitude;
            sLng = loc.coords.longitude;
          }
        } catch {}
      }
      sLat = sLat || INITIAL_REGION.latitude;
      sLng = sLng || INITIAL_REGION.longitude;
      calculateRoute(sLat, sLng, report.latitude, report.longitude, report.title);
    },
    [userLocation, calculateRoute, selectMarker],
  );

  const handleViewReport = useCallback(
    (report: WasteReport) => {
      handleMarkerClick(report);
    },
    [handleMarkerClick],
  );
  const handleFocusDakLak = useCallback(() => {
    mapRef.current?.animateToRegion(INITIAL_REGION, 1000);
  }, []);

  const handleMyLocation = useCallback(async () => {
    try {
      if (userLocation && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          },
          1000,
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation(location);
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: location?.coords.latitude,
                longitude: location?.coords.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.015,
              },
              1000,
            );
          }
        } else {
          Alert.alert(t('map.permissionDenied'), t('map.locationSettings'));
        }
      }
    } catch (e) {
      console.log('Error getting location: ', e);
    }
  }, [userLocation, t]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tabPress_map', () => {
      mapRef.current?.animateToRegion(
        {
          latitude: userLocation?.coords.latitude || 0,
          longitude: userLocation?.coords.longitude || 0,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        1000,
      );
    });
    return () => sub.remove();
  }, [userLocation]);
  // ── Render Map ──
  const renderMap = () => (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      mapType="none"
      style={StyleSheet.absoluteFillObject}
      initialRegion={INITIAL_REGION}
      scrollEnabled
      zoomEnabled
      rotateEnabled
      pitchEnabled
      toolbarEnabled={false}
      moveOnMarkerPress={false}
      showsUserLocation={!!userLocation}
      showsMyLocationButton={false}
      showsCompass={false}
      showsPointsOfInterest={false}
      showsBuildings={false}
      showsIndoors={false}
      showsTraffic={false}
      mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
      onPress={(e) => {
        if (e?.nativeEvent?.action === 'marker-press') return;
        // Dismiss marker preview when tapping map
        if (selectedMarker) {
          selectMarker(null);
          markerSheetRef.current?.dismiss();
        }
      }}
    >
      {/* Raster tile overlay as dependable fallback (renders worldwide including Korea) */}
      <UrlTile
        urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
        zIndex={1}
      />

      {/* Waste Report Markers */}
      {filteredReports
        .filter((m) => m.latitude && m.longitude)
        .map((marker) => (
          <Marker
            key={marker.id}
            id={marker.id}
            title={marker.title}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            onPress={(e) => {
              e?.stopPropagation?.();
              handleMarkerClick(marker);
            }}
            tracksViewChanges={tracksViewChanges}
            anchor={{ x: 0.5, y: 1 }}
          >
            <CustomMarkerView severity={marker.severity} image={marker.image} />
          </Marker>
        ))}

      {/* Route Polyline */}
      {isRouting && routeCoordinates.length > 0 && (
        <>
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="rgba(32, 105, 58, 0.15)"
            strokeWidth={10}
            lineCap="round"
            lineJoin="round"
          />
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={Colors.primary}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        </>
      )}
    </MapView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Map */}
      {renderMap()}

      {/* Routing Banner Overlay */}
      {isRouting && routeInfo && (
        <View style={[styles.routingBanner, { top: insets.top + 16, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={styles.routingInfo}>
            <View style={styles.routingIconBg}>
              <Ionicons name="navigate" size={18} color={Colors.primary} />
            </View>
            <View style={styles.routingTextContainer}>
              <Text style={[styles.routingLabel, { color: colors.textSecondary }]}>{t('map.routingLabel')}</Text>
              <Text style={[styles.routingText, { color: colors.textPrimary }]} numberOfLines={1}>
                {routeInfo.destTitle}
              </Text>
              <View style={styles.routeStatsRow}>
                {routeInfo.distance ? (
                  <View style={styles.routeStatChip}>
                    <Ionicons name="speedometer-outline" size={12} color={Colors.primary} />
                    <Text style={styles.routeStatText}>{routeInfo.distance}</Text>
                  </View>
                ) : null}
                {routeInfo.duration ? (
                  <View style={styles.routeStatChip}>
                    <Ionicons name="time-outline" size={12} color={Colors.primary} />
                    <Text style={styles.routeStatText}>{routeInfo.duration}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={cancelRoute} style={styles.cancelRouteBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Overlay */}
      {isLoadingRoute && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>{t('map.loadingRoute')}</Text>
          </View>
        </View>
      )}

      {/* Top overlay — Search + Severity Chips (hide when routing) */}
      {!isRouting && (
        <View style={[styles.topOverlay, { paddingTop: insets.top + 24 }]} pointerEvents="box-none">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFilterPress={handleFilterPress}
            onFocus={handleSearchFocus}
          />
          <View style={styles.filtersRow} pointerEvents="box-none">
            {SEVERITY_FILTERS.map((filter) => (
              <SeverityChip
                key={filter.key}
                severity={filter.key}
                label={filter.label}
                selected={filters.severity.includes(filter.key)}
                onPress={() => toggleSeverityFilter(filter.key)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Floating buttons */}
      <View style={[styles.floatingButtons, { bottom: isRouting ? insets.bottom + 32 : bottomTabHeight + 160 }]} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 10 }]}
          onPress={handleFocusDakLak}
          activeOpacity={0.7}
        >
          <Ionicons name="map-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleMyLocation}
          activeOpacity={0.7}
        >
          <Ionicons name="locate" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet — Reports List (hide when routing or marker selected) */}
      {!isRouting && !selectedMarker && (
        <ReportsBottomSheet
          reports={filteredReports}
          totalCount={filteredReports.length}
          onNavigateReport={handleStartDirections}
          onViewReport={handleViewReport}
        />
      )}

      <MarkerPreviewSheet
        ref={markerSheetRef}
        onViewDetails={handleViewDetails}
        onGetDirections={handleStartDirections}
        onDismiss={() => selectMarker(null)}
      />

      {/* Search Overlay */}
      <SearchOverlay
        visible={isSearchFocused}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onClose={handleSearchClose}
        onSelectReport={handleSearchSelect}
        recentSearches={recentSearches}
        onRemoveRecent={removeRecentSearch}
        onClearRecents={clearRecentSearches}
        reports={reportsWithDistance}
      />

      {/* Filter Sheet */}
      {isFilterSheetOpen && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 1100, elevation: 1100 }]} pointerEvents="box-none">
          <FilterSheet
            visible={isFilterSheetOpen}
            filters={filters}
            onToggleSeverity={toggleSeverityFilter}
            onToggleWasteType={toggleWasteTypeFilter}
            onToggleStatus={toggleStatusFilter}
            onDistanceChange={setDistanceRange}
            onApply={handleFilterApply}
            onReset={handleFilterReset}
            onClose={handleFilterClose}
            matchCount={filterMatchCount}
          />
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    gap: 12,
    zIndex: 10,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  floatingButtons: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 300,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    zIndex: 15,
  },
  locationButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
    }),
  },
  routingBanner: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  routingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  routingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routingTextContainer: {
    flex: 1,
  },
  routingLabel: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  routingText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  routeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  routeStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  routeStatText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    color: Colors.primary,
  },
  cancelRouteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
});
