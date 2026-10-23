import Constants from 'expo-constants';

/**
 * Helper lấy giá trị environment variable:
 * 1. Ưu tiên biến môi trường Expo (process.env.EXPO_PUBLIC_*)
 * 2. Fallback sang Constants.expoConfig?.extra
 * 3. Cuối cùng dùng giá trị mặc định
 */
const getEnv = (key: string, fallback: string = ''): string => {
  return (
    process.env[key] ||
    (Constants.expoConfig?.extra as Record<string, string> | undefined)?.[key] ||
    fallback
  );
};

export const ENV = {
  /**
   * API Base URL cho Backend chính của EcoPick (REST API)
   */
  API_BASE_URL: getEnv(
    'EXPO_PUBLIC_API_BASE_URL',
    'https://ecopick-api-iota.vercel.app'
  ),

  /**
   * Base URL server bản đồ Đắk Lắk (upload ảnh, GPS, danh sách photos)
   */
  DAKLAK_MAP_URL: getEnv(
    'EXPO_PUBLIC_DAKLAK_MAP_URL',
    'https://ecopick-api-iota.vercel.app'
  ),

  /**
   * Link Webview nhúng bản đồ tương tác Đắk Lắk trên Web/Mobile
   */
  DAKLAK_MAP_PAGE: getEnv(
    'EXPO_PUBLIC_DAKLAK_MAP_PAGE',
    `${getEnv('EXPO_PUBLIC_DAKLAK_MAP_URL', 'https://ecopick-api-iota.vercel.app').replace(/\/$/, '')}/opendesign/mockups/daklak-map/`
  ),

  /**
   * API chỉ đường OSRM Routing
   */
  OSRM_ROUTER_URL: getEnv(
    'EXPO_PUBLIC_OSRM_ROUTER_URL',
    'https://router.project-osrm.org'
  ),
};

export default ENV;
