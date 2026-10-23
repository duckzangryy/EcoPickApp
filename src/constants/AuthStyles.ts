import { Platform, StyleSheet } from 'react-native';
import { Fonts, FontSizes } from './Fonts';

// ─── Auth Design Tokens (from Figma) ────────────────────────────────────────
export const AuthColors = {
  bg: '#F8F9FA',
  cardBg: 'rgba(255,255,255,0.85)',
  cardBorder: 'rgba(255,255,255,0.2)',
  inputBg: '#F3F4F5',
  inputBgAlt: '#E7E8E9',

  textPrimary: '#191C1D',
  textSecondary: '#414942',
  textPlaceholder: '#94A3B8',
  textMuted: '#6B7280',

  brandDark: '#144227',
  brandGreen: '#2D5A3D',
  brandAccent: '#064E3B',
  brandTeal: '#16677A',

  borderLight: '#C1C9C0',
  borderCard: 'rgba(255,255,255,0.2)',

  white: '#FFFFFF',
  divider: 'rgba(193,201,192,0.3)',

  // Blurred background accents
  accentGreenBlur: 'rgba(20,66,39,0.05)',
  accentBlueBlur: 'rgba(162,231,253,0.2)',
} as const;

// ─── Shared Auth Styles ─────────────────────────────────────────────────────
export const authStyles = StyleSheet.create({
  // Backgrounds
  screenBg: {
    flex: 1,
    backgroundColor: AuthColors.bg,
  },
  bgAccentGreen: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 9999,
    backgroundColor: AuthColors.accentGreenBlur,
  },
  bgAccentBlue: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 9999,
    backgroundColor: AuthColors.accentBlueBlur,
  },

  // Glass card
  glassCard: {
    backgroundColor: AuthColors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AuthColors.borderCard,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(20,66,39,0.06)',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 1,
        shadowRadius: 50,
      },
      android: { elevation: 8 },
    }),
  },

  // Header bar
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    zIndex: 100,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    padding: 8,
    borderRadius: 9999,
    marginLeft: -8,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 28,
    color: AuthColors.brandAccent,
    letterSpacing: -0.45,
  },
  headerBrand: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 24,
    color: AuthColors.brandAccent,
  },

  // Form elements
  label: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.textPrimary,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  labelUppercase: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: AuthColors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: AuthColors.inputBg,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: AuthColors.textPrimary,
  },
  inputWithIcon: {
    paddingLeft: 44,
  },

  // Buttons
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AuthColors.brandDark,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(20,66,39,0.2)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 15,
      },
      android: { elevation: 8 },
    }),
  },
  primaryButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 28,
    color: AuthColors.white,
    textAlign: 'center',
  },
  socialButton: {
    backgroundColor: AuthColors.inputBg,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  socialButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: AuthColors.textPrimary,
  },
  socialIconButton: {
    backgroundColor: AuthColors.inputBgAlt,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AuthColors.divider,
  },
  dividerText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.textPlaceholder,
    paddingHorizontal: 16,
  },

  // Footer link row
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinkText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: AuthColors.textSecondary,
  },
  footerLinkBold: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 24,
    color: AuthColors.brandDark,
  },
});
