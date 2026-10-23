import { useSignIn, useSignUp } from '@/hooks/useUserQueries';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const signUp = useSignUp();
  const signIn = useSignIn();

  const isPending = signUp.isPending || signIn.isPending;

  // ─── React Hook Form + Zod ────────────────────────────────
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullname: '',
      role: 'user',
    },
  });

  // ─── Submit: đăng ký → tự động đăng nhập ─────────────────
  const onSubmit = (data: RegisterFormData) => {
    signUp.mutate(
      {
        email: data.email.trim(),
        password: data.password,
        fullName: data.fullname?.trim() || data.email.split('@')[0],
        fullname: data.fullname?.trim() || data.email.split('@')[0],
        username: data.email.split('@')[0],
        role: data.role || 'user',
      },
      {
        onSuccess: () => {
          Toast.show({
            type: 'success',
            text1: t('auth.registerSuccess'),
            text2: t('auth.registerSuccessDesc'),
          });

          // Auto sign-in sau khi đăng ký thành công
          signIn.mutate(
            { email: data.email.trim(), password: data.password },
            {
              onSuccess: () => {
                setTimeout(() => {
                  router.replace('/(tabs)/map');
                }, 800);
              },
              onError: () => {
                // Nếu auto-login fail, chuyển về login page
                setTimeout(() => {
                  router.replace('/auth/login');
                }, 1000);
              },
            }
          );
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.error?.message ||
            error?.response?.data?.email?.[0] ||
            error?.response?.data?.detail ||
            error?.response?.data?.error ||
            error?.message ||
            t('auth.registerFailed');
          Toast.show({
            type: 'error',
            text1: t('auth.registerFailedTitle'),
            text2: message,
          });
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background accents */}
      <View style={[authStyles.bgAccentGreen, { top: -60, right: -20, width: 240, height: 240 }]} />
      <View style={[authStyles.bgAccentBlue, { bottom: -60, left: -30, width: 180, height: 180 }]} />

      {/* Header */}
      <View style={[authStyles.headerBar, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <View style={authStyles.headerLeft}>
          {/* <TouchableOpacity style={authStyles.headerBackBtn} onPress={() => router.dismissTo('/auth/login')} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={AuthColors.brandAccent} />
          </TouchableOpacity> */}
          <Text style={authStyles.headerTitle}>{t('auth.signUp')}</Text>
        </View>
        <View style={authStyles.headerRight}>
          <LanguageToggle />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 64 + insets.top + 28 }]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Text */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.heroText}>
            <Text style={styles.heroTitle}>{t('auth.registerTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('auth.registerSubtitle')}</Text>
          </Animated.View>

          {/* Register Form Card */}
          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={[authStyles.glassCard, styles.formCard]}>
            <View style={styles.formFields}>
              {/* Fullname (optional) */}
              <View>
                <Text style={authStyles.label}>{t('auth.fullnameLabel')}</Text>
                <Controller
                  control={control}
                  name="fullname"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={authStyles.inputWrapper}>
                      <TextInput
                        style={[
                          authStyles.input,
                          authStyles.inputWithIcon,
                          errors.fullname && styles.inputError,
                        ]}
                        placeholder={t('auth.fullnamePlaceholder')}
                        placeholderTextColor={AuthColors.textPlaceholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        autoCapitalize="words"
                        autoComplete="name"
                        editable={!isPending}
                      />
                      <View style={styles.inputIcon}>
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={errors.fullname ? '#EF4444' : AuthColors.textPlaceholder}
                        />
                      </View>
                    </View>
                  )}
                />
                {errors.fullname && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.fullname.message}</Text>
                  </View>
                )}
              </View>

              {/* Email */}
              <View>
                <Text style={authStyles.label}>{t('auth.emailLabel')}</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={authStyles.inputWrapper}>
                      <TextInput
                        style={[
                          authStyles.input,
                          authStyles.inputWithIcon,
                          errors.email && styles.inputError,
                        ]}
                        placeholder={t('auth.emailPlaceholder')}
                        placeholderTextColor={AuthColors.textPlaceholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!isPending}
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
                <Text style={authStyles.label}>{t('auth.passwordLabel')}</Text>
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
                        autoComplete="new-password"
                        editable={!isPending}
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

              {/* Confirm Password */}
              <View>
                <Text style={authStyles.label}>{t('auth.confirmPasswordLabel')}</Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={authStyles.inputWrapper}>
                      <TextInput
                        style={[
                          authStyles.input,
                          authStyles.inputWithIcon,
                          { paddingRight: 48 },
                          errors.confirmPassword && styles.inputError,
                        ]}
                        placeholder="••••••••"
                        placeholderTextColor={AuthColors.textPlaceholder}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        secureTextEntry={!showConfirm}
                        autoComplete="new-password"
                        editable={!isPending}
                      />
                      <View style={styles.inputIcon}>
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={18}
                          color={errors.confirmPassword ? '#EF4444' : AuthColors.textPlaceholder}
                        />
                      </View>
                      <TouchableOpacity
                        style={styles.eyeButton}
                        onPress={() => setShowConfirm(!showConfirm)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={AuthColors.textPlaceholder}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.confirmPassword && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                  </View>
                )}
              </View>

              {/* Submit */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSubmit(onSubmit)}
                disabled={isPending}
              >
                <LinearGradient
                  colors={isPending ? ['#94A3B8', '#94A3B8'] : ['#144227', '#2D5A3D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={authStyles.primaryButton}
                >
                  {isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={authStyles.primaryButtonText}>{t('auth.createAccount')}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Terms */}
            <View style={styles.termsRow}>
              <Text style={styles.termsText}>
                {t('auth.agreeTermsPrefix')}{' '}
                <Text style={styles.termsLink}>{t('auth.termsOfService')}</Text>
                {' '}{t('auth.and')}{' '}
                <Text style={styles.termsLink}>{t('auth.privacyPolicy')}</Text>
              </Text>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeIn.delay(500).duration(400)} style={[authStyles.footerLink, { marginTop: 24 }]}>
            <Text style={authStyles.footerLinkText}>{t('auth.alreadyHaveAccount')} </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.replace('/auth/login')}>
              <Text style={authStyles.footerLinkBold}>{t('auth.logIn')}</Text>
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
    gap: 32,
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
  },
  formCard: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 24,
    borderRadius: 12,
  },
  formFields: {
    gap: 16,
  },

  // ─── Error State ───
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

  // ─── Terms ───
  termsRow: {
    paddingHorizontal: 4,
  },
  termsText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: AuthColors.textSecondary,
    textAlign: 'center',
  },
  termsLink: {
    fontFamily: Fonts.semiBold,
    color: AuthColors.brandDark,
  },
});
