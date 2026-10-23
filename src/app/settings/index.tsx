import ConfirmModal from '@/components/ConfirmModal';
import { useSignOut } from '@/hooks/useUserQueries';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { BorderRadius, Colors, Fonts, FontSizes, LineHeights, Spacing } from '../../constants';
import { setLanguage } from '../../i18n';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

import SectionHeader from './components/SectionHeader';
import SettingNavRow from './components/SettingNavRow';
import SettingToggleRow from './components/SettingToggleRow';

const APP_VERSION = '1.0.0';

interface LanguageOption {
  code: string;
  flag: string;
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const colors = getColors(theme);

  // Toggle states
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [eventReminders, setEventReminders] = useState(true);
  const [reportUpdates, setReportUpdates] = useState(true);
  const [showReportMarkers, setShowReportMarkers] = useState(true);
  const [showEventMarkers, setShowEventMarkers] = useState(true);
  const [autoNavigate, setAutoNavigate] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [shareActivity, setShareActivity] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  // Modal states
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleLanguageChange = async (langCode: string) => {
    if (langCode !== currentLanguage) {
      await setLanguage(langCode);
    }
  };

  const signOut = useSignOut();

  const handleSignOut = () => setShowSignOutModal(true);

  const confirmSignOut = () => {
    signOut.mutate(undefined, {
      onSuccess: () => {
        setShowSignOutModal(false);
        Toast.show({
          type: 'success',
          text1: t('settings.signOutSuccess'),
          text2: t('settings.signOutSuccessDesc'),
        });
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* ─── Header ─── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }] }>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('settings.title')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>

        {/* ═══ Language Section ═══ */}
        <View style={styles.section}>
          <SectionHeader icon="contrast-outline" title="Giao diện" description="Tùy chỉnh chế độ hiển thị EcoPick" />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SettingToggleRow
              icon={theme === 'dark' ? 'moon-outline' : 'sunny-outline'}
              label={theme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng'}
              value={theme === 'dark'}
              onToggle={toggleTheme}
              isLast
            />
          </View>
        </View>
        <View style={styles.section}>
          <SectionHeader icon="language-outline" title={t('settings.language')} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {LANGUAGES.map((lang, index) => {
              const isSelected = currentLanguage === lang.code;
              const isLast = index === LANGUAGES.length - 1;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.languageRow, { backgroundColor: colors.card, borderBottomColor: colors.border }, !isLast && styles.settingRowBorder]}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.6}
                >
                  <View style={styles.languageLeft}>
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text style={[styles.languageLabel, { color: isSelected ? colors.primary : colors.textPrimary }]}>
                      {lang.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={14} color={Colors.white} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ═══ Notifications Section ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon="notifications-outline"
            title={t('settings.notifications')}
            description={t('settings.notificationsDesc')}
          />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border } ]}>
            <SettingToggleRow
              icon="push-outline"
              label={t('settings.pushNotifications')}
              value={pushNotifications}
              onToggle={setPushNotifications}
            />
            <SettingToggleRow
              icon="mail-outline"
              label={t('settings.emailNotifications')}
              value={emailNotifications}
              onToggle={setEmailNotifications}
            />
            <SettingToggleRow
              icon="alarm-outline"
              label={t('settings.eventReminders')}
              value={eventReminders}
              onToggle={setEventReminders}
            />
            <SettingToggleRow
              icon="document-text-outline"
              label={t('settings.reportUpdates')}
              value={reportUpdates}
              onToggle={setReportUpdates}
              isLast
            />
          </View>
        </View>

        {/* ═══ Map Preferences Section ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon="map-outline"
            title={t('settings.mapPreferences')}
            description={t('settings.mapPreferencesDesc')}
          />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border } ]}>
            <SettingToggleRow
              icon="flag-outline"
              label={t('settings.showReportMarkers')}
              value={showReportMarkers}
              onToggle={setShowReportMarkers}
            />
            <SettingToggleRow
              icon="calendar-outline"
              label={t('settings.showEventMarkers')}
              value={showEventMarkers}
              onToggle={setShowEventMarkers}
            />
            <SettingToggleRow
              icon="navigate-outline"
              label={t('settings.autoNavigate')}
              value={autoNavigate}
              onToggle={setAutoNavigate}
              isLast
            />
          </View>
        </View>

        {/* ═══ Privacy & Data Section ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon="shield-checkmark-outline"
            title={t('settings.privacy')}
            description={t('settings.privacyDesc')}
          />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border } ]}>
            <SettingToggleRow
              icon="location-outline"
              label={t('settings.shareLocation')}
              value={shareLocation}
              onToggle={setShareLocation}
            />
            <SettingToggleRow
              icon="pulse-outline"
              label={t('settings.shareActivity')}
              value={shareActivity}
              onToggle={setShareActivity}
            />
            <SettingToggleRow
              icon="analytics-outline"
              label={t('settings.analytics')}
              value={analytics}
              onToggle={setAnalytics}
              isLast
            />
          </View>
        </View>

        {/* ═══ Help & Support Section ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon="help-circle-outline"
            title={t('settings.helpSupport')}
            description={t('settings.helpSupportDesc')}
          />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border } ]}>
            <SettingNavRow
              icon="chatbubble-ellipses-outline"
              label={t('settings.faq')}
              onPress={() => { }}
            />
            <SettingNavRow
              icon="mail-open-outline"
              label={t('settings.contactUs')}
              onPress={() => { }}
            />
            <SettingNavRow
              icon="bug-outline"
              label={t('settings.reportBug')}
              onPress={() => { }}
            />
            <SettingNavRow
              icon="star-outline"
              label={t('settings.rateApp')}
              onPress={() => { }}
              isLast
            />
          </View>
        </View>

        {/* ═══ Account Section ═══ */}
        <View style={styles.section}>
          <SectionHeader
            icon="person-circle-outline"
            title={t('settings.account')}
            description={t('settings.accountDesc')}
          />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border } ]}>
            <SettingNavRow
              icon="create-outline"
              label={t('settings.editProfile')}
              onPress={() => { router.push('/profile/edit-profile') }}
            />
            <SettingNavRow
              icon="lock-closed-outline"
              label={t('settings.changePassword')}
              onPress={() => { }}
            />
            <SettingNavRow
              icon="log-out-outline"
              label={t('settings.signOut')}
              onPress={handleSignOut}
              isLast
              destructive
            />
          </View>

        </View>

        {/* ═══ About Section ═══ */}
        <View style={styles.section}>
          <SectionHeader icon="information-circle-outline" title={t('settings.about')} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border } ]}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>{t('settings.version')}</Text>
              <View style={styles.versionBadge}>
                <Text style={styles.versionText}>{APP_VERSION}</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* ─── Sign Out Confirmation ─── */}
      <ConfirmModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={confirmSignOut}
        title={t('settings.signOut')}
        message={t('settings.signOutConfirm')}
        confirmText={t('settings.signOut')}
        cancelText={t('common.cancel')}
        variant="danger"
        icon="log-out-outline"
        loading={signOut.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    // paddingVertical: Spacing.base,
    backgroundColor: 'rgba(246,248,247,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBorder,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
    lineHeight: LineHeights.lg,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerPlaceholder: {
    width: 40,
    height: 40,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
    // paddingBottom: 120,
    paddingHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    minHeight: 52,
  },
  settingRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.base,
    lineHeight: LineHeights.base,
    color: Colors.textPrimary,
  },
  languageLabelActive: {
    color: Colors.primary,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
  },
  aboutLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    color: Colors.textPrimary,
  },
  versionBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  versionText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    color: Colors.primary,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    marginTop: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructiveText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    color: '#EF4444',
  },
  dangerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    color: Colors.textPlaceholder,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  footerText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    color: Colors.textSecondary,
  },
});
