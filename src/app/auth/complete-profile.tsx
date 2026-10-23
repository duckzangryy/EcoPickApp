import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
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
import { useUpdateUser } from '@/hooks/useUserQueries';
import { useAuthStore } from '@/stores/authStore';

const INTERESTS = [
  { id: 'beach', icon: 'water-outline' as const, label: 'Beach', labelKey: 'auth.interestBeach' as const },
  { id: 'park', icon: 'leaf-outline' as const, label: 'Park', labelKey: 'auth.interestPark' as const },
  { id: 'river', icon: 'fish-outline' as const, label: 'River', labelKey: 'auth.interestRiver' as const },
  { id: 'city', icon: 'business-outline' as const, label: 'City', labelKey: 'auth.interestCity' as const },
  { id: 'trail', icon: 'trail-sign-outline' as const, label: 'Trail', labelKey: 'auth.interestTrail' as const },
  { id: 'events', icon: 'people-outline' as const, label: 'Events', labelKey: 'auth.interestEvents' as const },
];

export default function CompleteProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [nearbyCleanups, setNearbyCleanups] = useState(true);
  const [ecoAchievements, setEcoAchievements] = useState(true);
  const updateUser = useUpdateUser();
  const authUser = useAuthStore((s) => s.user);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev,
    );
  };

  const handleComplete = () => {
    const payload = {
      username: username.trim() || undefined,
      address: location.trim() || undefined,
      bio: selectedInterests.length ? `Quan tâm: ${selectedInterests.join(', ')}` : undefined,
    };
    updateUser.mutate(
      {
        id: authUser?.id || 'me',
        payload,
      },
      {
        onSettled: () => {
          Toast.show({
            type: 'success',
            text1: t('auth.profileSetupSuccess', 'Hoàn tất cài đặt hồ sơ!'),
          });
          setTimeout(() => {
            router.replace('/(tabs)/map');
          }, 400);
        },
      }
    );
  };

  const progress = [username.length > 0, location.length > 0, selectedInterests.length >= 1].filter(Boolean).length;
  const progressPercent = (progress / 3) * 100;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background accents */}
      <View style={[authStyles.bgAccentGreen, { top: -80, left: -30, width: 220, height: 220 }]} />
      <View style={[authStyles.bgAccentBlue, { bottom: 100, right: -30, width: 180, height: 180 }]} />

      {/* Header */}
      <View style={[authStyles.headerBar, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <View style={authStyles.headerLeft}>
          <TouchableOpacity style={authStyles.headerBackBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={AuthColors.brandAccent} />
          </TouchableOpacity>
          <Text style={authStyles.headerTitle}>{t('auth.profileSetup')}</Text>
        </View>
        <View style={authStyles.headerRight}>
          <LanguageToggle />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 64 + insets.top + 24 }]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Bar */}
          <Animated.View entering={FadeIn.delay(100).duration(400)} style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress}/3 {t('auth.completed')}
            </Text>
          </Animated.View>

          {/* Hero */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.heroText}>
            <Text style={styles.heroTitle}>{t('auth.profileTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('auth.profileSubtitle')}</Text>
          </Animated.View>

          {/* Profile Card */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={[authStyles.glassCard, styles.profileCard]}
          >
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.7}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
                <View style={styles.avatarBadge}>
                  <Ionicons name="camera" size={14} color={AuthColors.white} />
                </View>
              </TouchableOpacity>
              <Text style={styles.avatarHint}>{t('auth.addPhoto')}</Text>
            </View>

            {/* Username */}
            <View>
              <Text style={authStyles.label}>{t('auth.username')}</Text>
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={[authStyles.input, authStyles.inputWithIcon]}
                  placeholder={t('auth.usernamePlaceholder')}
                  placeholderTextColor={AuthColors.textPlaceholder}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                />
                <View style={styles.inputIcon}>
                  <Text style={styles.atPrefix}>@</Text>
                </View>
              </View>
            </View>

            {/* Location */}
            <View>
              <Text style={authStyles.label}>{t('auth.primaryLocation')}</Text>
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={[authStyles.input, authStyles.inputWithIcon, { paddingRight: 48 }]}
                  placeholder={t('auth.locationPlaceholder')}
                  placeholderTextColor={AuthColors.textPlaceholder}
                  value={location}
                  onChangeText={setLocation}
                  autoComplete="postal-address"
                />
                <View style={styles.inputIcon}>
                  <Ionicons name="location-outline" size={18} color={AuthColors.textPlaceholder} />
                </View>
                <TouchableOpacity style={styles.detectButton} activeOpacity={0.7}>
                  <Ionicons name="navigate" size={16} color={AuthColors.brandTeal} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* Interests */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500)}
            style={[authStyles.glassCard, styles.interestsCard]}
          >
            <View style={styles.interestsHeader}>
              <Text style={authStyles.label}>{t('auth.cleanupInterests')}</Text>
              <Text style={styles.pickLabel}>{t('auth.pick3')}</Text>
            </View>
            <View style={styles.interestsGrid}>
              {INTERESTS.map((item) => {
                const isSelected = selectedInterests.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                    onPress={() => toggleInterest(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={item.icon} size={20} color={isSelected ? AuthColors.white : AuthColors.brandDark} />
                    <Text style={[styles.interestLabel, isSelected && styles.interestLabelSelected]}>
                      {t(item.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Notification Preferences */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(500)}
            style={[authStyles.glassCard, styles.notifCard]}
          >
            <Text style={[authStyles.label, { marginBottom: 0 }]}>{t('auth.notifications')}</Text>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>{t('auth.nearbyCleanups')}</Text>
                <Text style={styles.toggleDesc}>{t('auth.nearbyDesc')}</Text>
              </View>
              <Switch
                value={nearbyCleanups}
                onValueChange={setNearbyCleanups}
                trackColor={{ false: '#E5E7EB', true: 'rgba(20,66,39,0.3)' }}
                thumbColor={nearbyCleanups ? AuthColors.brandDark : '#FFFFFF'}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>{t('auth.ecoAchievements')}</Text>
                <Text style={styles.toggleDesc}>{t('auth.ecoAchievementsDesc')}</Text>
              </View>
              <Switch
                value={ecoAchievements}
                onValueChange={setEcoAchievements}
                trackColor={{ false: '#E5E7EB', true: 'rgba(20,66,39,0.3)' }}
                thumbColor={ecoAchievements ? AuthColors.brandDark : '#FFFFFF'}
              />
            </View>
          </Animated.View>

          {/* Start Cleaning CTA */}
          <Animated.View entering={FadeInDown.delay(600).duration(500)} style={styles.ctaSection}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleComplete}>
              <LinearGradient
                colors={['#144227', '#2D5A3D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={authStyles.primaryButton}
              >
                <Ionicons name="leaf" size={20} color="#FFFFFF" />
                <Text style={authStyles.primaryButtonText}>{t('auth.startCleaning')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Nature guidelines */}
            <View style={styles.guidelinesRow}>
              <Ionicons name="earth-outline" size={14} color={AuthColors.textMuted} />
              <Text style={styles.guidelinesText}>{t('auth.natureGuidelines')}</Text>
            </View>
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
    gap: 24,
  },
  progressContainer: {
    gap: 8,
    paddingHorizontal: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(20,66,39,0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: AuthColors.brandDark,
  },
  progressText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: AuthColors.textMuted,
  },
  heroText: {
    gap: 6,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: Fonts.bold,
    fontSize: 30,
    lineHeight: 36,
    color: AuthColors.brandDark,
    letterSpacing: -0.75,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: AuthColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  profileCard: {
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 28,
    gap: 22,
    borderRadius: 12,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: AuthColors.inputBg,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AuthColors.brandDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AuthColors.white,
  },
  avatarHint: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: AuthColors.brandTeal,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  atPrefix: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: AuthColors.textPlaceholder,
  },
  detectButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  interestsCard: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 16,
    borderRadius: 12,
  },
  interestsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: AuthColors.textMuted,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(20,66,39,0.06)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  interestChipSelected: {
    backgroundColor: AuthColors.brandDark,
    borderColor: AuthColors.brandDark,
  },
  interestLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.brandDark,
  },
  interestLabelSelected: {
    color: AuthColors.white,
  },
  notifCard: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 16,
    borderRadius: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  toggleInfo: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: AuthColors.textPrimary,
  },
  toggleDesc: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: AuthColors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: AuthColors.divider,
  },
  ctaSection: {
    gap: 16,
    marginTop: 4,
  },
  guidelinesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  guidelinesText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: AuthColors.textMuted,
    textAlign: 'center',
  },
});
