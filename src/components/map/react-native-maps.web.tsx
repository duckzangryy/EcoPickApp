import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapViewProps {
  style?: any;
  initialRegion?: Region;
  region?: Region;
  onPress?: (e?: any) => void;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  children?: React.ReactNode;
  [key: string]: any;
}

import { ENV } from '@/config/env';

export interface MapViewRef {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToCoordinates: (coordinates: Array<{ latitude: number; longitude: number }>, options?: any) => void;
  setCamera: (camera: any) => void;
}

export const DAKLAK_MAP_PAGE = ENV.DAKLAK_MAP_PAGE;

const getMapSource = () => DAKLAK_MAP_PAGE;

export const MapView = forwardRef<MapViewRef, MapViewProps>((props, ref) => {
  const { style, initialRegion, region: controlledRegion, onRegionChangeComplete } = props;
  const [currentRegion, setCurrentRegion] = useState<Region>(
    controlledRegion || initialRegion || {
      latitude: 12.6828,
      longitude: 108.0378,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    }
  );

  useImperativeHandle(ref, () => ({
    animateToRegion: (newRegion: Region) => {
      setCurrentRegion(newRegion);
      onRegionChangeComplete?.(newRegion);
    },
    fitToCoordinates: (coords: any[]) => {
      if (coords && coords.length > 0) {
        const newRegion = {
          latitude: coords[0].latitude,
          longitude: coords[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setCurrentRegion(newRegion);
        onRegionChangeComplete?.(newRegion);
      }
    },
    setCamera: () => {},
  }));

  return (
    <View style={[styles.container, style]}>
      <iframe
        title="Bản đồ ảnh Đắk Lắk"
        src={getMapSource()}
        allow="geolocation"
        loading="eager"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
          display: 'block',
          pointerEvents: 'auto',
        }}
      />
    </View>
  );
});

MapView.displayName = 'MapView';

export interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  onPress?: () => void;
  children?: React.ReactNode;
  [key: string]: any;
}

// Trên Web, Leaflet bên trong iframe tự render marker ảnh và popup native, tránh tạo overlay chặn chuột
export const Marker: React.FC<MarkerProps> = () => null;

export const Polyline: React.FC<any> = () => null;
export const UrlTile: React.FC<any> = () => null;
export const Callout: React.FC<any> = ({ children }) => <View>{children}</View>;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAF6EE',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
});

export default MapView;
