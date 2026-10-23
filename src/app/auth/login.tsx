import { useForgotPassword, useSignIn } from '@/hooks/useUserQueries';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { useCommonStore } from '@/stores';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { ENV } from '@/config/env';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
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

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const { rememberedEmail, rememberedPassword, setRememberedCredentials, clearRememberedCredentials } = useCommonStore();
  const [rememberMe, setRememberMe] = useState(!!rememberedEmail);

  const signIn = useSignIn();
  const forgotPassword = useForgotPassword();
  const API_BASE_URL = ENV.API_BASE_URL;

  // ─── React Hook Form + Zod ────────────────────────────────
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedEmail || '',
      password: '',
    },
  });

  React.useEffect(() => {
    if (rememberedEmail) {
      setValue('email', rememberedEmail);
      setRememberMe(true);
    }
    setValue('password', '');
  }, [rememberedEmail, setValue]);

  // ─── Forgot Password handler ──────────────────────────────
  const handleForgotPassword = () => {
    const email = getValues('email')?.trim();
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng nhập Email',
        text2: 'Hãy điền email của bạn để nhận mã OTP khôi phục mật khẩu.',
      });
      return;
    }
    forgotPassword.mutate(
      { email },
      {
        onSuccess: (data: any) => {
          Toast.show({
            type: 'success',
            text1: 'Đã gửi mã xác nhận!',
            text2: data?.otp ? `Mã OTP: ${data.otp}` : 'Vui lòng kiểm tra hộp thư email.',
          });
          router.push({ pathname: '/auth/verify', params: { email } });
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.error?.message ||
            err?.response?.data?.detail ||
            err?.message ||
            'Không thể gửi mã xác nhận';
          Toast.show({
            type: 'error',
            text1: 'Lỗi gửi mã',
            text2: msg,
          });
        },
      }
    );
  };

  // ─── Submit handler ────────────────────────────────────────
  const onSubmit = (data: LoginFormData) => {
    // console.error('calling api: ', API_BASE_URL);
    signIn.mutate(
      { email: data.email.trim(), password: data.password },
      {
        onSuccess: (result) => {
          Toast.show({
            type: 'success',
            text1: t('auth.loginSuccess'),
            text2: t('auth.loginSuccessDesc'),
          });
          // Xử lý Remember Me (chỉ lưu email, không lưu mật khẩu)
          if (rememberMe) {
            setRememberedCredentials(data.email.trim(), undefined);
          } else {
            clearRememberedCredentials();
          }
          setTimeout(() => {
            router.replace('/(tabs)/map');
          }, 300);
        },
        onError: (error: any) => {
          const errorMsg =
            error?.response?.data?.error?.message ||
            error?.response?.data?.detail ||
            error?.response?.data?.error ||
            error?.message ||
            t('auth.loginFailed');
          console.log('LOGIN ERROR:', errorMsg);
          Toast.show({
            type: 'error',
            text1: t('auth.loginFailedTitle'),
            text2: errorMsg,
          });
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background accents */}
      <View style={[authStyles.bgAccentGreen, { top: -88, left: 28, width: 260, height: 260 }]} />
      <View style={[authStyles.bgAccentBlue, { bottom: -40, right: -40, width: 200, height: 200 }]} />

      {/* Header */}
      <View style={[authStyles.headerBar, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <View style={authStyles.headerLeft}>
          {/* <TouchableOpacity style={authStyles.headerBackBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={AuthColors.brandAccent} />
          </TouchableOpacity> */}
          <Text style={authStyles.headerTitle}>{t('auth.logIn')}</Text>
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
          {/* Hero Text */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroText}>
            <Text style={styles.heroTitle}>{t('auth.loginTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('auth.loginSubtitle')}</Text>
          </Animated.View>

          {/* Login Form Card */}
          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={[authStyles.glassCard, styles.formCard]}>
            <View style={styles.formFields}>
              {/* Email */}
              <View>
                <Text style={authStyles.label}>{t('auth.emailLabel')}</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={authStyles.inputWrapper}>
                      <TextInput
                        style={[authStyles.input, authStyles.inputWithIcon, errors.email && styles.inputError]}
                        placeholder={t('auth.emailPlaceholder')}
                        placeholderTextColor={AuthColors.textPlaceholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!signIn.isPending}
                      />
                      <View style={styles.inputIcon}>
                        <Ionicons
                          name="mail-outline"
                          size={18}
                          color={errors.email ? '#EF4444' : AuthColors.textPlaceholder}
                        />
                      </View>
                    </View>
                  )}
                />
                {errors.email && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.email.message}</Text>
                  </View>
                )}
              </View>

              {/* Password */}
              <View>
                <View style={styles.passwordHeader}>
                  <Text style={authStyles.label}>{t('auth.passwordLabel')}</Text>
                  <TouchableOpacity activeOpacity={0.7} onPress={handleForgotPassword} disabled={forgotPassword.isPending}>
                    <Text style={styles.forgotLink}>
                      {forgotPassword.isPending ? 'Đang gửi...' : t('auth.forgotPassword')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={authStyles.inputWrapper}>
                      <TextInput
                        style={[
                          authStyles.input,
                          authStyles.inputWithIcon,
                          { paddingRight: 48 },
                          errors.password && styles.inputError,
                        ]}
                        placeholder="••••••••"
                        placeholderTextColor={AuthColors.textPlaceholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showPassword}
                        autoComplete="password"
                        editable={!signIn.isPending}
                      />
                      <View style={styles.inputIcon}>
                        <Ionicons
                          name="lock-closed-outline"
                          size={18}
                          color={errors.password ? '#EF4444' : AuthColors.textPlaceholder}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowPassword(!showPassword)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={AuthColors.textPlaceholder}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.password && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  </View>
                )}
              </View>

              {/* Remember me */}
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
              // activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.rememberText}>{t('auth.rememberDevice')}</Text>
              </TouchableOpacity>

              {/* Submit */}
              <TouchableOpacity activeOpacity={0.85} onPress={handleSubmit(onSubmit)} disabled={signIn.isPending}>
                <LinearGradient
                  colors={signIn.isPending ? ['#94A3B8', '#94A3B8'] : ['#144227', '#2D5A3D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={authStyles.primaryButton}
                >
                  {signIn.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={authStyles.primaryButtonText}>{t('auth.logIn')}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={authStyles.dividerRow}>
              <View style={authStyles.dividerLine} />
              <Text style={authStyles.dividerText}>{t('auth.orContinueWith')}</Text>
              <View style={authStyles.dividerLine} />
            </View>

            {/* Social icons row */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={authStyles.socialIconButton} activeOpacity={0.7}>
                <Image
                  source={require('../../assets/auth/google.png')}
                  style={styles.socialSmallIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity style={authStyles.socialIconButton} activeOpacity={0.7}>
                <Ionicons name="logo-apple" size={20} color="#191C1D" />
              </TouchableOpacity>
              <TouchableOpacity style={authStyles.socialIconButton} activeOpacity={0.7}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeIn.delay(500).duration(400)} style={[authStyles.footerLink, { marginTop: 32 }]}>
            <Text style={authStyles.footerLinkText}>{t('auth.noAccount')} </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace('/auth/register')}>
              <Text style={authStyles.footerLinkBold}>{t('auth.signUp')}</Text>
            </TouchableOpacity>
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
    gap: 40,
  },
  heroText: {
    gap: 8,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 36,
    lineHeight: 40,
    color: AuthColors.brandDark,
    letterSpacing: -0.9,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 24,
    color: AuthColors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    paddingHorizontal: 33,
    paddingTop: 33,
    paddingBottom: 25,
    gap: 32,
    borderRadius: 12,
  },
  formFields: {
    gap: 20,
  },

  // ─── Input Error State ───
  inputError: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: '#EF4444',
  },

  // ─── Input Icons ───
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotLink: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: AuthColors.brandTeal,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: AuthColors.inputBg,
    borderWidth: 1,
    borderColor: AuthColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: AuthColors.brandDark,
    borderColor: AuthColors.brandDark,
  },
  rememberText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.textSecondary,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialSmallIcon: {
    width: 24,
    height: 24,
  },
});
