import { useBadge, useUserBadges } from '@/hooks/useBadgeQueries';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Fonts, LineHeights, Spacing } from '../../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

// ─── Category config (same as list screen) ────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  event: { label: 'Sự kiện', icon: 'calendar', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  report: { label: 'Báo cáo', icon: 'flag', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  eco: { label: 'Sinh thái', icon: 'leaf', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  social: { label: 'Cộng đồng', icon: 'people', color: '#0891B2', bg: 'rgba(8,145,178,0.1)' },
  default: { label: 'Khác', icon: 'ribbon', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
};

function getCategoryMeta(category?: string) {
  if (!category) return CATEGORY_META.default;
  return CATEGORY_META[category] ?? CATEGORY_META.default;
}

// ─── How-to step conditions based on category ─────────────────────────────────
const CATEGORY_STEPS: Record<string, { icon: string; title: string; desc: string }[]> = {
  event: [
    { icon: 'search-outline', title: 'Tìm kiếm sự kiện', desc: 'Duyệt qua danh sách sự kiện môi trường gần bạn.' },
    { icon: 'person-add-outline', title: 'Đăng ký tham gia', desc: 'Nhấn "Tham gia" trên trang chi tiết sự kiện.' },
    { icon: 'checkmark-circle-outline', title: 'Hoàn thành sự kiện', desc: 'Tham gia đầy đủ và hoàn thành hoạt động.' },
    { icon: 'trophy-outline', title: 'Nhận huy hiệu', desc: 'Hệ thống tự động trao huy hiệu sau khi xác nhận.' },
  ],
  report: [
    { icon: 'camera-outline', title: 'Chụp ảnh rác thải', desc: 'Dùng tính năng báo cáo và chụp ảnh điểm ô nhiễm.' },
    { icon: 'location-outline', title: 'Xác nhận vị trí', desc: 'Đảm bảo GPS được bật để định vị chính xác.' },
    { icon: 'send-outline', title: 'Gửi báo cáo', desc: 'Điền đầy đủ thông tin và gửi báo cáo.' },
    { icon: 'trophy-outline', title: 'Nhận huy hiệu', desc: 'Báo cáo được duyệt → huy hiệu được trao.' },
  ],
  eco: [
    { icon: 'leaf-outline', title: 'Hành động xanh', desc: 'Thực hiện các hoạt động thân thiện với môi trường.' },
    { icon: 'repeat-outline', title: 'Duy trì thói quen', desc: 'Tiếp tục đóng góp liên tục để tích lũy điểm.' },
    { icon: 'star-outline', title: 'Đạt ngưỡng điểm', desc: 'Tích đủ eco points theo yêu cầu của huy hiệu.' },
    { icon: 'trophy-outline', title: 'Nhận huy hiệu', desc: 'Huy hiệu được mở khóa khi bạn đạt điều kiện.' },
  ],
  social: [
    { icon: 'people-outline', title: 'Xây dựng mạng lưới', desc: 'Kết nối và theo dõi các thành viên cộng đồng.' },
    { icon: 'share-social-outline', title: 'Chia sẻ hoạt động', desc: 'Chia sẻ tiến độ & khuyến khích người khác.' },
    { icon: 'heart-outline', title: 'Đóng góp cộng đồng', desc: 'Tham gia tích cực vào các thảo luận và sự kiện.' },
    { icon: 'trophy-outline', title: 'Nhận huy hiệu', desc: 'Đạt đủ điều kiện xã hội để mở khóa huy hiệu này.' },
  ],
  default: [
    { icon: 'information-circle-outline', title: 'Tìm hiểu điều kiện', desc: 'Đọc kỹ yêu cầu và mục tiêu của huy hiệu.' },
    { icon: 'trending-up-outline', title: 'Thực hiện hoạt động', desc: 'Hoàn thành các nhiệm vụ liên quan.' },
    { icon: 'checkmark-done-outline', title: 'Đạt tiêu chí', desc: 'Đảm bảo đáp ứng đủ các điều kiện cần thiết.' },
    { icon: 'trophy-outline', title: 'Nhận huy hiệu', desc: 'Hệ thống tự động cấp huy hiệu cho bạn.' },
  ],
};

function getSteps(category?: string) {
  if (!category) return CATEGORY_STEPS.default;
  return CATEGORY_STEPS[category] ?? CATEGORY_STEPS.default;
}

// ─── Step Item ─────────────────────────────────────────────────────────────────
function StepItem({
  step,
  index,
  isLast,
  color,
  colors,
}: {
  step: { icon: string; title: string; desc: string };
  index: number;
  isLast: boolean;
  color: string;
  colors: ReturnType<typeof getColors>;
}) {
  return (
    <View style={s.stepRow}>
      {/* Number + connector */}
      <View style={s.stepLeft}>
        <View style={[s.stepNum, { backgroundColor: color }]}>
          <Text style={s.stepNumText}>{index + 1}</Text>
        </View>
        {!isLast && <View style={[s.stepConnector, { backgroundColor: `${color}30` }]} />}
      </View>

      {/* Content */}
      <View style={[s.stepContent, !isLast && { marginBottom: Spacing.base }]}>
        <View style={[s.stepIconWrap, { backgroundColor: colors.primaryLight } ]}>
          <Ionicons name={step.icon as any} size={16} color={color} />
        </View>
        <View style={s.stepTextWrap}>
          <Text style={[s.stepTitle, { color: colors.textPrimary }]}>{step.title}</Text>
          <Text style={[s.stepDesc, { color: colors.textSecondary }]}>{step.desc}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function BadgeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const colors = getColors(theme);
  const userId = useAuthStore((s) => s.user?.id);

  const { data: badge, isLoading, isError } = useBadge(id!);
  const { data: allUserBadges = [] } = useUserBadges();

  const earnersCount = useMemo(
    () => allUserBadges.filter((ub) => ub.badge_id === id).length,
    [allUserBadges, id],
  );

  const isEarned = useMemo(
    () => allUserBadges.some((ub) => ub.badge_id === id && ub.user_id === userId),
    [allUserBadges, id, userId],
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
        <View style={s.simpleHeader}>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error / Not Found state ────────────────────────────────────────────────
  if (isError || !badge) {
    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
        <View style={s.simpleHeader}>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={s.loadingCenter}>
          <Ionicons name="cloud-offline-outline" size={52} color="#EF4444" />
          <Text style={s.errorText}>Không thể tải thông tin huy hiệu</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={16} color={Colors.white} />
            <Text style={s.retryBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const meta = getCategoryMeta(badge.category);
  const steps = getSteps(badge.category);

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />

      {/* ─── Header ─── */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]} >
        <TouchableOpacity style={s.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>Chi tiết huy hiệu</Text>
        <View style={s.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero Section ─── */}
        <View style={[s.heroBanner, { backgroundColor: colors.card, borderColor: colors.border }]} >
          {/* Badge icon */}
          <View style={[s.heroIconWrap, { backgroundColor: isEarned ? meta.bg : 'rgba(148,163,184,0.1)' }]}>
            {badge.icon_url ? (
              <Image
                source={{ uri: badge.icon_url }}
                style={[s.heroIcon, !isEarned && s.heroIconLocked]}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name={(meta.icon as any) || 'ribbon'}
                size={52}
                color={isEarned ? meta.color : '#CBD5E1'}
              />
            )}
            {/* Earned glow ring */}
            {isEarned && (
              <View style={[s.earnedRing, { borderColor: meta.color }]} />
            )}
          </View>

          {/* Status badge */}
          <View style={[
            s.statusPill,
            { backgroundColor: isEarned ? 'rgba(22,163,74,0.12)' : 'rgba(148,163,184,0.12)' },
          ]}>
            <Ionicons
              name={isEarned ? 'checkmark-circle' : 'lock-closed'}
              size={13}
              color={isEarned ? '#16A34A' : '#94A3B8'}
            />
            <Text style={[s.statusPillText, { color: isEarned ? '#16A34A' : '#94A3B8' }]}>
              {isEarned ? 'Đã đạt được' : 'Chưa mở khóa'}
            </Text>
          </View>

          <Text style={[s.heroName, { color: colors.textPrimary } ]}>{badge.name}</Text>
          <Text style={[s.heroDesc, { color: colors.textSecondary } ]}>{badge.description}</Text>

          {/* Category tag */}
          <View style={[s.categoryTag, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon as any} size={13} color={meta.color} />
            <Text style={[s.categoryTagText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* ─── Stats Row ─── */}
        <View style={[s.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]} >
          <View style={s.statCard}>
            <Ionicons name="people-outline" size={20} color={Colors.primary} />
            <Text style={[s.statValue, { color: colors.textPrimary }]}>{earnersCount}</Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Người nhận</Text>
          </View>

          <View style={[s.statDivider, { backgroundColor: colors.border }]} />

          <View style={s.statCard}>
            <Ionicons name={isEarned ? 'trophy' : 'trophy-outline'} size={20} color={isEarned ? '#D97706' : '#CBD5E1'} />
            <Text style={[s.statValue, { color: isEarned ? colors.textPrimary : colors.textPlaceholder }]}>
              {isEarned ? '✓' : '—'}
            </Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Của bạn</Text>
          </View>

          <View style={[s.statDivider, { backgroundColor: colors.border }]} />

          <View style={s.statCard}>
            <Ionicons name="pricetag-outline" size={20} color={meta.color} />
            <Text style={[s.statValue, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Danh mục</Text>
          </View>
        </View>

        {/* ─── How to earn ─── */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]} >
          <View style={s.cardHeader}>
            <Ionicons name="map-outline" size={18} color={Colors.primary} />
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Cách nhận huy hiệu</Text>
          </View>
          <Text style={[s.cardSubtitle, { color: colors.textSecondary } ]}>
            Thực hiện các bước sau để mở khóa huy hiệu này
          </Text>

          <View style={s.stepsWrap}>
            {steps.map((step, i) => (
              <StepItem
                key={i}
                step={step}
                index={i}
                isLast={i === steps.length - 1}
                color={meta.color}
                colors={colors}
              />
            ))}
          </View>
        </View>

        {/* ─── Tip card (if not earned) ─── */}
        {!isEarned && (
          <View style={[s.tipCard, theme === 'dark' && { backgroundColor: 'rgba(217,119,6,0.14)', borderColor: 'rgba(217,119,6,0.32)' }]} >
            <Ionicons name="bulb-outline" size={18} color="#D97706" />
            <Text style={[s.tipText, { color: theme === 'dark' ? '#FCD34D' : '#92400E' } ]}>
              Bạn chưa sở hữu huy hiệu này. Hãy bắt đầu ngay bằng cách tham gia các hoạt động liên quan!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  simpleHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
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
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  scrollContent: {
    paddingBottom: 40,
    gap: Spacing.base,
  },

  // Loading / error
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  errorText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.base,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  retryBtnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },

  // Hero Banner
  heroBanner: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
      },
      android: { elevation: 3 },
    }),
  },
  heroIconWrap: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  heroIcon: {
    width: 68,
    height: 68,
    borderRadius: 12,
  },
  heroIconLocked: {
    opacity: 0.3,
  },
  earnedRing: {
    position: 'absolute',
    inset: -3,
    borderRadius: BorderRadius.lg + 3,
    borderWidth: 2.5,
    width: '100%',
    height: '100%',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusPillText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  heroName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  heroDesc: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  categoryTagText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },

  // Stats row
  statsRow: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.primaryBorder,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Card (how to earn)
  card: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },

  // Steps
  stepsWrap: {
    marginTop: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stepLeft: {
    alignItems: 'center',
    width: 28,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    color: Colors.white,
  },
  stepConnector: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    marginTop: 4,
    minHeight: 24,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 0,
  },
  stepIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: -2,
  },
  stepTextWrap: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  stepDesc: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    color: Colors.textSecondary,
  },

  // Tip card
  tipCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: 'rgba(217,119,6,0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.2)',
  },
  tipText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    color: '#92400E',
    flex: 1,
  },
});
