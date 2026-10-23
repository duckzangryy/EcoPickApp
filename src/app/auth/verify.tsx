import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import LanguageToggle from '../../components/LanguageToggle';
import { AuthColors, authStyles, Fonts } from '../../constants';
import { useVerifyEmail, useForgotPassword } from '@/hooks/useUserQueries';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || 'admin@ecopick.vn';
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const verifyEmail = useVerifyEmail();
  const forgotPassword = useForgotPassword();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [timer, setTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const handleChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    forgotPassword.mutate(
      { email },
      {
        onSuccess: (data: any) => {
          Toast.show({
            type: 'success',
            text1: t('auth.resendSuccess', 'Đã gửi lại mã OTP!'),
            text2: data?.otp ? `Mã thử nghiệm: ${data.otp}` : undefined,
          });
          setTimer(RESEND_SECONDS);
          setCanResend(false);
          setOtp(Array(OTP_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
        },
        onError: (err: any) => {
          Toast.show({
            type: 'error',
            text1: t('auth.resendFailed', 'Gửi lại mã thất bại'),
            text2: err?.message,
          });
        },
      }
    );
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;
    verifyEmail.mutate(
      { email, otp: code },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: t('auth.verifySuccess', 'Xác thực email thành công!'),
          });
          setTimeout(() => {
            router.push('/auth/complete-profile');
          }, 400);
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error?.message || err?.response?.data?.detail || err?.message || 'Mã xác thực không đúng';
          Toast.show({
            type: 'error',
            text1: t('auth.verifyFailed', 'Xác thực thất bại'),
            text2: msg,
          });
        },
      }
    );
  };

  const isComplete = otp.every((d) => d !== '');
  const isSubmitting = verifyEmail.isPending || forgotPassword.isPending;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background accents */}
      <View style={[authStyles.bgAccentGreen, { top: -60, right: -20, width: 200, height: 200 }]} />
      <View style={[authStyles.bgAccentBlue, { bottom: -40, left: -20, width: 160, height: 160 }]} />

      {/* Header */}
      <View style={[authStyles.headerBar, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <View style={authStyles.headerLeft}>
          <TouchableOpacity style={authStyles.headerBackBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={AuthColors.brandAccent} />
          </TouchableOpacity>
          <Text style={authStyles.headerTitle}>{t('auth.verification')}</Text>
        </View>
        <View style={authStyles.headerRight}>
          <LanguageToggle />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 64 + insets.top + 40 }]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Email illustration circle */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.illustrationArea}>
            <View style={styles.emailCircle}>
              <View style={styles.emailCircleInner}>
                <Ionicons name="mail-open-outline" size={40} color={AuthColors.brandDark} />
              </View>
            </View>
          </Animated.View>

          {/* Hero Text */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.heroText}>
            <Text style={styles.heroTitle}>{t('auth.verifyTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('auth.verifySubtitle')}</Text>
          </Animated.View>

          {/* OTP Card */}
          <Animated.View entering={FadeInDown.delay(350).duration(500)} style={[authStyles.glassCard, styles.otpCard]}>
            {/* OTP label */}
            <Text style={authStyles.labelUppercase}>{t('auth.enterCode')}</Text>

            {/* OTP Inputs */}
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => {
                    inputRefs.current[i] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    focusedIndex === i && styles.otpInputFocused,
                    digit !== '' && styles.otpInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleChange(text, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  onFocus={() => setFocusedIndex(i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Resend */}
            <View style={styles.resendRow}>
              {canResend ? (
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={styles.resendActive}>{t('auth.resendNow')}</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendTimer}>
                  {t('auth.resendIn')} <Text style={styles.resendTimerBold}>{formatTime(timer)}</Text>
                </Text>
              )}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              activeOpacity={isComplete && !isSubmitting ? 0.85 : 1}
              onPress={isComplete && !isSubmitting ? handleVerify : undefined}
              disabled={!isComplete || isSubmitting}
            >
              <LinearGradient
                colors={isComplete && !isSubmitting ? ['#144227', '#2D5A3D'] : ['#94A3B8', '#94A3B8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={authStyles.primaryButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={authStyles.primaryButtonText}>{t('auth.verify')}</Text>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Verify Later */}
          <Animated.View entering={FadeIn.delay(500).duration(400)} style={authStyles.footerLink}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/auth/complete-profile')}>
              <Text style={[authStyles.footerLinkBold, { color: AuthColors.brandTeal }]}>{t('auth.verifyLater')}</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Security badge */}
          <Animated.View entering={FadeIn.delay(600).duration(400)} style={styles.securityBadge}>
            <Ionicons name="shield-checkmark-outline" size={16} color={AuthColors.brandGreen} />
            <Text style={styles.securityText}>{t('auth.securityBadge')}</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuthColors.bg,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 28,
  },
  illustrationArea: {
    alignItems: 'center',
  },
  emailCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(20,66,39,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailCircleInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(20,66,39,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    gap: 8,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: AuthColors.brandDark,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: AuthColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  otpCard: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    gap: 24,
    borderRadius: 12,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: AuthColors.inputBg,
    textAlign: 'center',
    fontFamily: Fonts.bold,
    fontSize: 22,
    color: AuthColors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  otpInputFocused: {
    borderColor: AuthColors.brandDark,
    backgroundColor: AuthColors.white,
  },
  otpInputFilled: {
    backgroundColor: 'rgba(20,66,39,0.06)',
    borderColor: AuthColors.brandGreen,
  },
  resendRow: {
    alignItems: 'center',
  },
  resendTimer: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.textMuted,
  },
  resendTimerBold: {
    fontFamily: Fonts.bold,
    color: AuthColors.brandDark,
  },
  resendActive: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.brandTeal,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(20,66,39,0.04)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  securityText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: AuthColors.brandGreen,
  },
});
