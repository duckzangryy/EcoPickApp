const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // react-native-maps chỉ có Google provider trên Android (bắt buộc API key + billing).
  // Thay bằng shim Leaflet/OSM: web dùng iframe, native dùng WebView.
  if (moduleName === 'react-native-maps') {
    const file = platform === 'web' ? 'react-native-maps.web.tsx' : 'react-native-maps.native.tsx';
    return {
      filePath: path.resolve(__dirname, 'src/components/map', file),
      type: 'sourceFile',
    };
  }

  if (platform === 'web') {

    if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
      const subpath = moduleName === 'zustand' ? 'index.js' : `${moduleName.replace('zustand/', '')}.js`;
      const target = path.resolve(__dirname, 'node_modules/zustand', subpath);
      return {
        filePath: target,
        type: 'sourceFile',
      };
    }
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
