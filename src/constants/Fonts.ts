import { Platform } from 'react-native';

const WEB_FONT_FAMILY =
  "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const Fonts = {
  regular: Platform.select({
    web: WEB_FONT_FAMILY,
    default: 'Inter_400Regular',
  }) as string,
  medium: Platform.select({
    web: WEB_FONT_FAMILY,
    default: 'Inter_500Medium',
  }) as string,
  semiBold: Platform.select({
    web: WEB_FONT_FAMILY,
    default: 'Inter_600SemiBold',
  }) as string,
  bold: Platform.select({
    web: WEB_FONT_FAMILY,
    default: 'Inter_700Bold',
  }) as string,
} as const;

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
} as const;

export const LineHeights = {
  xs: 15,
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
} as const;
