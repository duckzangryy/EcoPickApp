import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ENV } from '@/config/env';

/**
 * Thay thế react-native-maps trên native: render bản đồ Leaflet (OSM) trong WebView.
 * Không cần Google Maps SDK / API key. Trang map nằm ở ENV.DAKLAK_MAP_PAGE và
 * nhận lệnh qua `window.ECOPICK_CMD`, gửi sự kiện ngược lại qua postMessage.
 *
 * Marker/Polyline/UrlTile là component "dữ liệu": chỉ mang prop cho MapView đọc,
 * không tự render gì. Nhờ vậy các màn hình giữ nguyên JSX hiện có.
 */

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** Hình dạng sự kiện chạm — đủ cho `onPress` của Marker và MapView. */
export interface MapPressEvent {
  stopPropagation?: () => void;
  nativeEvent?: { action?: string };
}

export interface MapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (
    coordinates: Array<{ latitude: number; longitude: number }>,
    options?: { edgePadding?: unknown; animated?: boolean; [key: string]: unknown },
  ) => void;
  setCamera: (camera: { center?: { latitude: number; longitude: number }; zoom?: number }) => void;
}

const MAP_URL = ENV.DAKLAK_MAP_PAGE;

// ─── Data-only các thành phần con ───────────────────────────────────
type Coord = { latitude: number; longitude: number };

export const Marker: React.FC<{
  coordinate: Coord;
  onPress?: (e?: MapPressEvent) => void;
  children?: React.ReactNode;
  [key: string]: unknown;
}> = () => null;

export const Polyline: React.FC<{ coordinates: Coord[]; [key: string]: unknown }> = () => null;
export const UrlTile: React.FC<Record<string, unknown>> = () => null;
export const Callout: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement(React.Fragment, null, children);
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

// ─── Đọc dữ liệu từ cây con ─────────────────────────────────────────
interface MarkerData {
  id: string;
  latitude: number;
  longitude: number;
  severity?: string;
  image?: string;
  title?: string;
}

interface Extracted {
  markers: MarkerData[];
  markersById: Record<string, (e?: unknown) => void>;
  polylines: Array<{ coordinates: Coord[]; color?: string; width?: number; opacity?: number }>;
}

const extract = (children: React.ReactNode): Extracted => {
  const markers: MarkerData[] = [];
  const markersById: Record<string, (e?: unknown) => void> = {};
  const polylines: Extracted['polylines'] = [];

  React.Children.forEach(children as React.ReactNode, (child, index) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as Record<string, any>;
    const key = String(child.key ?? index);

    if (child.type === Marker) {
      const coord = props.coordinate;
      if (!coord || typeof coord.latitude !== 'number' || typeof coord.longitude !== 'number') return;
      // Dữ liệu hiển thị (severity, ảnh) nằm trong component con do màn hình truyền vào.
      const inner = React.isValidElement(props.children)
        ? (props.children.props as Record<string, any>)
        : {};
      const id = String(props.id ?? inner.id ?? key);
      markers.push({
        id,
        latitude: coord.latitude,
        longitude: coord.longitude,
        severity: inner.severity,
        image: inner.image,
        title: inner.title ?? props.title,
      });
      if (typeof props.onPress === 'function') markersById[id] = props.onPress;
      return;
    }

    if (child.type === Polyline && Array.isArray(props.coordinates)) {
      polylines.push({
        coordinates: props.coordinates,
        color: props.strokeColor,
        width: props.strokeWidth,
        opacity: (props as any).strokeOpacity,
      });
    }
  });

  return { markers, markersById, polylines };
};

// ─── MapView ────────────────────────────────────────────────────────
/** Prop của react-native-maps mà shim chấp nhận nhưng bỏ qua (không có Google SDK). */
interface IgnoredMapProps {
  provider?: string;
  mapType?: string;
  customMapStyle?: unknown;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  toolbarEnabled?: boolean;
  moveOnMarkerPress?: boolean;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  showsPointsOfInterest?: boolean;
  showsBuildings?: boolean;
  showsIndoors?: boolean;
  showsTraffic?: boolean;
  mapPadding?: unknown;
  onPanDrag?: () => void;
}

export interface MapViewProps extends MapViewCoreProps, IgnoredMapProps {}

type MapViewCoreProps = {
  style?: unknown;
  initialRegion?: Region;
  region?: Region;
  onPress?: (e?: MapPressEvent) => void;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  children?: React.ReactNode;
};

export const MapView = forwardRef<MapViewRef, MapViewProps>((props, ref) => {
  const { style, initialRegion, region, onPress, onRegionChange, onRegionChangeComplete, children } =
    props;
  const webRef = useRef<WebView>(null);
  const readyRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const handlersRef = useRef<Record<string, (e?: unknown) => void>>({});

  const send = useCallback((command: Record<string, unknown>) => {
    const js = `window.ECOPICK_CMD && window.ECOPICK_CMD(${JSON.stringify(JSON.stringify(command))});true;`;
    if (readyRef.current) webRef.current?.injectJavaScript(js);
    else queueRef.current.push(js);
  }, []);

  // Đẩy marker + polyline mỗi khi cây con thay đổi
  const { markers, markersById, polylines } = extract(children);
  const markerSignature = JSON.stringify(markers);
  const polylineSignature = JSON.stringify(polylines);

  handlersRef.current = markersById;

  // Trang có thể reload (resume/khôi phục) — giữ bản mới nhất để đẩy lại khi READY
  const latestRef = useRef({ markers, polylines });
  latestRef.current = { markers, polylines };

  useEffect(() => {
    if (!readyRef.current) return;
    send({ type: 'ECOPICK_SET_MARKERS', markers });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markerSignature, send]);

  useEffect(() => {
    if (!readyRef.current) return;
    send({ type: 'ECOPICK_SET_ROUTE', lines: polylines });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polylineSignature, send]);

  const moveTo = useCallback(
    (next: Region, animate: boolean) => {
      send({
        type: 'ECOPICK_SET_REGION',
        latitude: next.latitude,
        longitude: next.longitude,
        latitudeDelta: next.latitudeDelta,
        animate,
      });
    },
    [send],
  );

  useImperativeHandle(
    ref,
    () => ({
      animateToRegion: (next: Region) => moveTo(next, true),
      fitToCoordinates: (coords) => send({ type: 'ECOPICK_FIT_COORDS', coords }),
      setCamera: (camera) => {
        if (!camera?.center) return;
        moveTo(
          {
            latitude: camera.center.latitude,
            longitude: camera.center.longitude,
            latitudeDelta: camera.zoom ? 360 / 2 ** camera.zoom : 0.05,
            longitudeDelta: camera.zoom ? 360 / 2 ** camera.zoom : 0.05,
          },
          false,
        );
      },
    }),
    [moveTo, send],
  );

  // Vùng ban đầu (region có điều khiển chưa có thì dùng initialRegion)
  const initial = region || initialRegion;
  const initialRef = useRef(initial);

  useEffect(() => {
    if (region && readyRef.current) moveTo(region, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region?.latitude, region?.longitude]);

  const emitRegion = useCallback(
    (next: Region) => {
      onRegionChange?.(next);
      onRegionChangeComplete?.(next);
    },
    [onRegionChange, onRegionChangeComplete],
  );

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      let data: Record<string, any>;
      try {
        data = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'ECOPICK_READY':
          readyRef.current = true;
          if (initialRef.current) {
            moveTo(initialRef.current, false);
          }
          const latest = latestRef.current;
          send({ type: 'ECOPICK_SET_MARKERS', markers: latest.markers });
          if (latest.polylines.length) send({ type: 'ECOPICK_SET_ROUTE', lines: latest.polylines });
          queueRef.current.forEach((js) => webRef.current?.injectJavaScript(js));
          queueRef.current = [];
          break;
        case 'ECOPICK_REGION_CHANGING':
          onRegionChange?.({
            latitude: Number(data.latitude) || 0,
            longitude: Number(data.longitude) || 0,
            latitudeDelta: Number(data.latitudeDelta) || 0.05,
            longitudeDelta: Number(data.longitudeDelta) || 0.05,
          });
          break;
        case 'ECOPICK_REGION_CHANGED':
          emitRegion({
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            latitudeDelta: Number(data.latitudeDelta) || 0.05,
            longitudeDelta: Number(data.longitudeDelta) || 0.05,
          });
          break;
        case 'ECOPICK_MAP_PRESS':
          onPress?.({ nativeEvent: { action: 'press' } });
          break;
        case 'ECOPICK_SELECT_REPORT':
          handlersRef.current[String(data.reportId)]?.({ stopPropagation: () => {} });
          break;
        default:
          break;
      }
    },
    [emitRegion, moveTo, onPress],
  );

  return (
    <View style={[styles.container, style as any]}>
      <WebView
        ref={webRef}
        source={{ uri: MAP_URL }}
        style={styles.web}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        onMessage={handleMessage}
        androidLayerType="hardware"
      />
    </View>
  );
});

MapView.displayName = 'MapView';

/** Cho phép `useRef<MapView>` như bản gốc (vốn là class). */
export type MapView = MapViewRef;

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#FAF6EE' },
});

export default MapView;
