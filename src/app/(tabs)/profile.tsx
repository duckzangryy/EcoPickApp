import { useUserBadges } from '@/hooks';
import { useRedemptions } from '@/hooks/useBadgeQueries';
import { useLayout } from '@/hooks/use-layout';
import { useUpdateUser, useUserInfo } from '@/hooks/useUserQueries';
import { LOCAL_USER } from '@/api/services/userService';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  DeviceEventEmitter,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { BorderRadius, Colors, Fonts, FontSizes, Spacing } from '../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';
import { pickImage, type PickedImage } from '../../utils/pickImage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = 200;
const AVATAR_SIZE = 96;
const AVATAR_BORDER = 4;

const DEFAULT_AVATAR =
  'https://bizweb.dktcdn.net/100/324/808/files/san-pham-co-nguon-goc-thien-nhien.jpg?v=1702028320944';
const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80';

// ─── Animated Counter Component ───
function AnimatedCounter({ value, style }: { value: number; style?: any }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => animatedValue.removeListener(listener);
  }, [value]);

  return <Text style={style}>{displayValue.toLocaleString()}</Text>;
}

// ─── Skeleton Placeholder ───
function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: '#E2E8F0',
          opacity,
        },
        style,
      ]}
    />
  );
}

// ─── Profile Skeleton Loading ───
function ProfileSkeleton() {
  return (
    <View>
      <SkeletonBox width={SCREEN_WIDTH} height={BANNER_HEIGHT} borderRadius={0} />
      <View style={{ alignItems: 'center', marginTop: -(AVATAR_SIZE / 2) }}>
        <SkeletonBox width={AVATAR_SIZE} height={AVATAR_SIZE} borderRadius={AVATAR_SIZE / 2} />
      </View>
      <View style={{ alignItems: 'center', paddingTop: 16, gap: 8 }}>
        <SkeletonBox width={160} height={24} borderRadius={12} />
        <SkeletonBox width={120} height={16} borderRadius={8} />
        <SkeletonBox width={200} height={14} borderRadius={8} />
      </View>
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginTop: 24 }}>
        <SkeletonBox width={'100%' as any} height={90} borderRadius={20} style={{ flex: 1 }} />
        <SkeletonBox width={'100%' as any} height={90} borderRadius={20} style={{ flex: 1 }} />
      </View>
    </View>
  );
}


// ─── Stat Card Component ───
function StatCard({
  icon,
  iconColor,
  label,
  value,
  bgColor,
  colors,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: number;
  bgColor: string;
  colors: ReturnType<typeof getColors>;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border } ]}>
      <View style={[styles.statIconContainer, { backgroundColor: bgColor }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.statTextWrap}>
        <AnimatedCounter value={value} style={[styles.statValue, { color: colors.textPrimary }]} />
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Activity Item ───
function ActivityItem({ activity, colors }: { activity: any; colors: ReturnType<typeof getColors> }) {
  const iconMap: Record<string, { icon: string; color: string; bg: string }> = {
    report: { icon: 'flag', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
    event: { icon: 'calendar', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
    badge: { icon: 'trophy', color: '#EAB308', bg: 'rgba(234,179,8,0.1)' },
    tree: { icon: 'leaf', color: '#20693A', bg: 'rgba(32,105,58,0.1)' },
  };
  const config = iconMap[activity.type] || iconMap.report;

  return (
    <View style={[styles.activityItem, { backgroundColor: colors.card } ]}>
      <View style={[styles.activityIcon, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={18} color={config.color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>{activity.title}</Text>
        <Text style={[styles.activityTime, { color: colors.textSecondary }]}>{activity.time}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textPlaceholder} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PROFILE SCREEN
// ═══════════════════════════════════════════════════════════════
export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const {bottomTabHeight} = useLayout();
  const updateUserMutation = useUpdateUser();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = React.useRef<ScrollView>(null);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tabPress_profile', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => sub.remove();
  }, []);

  // Auth & user data
  const storeUser = useAuthStore((s) => s.user);
  const { data: apiUser, isLoading: isFetchingUser, isRefetching, refetch } = useUserInfo();
  const user = apiUser ?? storeUser ?? LOCAL_USER;

  const { data: userBadges } = useUserBadges({ user_id: user?.id, limit: 100 });
  const { data: redemptions = [] } = useRedemptions();

  // Avatar & Banner state
  const [pendingAvatar, setPendingAvatar] = useState<PickedImage | null>(null);
  const [pendingBanner, setPendingBanner] = useState<PickedImage | null>(null);

  // Mock activities (will be replaced with real API data)
  const mockActivities = [
    { id: '1', type: 'report', title: 'Reported waste at Central Park', time: '2 hours ago' },
    { id: '2', type: 'event', title: 'Joined Beach Cleanup Event', time: '1 day ago' },
    { id: '3', type: 'badge', title: 'Earned "First Report" badge', time: '3 days ago' },
    { id: '4', type: 'tree', title: 'Planted a tree at Community Garden', time: '1 week ago' },
  ];

  // ── Handlers ──
  const handleSelectAvatar = useCallback(async () => {
    const result = await pickImage({
      allowsMultipleSelection: false,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.success) {
      if (result.reason === 'permission_denied') {
        Toast.show({ type: 'error', text1: t('report.galleryPermissionRequired') });
      } else if (result.reason === 'error') {
        Toast.show({ type: 'error', text1: t('permissions.cameraError') });
      }
      return;
    }

    const picked = result.images[0];
    setPendingAvatar(picked);

    try {
      await updateUserMutation.mutateAsync({
        id: user?.id!,
        payload: { avatar: picked.file },
      });
      refetch();
      Toast.show({ type: 'success', text1: t('profile.avatarUpdated') });
    } catch {
      setPendingAvatar(null);
      Toast.show({ type: 'error', text1: t('common.error') });
    }
  }, [t, user?.id, refetch, updateUserMutation]);

  const handleSelectBanner = useCallback(async () => {
    const result = await pickImage({
      allowsMultipleSelection: false,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.success) {
      if (result.reason === 'permission_denied') {
        Toast.show({ type: 'error', text1: t('report.galleryPermissionRequired') });
      }
      return;
    }

    const picked = result.images[0];
    setPendingBanner(picked);
    Toast.show({ type: 'success', text1: t('profile.bannerUpdated') });
    // TODO: API call to update banner when backend supports it
  }, [t]);

  // ── Animated header opacity ──
  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT - 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Settings button: white on banner → primary when floating header visible
  const settingsBtnBg = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT - 80],
    outputRange: ['rgba(0,0,0,0.3)', 'rgba(32,105,58,0.1)'],
    extrapolate: 'clamp',
  });
  const settingsIconColor = scrollY.interpolate({
    inputRange: [0, BANNER_HEIGHT - 80],
    outputRange: ['#FFFFFF', Colors.primary],
    extrapolate: 'clamp',
  });

  // ── Loading state ──
  if (isFetchingUser && !user) {
    return (
      <View style={styles.safeArea}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
        <ProfileSkeleton />
      </View>
    );
  }

  const avatarUri = pendingAvatar?.uri || user?.avatar || DEFAULT_AVATAR;
  const bannerUri = pendingBanner?.uri || DEFAULT_BANNER;
  const displayName = user?.fullname || user?.email?.split('@')[0] || 'User';

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />

      {/* ─── Floating Header (appears on scroll) ─── */}
      <Animated.View
        style={[
          styles.floatingHeader,
          {
            paddingTop: insets.top,
            opacity: headerBgOpacity,
            backgroundColor: colors.background,
          },
        ]}
      >
        <View style={styles.floatingHeaderInner}>
          <Text style={[styles.floatingHeaderTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      </Animated.View>

      {/* ─── Top Action Buttons (always visible) ─── */}
      <View style={[styles.topActions, { top: insets.top }]}>
        <View style={styles.topActionSpacer} />
        <View style={styles.topActionsRight}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/settings')}>
            <Animated.View style={[styles.topActionBtn, { backgroundColor: settingsBtnBg }]}>
              <Animated.Text style={{ color: settingsIconColor }}>
                <Ionicons name="settings-outline" size={20} />
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.white}
            colors={[Colors.primary]}
            progressViewOffset={BANNER_HEIGHT}
          />
        }
      >
        {/* ═══════════════════════════════════════════════════ */}
        {/* BANNER SECTION                                     */}
        {/* ═══════════════════════════════════════════════════ */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleSelectBanner} style={styles.bannerContainer}>
          <Image source={{ uri: bannerUri }} style={styles.bannerImage} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.bannerGradient} />
        </TouchableOpacity>

        {/* ═══════════════════════════════════════════════════ */}
        {/* AVATAR + USER INFO                                 */}
        {/* ═══════════════════════════════════════════════════ */}
        <View style={[styles.profileInfoSection, { backgroundColor: colors.card } ]}>
          {/* Avatar floating over banner */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity style={styles.avatarWrapper} activeOpacity={0.8} onPress={handleSelectAvatar}>
              <View style={[styles.avatarBorder, { backgroundColor: colors.card, borderColor: colors.card }]} >
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              </View>
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={12} color={Colors.white} />
              </View>
            </TouchableOpacity>

            {/* Edit Profile Button */}
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: colors.card }]}
              activeOpacity={0.7}
              onPress={() => router.push('/profile/edit-profile')}
            >
              <Ionicons name="create-outline" size={16} color={Colors.primary} />
              <Text style={styles.editProfileBtnText}>{t('profile.editProfile')}</Text>
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{displayName}</Text>
              {user?.is_verified && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
            </View>
            <View style={styles.userMetaRow}>
              <Text style={[styles.userHandle, { color: colors.textSecondary }]}>{user?.email}</Text>
              <View style={styles.metaItem}>
                <Ionicons name="leaf" size={14} color={Colors.primary} />
                <Text style={[styles.metaText, { color: Colors.primary }]}>{t('profile.level', { level: user?.level ?? 1 })}</Text>
              </View>
              {user?.address && (
                <View style={styles.metaItem}>
                  <Ionicons name="location" size={14} color={Colors.primary} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {user.address}
                  </Text>
                </View>
              )}
            </View>

            {user?.bio ? (
              <Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={3}>
                {user.bio}
              </Text>
            ) : null}


          </View>

          {/* ─── Social Stats Bar ─── */}
          <View style={[styles.socialStatsBar, { borderTopColor: colors.border } ]}>
            <TouchableOpacity style={styles.socialStatItem} activeOpacity={0.6}>
              <Text style={[styles.socialStatValue, { color: colors.textPrimary }]}>{user?.followers_count ?? 0}</Text>
              <Text style={[styles.socialStatLabel, { color: colors.textSecondary }]}>{t('profile.followers')}</Text>
            </TouchableOpacity>
            <View style={[styles.socialStatDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.socialStatItem} activeOpacity={0.6}>
              <Text style={[styles.socialStatValue, { color: colors.textPrimary }]}>{user?.following_count ?? 0}</Text>
              <Text style={[styles.socialStatLabel, { color: colors.textSecondary }]}>{t('profile.following')}</Text>
            </TouchableOpacity>
            <View style={[styles.socialStatDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.socialStatItem} activeOpacity={0.6}>
              <Text style={[styles.socialStatValue, { color: colors.textPrimary }]}>{user?.total_trees ?? 0}</Text>
              <Text style={[styles.socialStatLabel, { color: colors.textSecondary }]}>{t('profile.trees')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════════════════════════════════════════════ */}
        {/* STATS GRID                                         */}
        {/* ═══════════════════════════════════════════════════ */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.background } ]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('profile.impactStats')}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                icon="flag-outline"
                iconColor={theme === 'dark' ? '#75D79A' : '#16A34A'}
                label={t('profile.reports')}
                value={user?.total_reports ?? 0}
                bgColor={colors.primaryLight}
                colors={colors}
              />
              <StatCard
                icon="calendar-outline"
                iconColor="#FB923C"
                label={t('profile.events')}
                value={user?.total_events ?? 0}
                bgColor={theme === 'dark' ? 'rgba(251,146,60,0.18)' : 'rgba(249,115,22,0.1)'}
                colors={colors}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                icon="leaf-outline"
                iconColor={colors.primary}
                label={t('profile.trees')}
                value={user?.total_trees ?? 0}
                bgColor={colors.primaryLight}
                colors={colors}
              />
              <StatCard
                icon="star-outline"
                iconColor={theme === 'dark' ? '#FDE047' : '#CA8A04'}
                label={t('profile.ecoPoints')}
                value={user?.eco_points ?? 0}
                bgColor={theme === 'dark' ? 'rgba(250,204,21,0.18)' : 'rgba(234,179,8,0.1)'}
                colors={colors}
              />
            </View>
          </View>
        </View>

        <View style={[styles.sectionContainer, { backgroundColor: colors.background } ]}>
          <TouchableOpacity style={[styles.rewardsEntry, { backgroundColor: colors.card, borderColor: colors.border } ]} activeOpacity={0.75} onPress={() => router.push('/redemptions' as any)}>
            <View style={styles.rewardsEntryIcon}><Ionicons name="gift" size={21} color={Colors.primary} /></View>
            <View style={styles.rewardsEntryText}>
              <Text style={[styles.rewardsEntryTitle, { color: colors.textPrimary }]}>Phần thưởng đã đổi</Text>
              <Text style={[styles.rewardsEntrySubtitle, { color: colors.textSecondary }]}>{redemptions.length} phần thưởng · Xem mã QR</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════ */}
        {/* USER ACTIVITY MAP PREVIEW                          */}
        {/* ═══════════════════════════════════════════════════ */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.background } ]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('profile.myActivityMap')}</Text>
            <TouchableOpacity activeOpacity={0.6} onPress={() => router.push('/(tabs)/map')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>{t('profile.viewOnMap')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.mapPreviewCard}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/map')}
          >
            <View style={styles.mapPreviewPlaceholder}>
              <Ionicons name="map-outline" size={40} color={Colors.primary} />
              <Text style={styles.mapPreviewText}>
                {(user?.total_reports ?? 0) > 0
                  ? t('profile.reportsOnMap', { count: user?.total_reports })
                  : t('profile.noReportsYet')}
              </Text>
            </View>
            <View style={styles.mapPreviewOverlay}>
              <View style={styles.mapPreviewBtn}>
                <Ionicons name="navigate-outline" size={16} color={Colors.white} />
                <Text style={styles.mapPreviewBtnText}>{t('profile.openMap')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════════════════ */}
        {/* ACTIVITY FEED                                      */}
        {/* ═══════════════════════════════════════════════════ */}
        <View style={[styles.sectionContainer, { backgroundColor: colors.background } ]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('profile.recentActivity')}</Text>
          </View>
          <View style={[styles.activityCard, { backgroundColor: colors.card } ]}>
            {mockActivities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ActivityItem activity={activity} colors={colors} />
                {index < mockActivities.length - 1 && <View style={styles.activityDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ─── Bottom Spacer ─── */}
        <View style={{ height: 120 }} />
      </Animated.ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Floating Header ───
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBorder,
  },
  floatingHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
  },
  floatingHeaderTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },

  // ─── Top Actions (over banner) ───
  topActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 101,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },
  topActionSpacer: {
    width: 40,
  },
  topActionsRight: {
    flexDirection: 'row',
    gap: 8,
  },
  topActionBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },

  scrollContent: {
    paddingBottom: 0,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },

  // ─── Banner ───
  bannerContainer: {
    width: '100%',
    height: BANNER_HEIGHT,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT * 0.6,
  },
  bannerEditHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Profile Info Section ───
  profileInfoSection: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    marginTop: -24,
    paddingBottom: Spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },

  // ─── Avatar ───
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base + 4,
    marginTop: -(AVATAR_SIZE / 2),
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBorder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: AVATAR_BORDER,
    borderColor: Colors.white,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Edit Profile Button ───
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    marginBottom: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  editProfileBtnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },

  // ─── User Info ───
  userInfo: {
    paddingHorizontal: Spacing.base + 4,
    paddingTop: 16,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  userHandle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  userBio: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    lineHeight: 22,
    color: '#475569',
    marginTop: 8,
  },
  userMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },

  // ─── Social Stats Bar ───
  socialStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.base + 4,
    marginTop: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  socialStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  socialStatValue: {
    fontFamily: Fonts.bold,
    fontSize: 22,
    lineHeight: 26,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  socialStatLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  socialStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },

  // ─── Section Common ───
  sectionContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
  },
  rewardsEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
    }),
  },
  rewardsEntryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rewardsEntryText: { flex: 1, gap: 2 },
  rewardsEntryTitle: { fontFamily: Fonts.bold, fontSize: 16, color: Colors.textPrimary },
  rewardsEntrySubtitle: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  viewAllText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },

  // ─── Stats Grid ───
  statsGrid: {
    gap: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
      },
    }),
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTextWrap: {
    gap: 2,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },

  // ─── Badges ───
  badgesScrollContent: {
    paddingRight: Spacing.base,
    gap: 12,
  },
  badgeItem: {
    width: 80,
    alignItems: 'center',
    gap: 8,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  badgeTextLocked: {
    color: Colors.textPlaceholder,
  },
  emptyBadgesCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  emptyBadgesText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // ─── Map Preview ───
  mapPreviewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  mapPreviewPlaceholder: {
    height: 140,
    backgroundColor: 'rgba(32,105,58,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapPreviewText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  mapPreviewOverlay: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  mapPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
  },
  mapPreviewBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    color: Colors.white,
  },

  // ─── Activity Feed ───
  activityCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  activityTime: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  activityDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
});
