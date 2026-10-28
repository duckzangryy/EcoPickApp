import { useBadges, useExchangeItems, useRedeemExchangeItem, useUserBadges } from '@/hooks/useBadgeQueries';
import { useLeaderboard, useMyStreak, useUserInfo } from '@/hooks/useUserQueries';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  DeviceEventEmitter,
  Modal,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, FontSizes, Fonts, LineHeights, Spacing } from '../../constants';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

// ─── Category key → i18n key mapping ──────────────────────────────────────────
const CATEGORY_ICON: Record<string, string> = {
  event: 'calendar',
  report: 'flag',
  eco: 'leaf',
  social: 'people',
  default: 'ribbon',
};

const CATEGORY_COLOR: Record<string, { color: string; bg: string }> = {
  event: { color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  report: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
  eco: { color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  social: { color: '#0891B2', bg: 'rgba(8,145,178,0.1)' },
  default: { color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
};

function getCategoryStyle(category?: string) {
  if (!category) return CATEGORY_COLOR.default;
  return CATEGORY_COLOR[category] ?? CATEGORY_COLOR.default;
}

function getCategoryIcon(category?: string): string {
  if (!category) return CATEGORY_ICON.default;
  return CATEGORY_ICON[category] ?? CATEGORY_ICON.default;
}

// ─── Reward Image with Fallback ───────────────────────────────────────────────
function RewardItemImage({ uri, category }: { uri?: string; category?: string }) {
  const [hasError, setHasError] = React.useState(false);
  const fallbackIcon =
    category === 'beverage' ? 'water-outline' : category === 'food' ? 'cafe-outline' : 'gift-outline';

  if (!uri || hasError) {
    return (
      <View style={styles.rewardImageFallback}>
        <Ionicons name={fallbackIcon as any} size={34} color={Colors.primary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.rewardImage}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
}

// ─── Badge Card ────────────────────────────────────────────────────────────────
interface BadgeCardProps {
  badge: {
    id: string;
    name: string;
    description?: string;
    icon_url: string;
    category?: string;
  };
  earned: boolean;
  categoryLabel: string;
  onPress: () => void;
}

function BadgeCard({ badge, earned, categoryLabel, onPress }: BadgeCardProps) {
  const colors = getColors(useThemeStore((s) => s.theme));
  const style = getCategoryStyle(badge.category);
  const icon = getCategoryIcon(badge.category);

  return (
    <TouchableOpacity
      style={[styles.badgeCard, { backgroundColor: colors.card, borderColor: colors.border }, !earned && { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Badge icon */}
      <View style={[styles.badgeIconWrap, { backgroundColor: earned ? style.bg : 'rgba(194, 213, 240, 0.1)' }]}>
        {badge.icon_url ? (
          <Image
            source={{ uri: badge.icon_url }}
            style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name={(icon as any)}
            size={36}
            color={earned ? style.color : '#CBD5E1'}
          />
        )}
        {!earned && (
          <View style={styles.lockOverlay}>
            <Ionicons name="lock-closed" size={14} color="#94A3B8" />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.badgeInfo}>
        <View style={styles.badgeTopRow}>
          <Text style={[styles.badgeName, { color: colors.textPrimary }]} numberOfLines={1}>
            {badge.name}
          </Text>
          <View style={[styles.categoryPill, { backgroundColor: earned ? style.bg : 'rgba(148,163,184,0.08)' }]}>
            <Text style={[styles.categoryPillText, { color: earned ? style.color : '#94A3B8' }]}>
              {categoryLabel}
            </Text>
          </View>
        </View>
        <Text style={[styles.badgeDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {badge.description}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textPlaceholder} />
    </TouchableOpacity >
  );
}
// ─── Skeleton loader ───────────────────────────────────────────────────────────
function BadgeSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '70%', marginTop: 8 }]} />
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function BadgesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const colors = getColors(theme);
  const storeUser = useAuthStore((s) => s.user);
  const { data: apiUser, refetch: refetchUser } = useUserInfo();
  useFocusEffect(React.useCallback(() => { void refetchUser(); }, [refetchUser]));
  const user = apiUser ?? storeUser;
  const userId = user?.id;
  const scrollRef = React.useRef<ScrollView>(null);
  const { data: rewards = [], refetch: refetchRewards } = useExchangeItems();
  const redeemMutation = useRedeemExchangeItem();
  const [confirmReward, setConfirmReward] = React.useState<{ id: string; title: string; points_cost: number } | null>(null);
  const [successRedemption, setSuccessRedemption] = React.useState<import('@/api/services/badgeService').Redemption | null>(null);

  const redeemReward = async (id: string) => {
    try {
      const result = await redeemMutation.mutateAsync(id);
      setSuccessRedemption(result.redemption);
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error?.response?.data?.detail || error?.message || 'Vui lòng thử lại.';
      if (Platform.OS === 'web') window.alert(`Chưa đổi được quà: ${message}`);
      else Alert.alert('Chưa đổi được quà', message);
    }
  };

  const {
    data: allBadges = [],
    isLoading: loadingBadges,
    refetch: refetchBadges,
    isRefetching,
  } = useBadges();

  const { data: userBadges = [], isLoading: loadingUserBadges } = useUserBadges(
    userId ? { user_id: userId } : undefined,
  );

  const earnedBadgeIds = useMemo(
    () => new Set(userBadges.map((ub) => ub.badge_id)),
    [userBadges],
  );

  const earnedCount = earnedBadgeIds.size;
  const totalCount = allBadges.length;
  const progress = totalCount > 0 ? earnedCount / totalCount : 0;

  const sortedBadges = useMemo(() => {
    const earned = allBadges.filter((b) => earnedBadgeIds.has(b.id));
    const locked = allBadges.filter((b) => !earnedBadgeIds.has(b.id));
    return { earned, locked };
  }, [allBadges, earnedBadgeIds]);

  const isLoading = loadingBadges || loadingUserBadges;

  // ── Leaderboard + streak ──
  const [period, setPeriod] = React.useState<'weekly' | 'monthly' | 'all'>('weekly');
  const { data: leaderboard = [], isLoading: loadingBoard } = useLeaderboard(period);
  const { data: streak } = useMyStreak();
  const PERIODS: Array<{ key: 'weekly' | 'monthly' | 'all'; label: string }> = [
    { key: 'weekly', label: 'Tuần' },
    { key: 'monthly', label: 'Tháng' },
    { key: 'all', label: 'Tổng' },
  ];

  // Helper: get category label via i18n
  const getCategoryLabel = (category?: string): string => {
    const key = category && Object.keys(CATEGORY_COLOR).includes(category) ? category : 'default';
    return t(`badges.category.${key}` as any);
  };

  // ── Handle Tab Press ──
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tabPress_badges', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => sub.remove();
  }, []);
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* ─── Header ─── */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerInner}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('badges.title')}</Text>
          <View style={[styles.headerBadgeCount, { backgroundColor: colors.primaryLight } ]}>
            <Ionicons name="trophy" size={14} color={colors.primary} />
            <Text style={[styles.headerBadgeCountText, { color: colors.primary } ]}>
              {t('badges.headerCount', { earned: earnedCount, total: totalCount })}
            </Text>
          </View>
        </View>
      </View>

      <Modal visible={!!confirmReward} transparent animationType="fade" onRequestClose={() => setConfirmReward(null)}>
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.successTitle, { color: colors.textPrimary } ]}>Xác nhận đổi quà</Text>
            <Text style={[styles.rewardName, { color: colors.textPrimary }]}>{confirmReward?.title}</Text>
            <Text style={[styles.rewardSponsor, { color: colors.textSecondary }]}>Dùng {confirmReward?.points_cost} điểm Eco</Text>
            <TouchableOpacity
              style={styles.successButton}
              disabled={redeemMutation.isPending}
              onPress={() => {
                if (confirmReward) void redeemReward(confirmReward.id);
                setConfirmReward(null);
              }}
            >
              <Text style={styles.redeemButtonText}>{redeemMutation.isPending ? 'Đang đổi…' : 'Xác nhận đổi'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setConfirmReward(null)}>
              <Text style={styles.successHistoryLink}>Để sau</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={!!successRedemption} transparent animationType="fade" onRequestClose={() => setSuccessRedemption(null)}>
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <View style={styles.successIcon}><Ionicons name="checkmark" size={30} color="#FFFFFF" /></View>
            <Text style={[styles.successTitle, { color: colors.textPrimary } ]}>Đổi quà thành công!</Text>
            <Text style={[styles.rewardName, { color: colors.textPrimary }]}>{successRedemption?.item_title}</Text>
            <Text style={[styles.rewardSponsor, { color: colors.textSecondary }]}>Đã trừ {successRedemption?.points_spent} điểm{successRedemption?.sponsor ? ` · ${successRedemption.sponsor}` : ''}</Text>
            <Text style={styles.successCodeLabel}>Mã nhận quà</Text>
            <Text selectable style={styles.successCode}>{successRedemption?.code}</Text>
            <TouchableOpacity style={styles.successButton} onPress={() => setSuccessRedemption(null)}>
              <Text style={styles.redeemButtonText}>Đã hiểu</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSuccessRedemption(null); router.push('/redemptions' as any); }}>
              <Text style={styles.successHistoryLink}>Xem phần thưởng đã đổi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => { refetchBadges(); refetchRewards(); }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ─── Progress Banner ─── */}
        <View style={[styles.progressBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>{t('badges.progressTitle')}</Text>
              <Text style={[styles.progressSub, { color: colors.textSecondary }]}>
                {t('badges.progressSub', { count: earnedCount })}
              </Text>
            </View>
            <View style={[styles.progressCircle, { backgroundColor: colors.primaryLight, borderColor: colors.primaryBorder } ]}>
              <Text style={[styles.progressPercent, { color: colors.primary }]}>
                {totalCount > 0 ? Math.round(progress * 100) : 0}%
              </Text>
            </View>
          </View>

          <View style={[styles.progressBarTrack, { backgroundColor: colors.primaryBorder }]}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
          </View>

          <View style={styles.progressStats}>
            <View style={styles.progressStatItem}>
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={styles.progressStatText}>
                {earnedCount} {t('badges.earnedLabel')}
              </Text>
            </View>
            <View style={styles.progressStatItem}>
              <Ionicons name="lock-closed" size={14} color="#94A3B8" />
              <Text style={[styles.progressStatText, { color: '#94A3B8' }]}>
                {totalCount - earnedCount} {t('badges.lockedLabel')}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Streak + Leaderboard ─── */}
        <View style={[styles.progressBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={18} color="#F97316" />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Chuỗi hoạt động</Text>
          </View>
          <View style={styles.streakRow}>
            <View style={[styles.streakStat, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.streakStatValue, { color: colors.primary }]}>{streak?.streak ?? 0}</Text>
              <Text style={[styles.streakStatLabel, { color: colors.textSecondary }]}>ngày liên tiếp</Text>
            </View>
            <View style={[styles.streakStat, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.streakStatValue, { color: colors.primary }]}>{streak?.activeDays ?? 0}</Text>
              <Text style={[styles.streakStatLabel, { color: colors.textSecondary }]}>ngày tích điểm</Text>
            </View>
            <View style={[styles.streakStat, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.streakStatValue, { color: colors.primary }]}>{user?.eco_points || 0}</Text>
              <Text style={[styles.streakStatLabel, { color: colors.textSecondary }]}>điểm Eco</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Ionicons name="podium" size={17} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Bảng xếp hạng</Text>
          </View>
          <View style={styles.periodTabs}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodTab, { borderColor: colors.border }, period === p.key && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setPeriod(p.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.periodTabText, { color: colors.textSecondary }, period === p.key && { color: '#FFFFFF' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {loadingBoard ? (
            <Text style={[styles.rewardDesc, { color: colors.textSecondary }]}>Đang tải bảng xếp hạng…</Text>
          ) : leaderboard.length === 0 ? (
            <Text style={[styles.rewardDesc, { color: colors.textSecondary }]}>Chưa có dữ liệu xếp hạng cho kỳ này.</Text>
          ) : (
            leaderboard.slice(0, 10).map((entry, i) => {
              const medal = ['🥇', '🥈', '🥉'][i];
              const isMe = entry.id === userId;
              return (
                <View key={entry.id} style={[styles.leaderRow, { backgroundColor: colors.card, borderColor: colors.border }, isMe && { borderColor: colors.primary, borderWidth: 2 }]}>
                  <Text style={styles.leaderRank}>{medal || `${entry.rank}`}</Text>
                  {entry.avatarUrl ? (
                    <Image source={{ uri: entry.avatarUrl }} style={styles.leaderAvatar} />
                  ) : (
                    <View style={[styles.leaderAvatar, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontFamily: Fonts.bold, fontSize: 14, color: colors.primary }}>{(entry.fullName || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.leaderInfo}>
                    <Text style={[styles.leaderName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {entry.fullName || 'Người dùng EcoPick'}{isMe ? ' (Bạn)' : ''}
                    </Text>
                    <Text style={[styles.leaderPoints, { color: colors.textSecondary }]}>Cấp {entry.level ?? 1} · {entry.reportsCount ?? 0} báo cáo</Text>
                  </View>
                  <Text style={[styles.leaderScore, { color: colors.primary }]}>{entry.ecoPoints}</Text>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Ionicons name="gift" size={17} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Đổi quà từ nhà tài trợ</Text>
            <Text style={styles.balanceText}>{user?.eco_points || 0} điểm</Text>
          </View>
          {rewards.map((reward) => {
            const affordable = (user?.eco_points || 0) >= reward.points_cost;
            const inStock = reward.available_quantity === undefined || reward.available_quantity > 0;
            return (
              <Reanimated.View key={reward.id} entering={FadeInDown.duration(260)} style={[styles.rewardCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <RewardItemImage uri={reward.image_url} category={reward.category} />
                <View style={styles.rewardInfo}>
                  <Text style={[styles.rewardName, { color: colors.textPrimary }]}>{reward.title}</Text>
                  {!!reward.sponsor && (
                    <Text style={[styles.rewardSponsor, { color: colors.primary }]}>
                      Tài trợ bởi {reward.sponsor}
                    </Text>
                  )}
                  {!!reward.description && (
                    <Text style={[styles.rewardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {reward.description}
                    </Text>
                  )}
                  <View style={styles.rewardCostRow}>
                    <Text style={[styles.rewardCost, { color: theme === 'dark' ? '#FBBF24' : '#B45309' }]}>
                      {reward.points_cost} điểm
                    </Text>
                    {reward.available_quantity !== undefined && (
                      <Text style={[styles.rewardStockBadge, { color: colors.textSecondary }]}>
                        • Còn {reward.available_quantity}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      (!affordable || !inStock || redeemMutation.isPending) && styles.redeemButtonDisabled,
                    ]}
                    disabled={!affordable || !inStock || redeemMutation.isPending}
                    onPress={() => setConfirmReward({ id: reward.id, title: reward.title, points_cost: reward.points_cost })}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.redeemButtonText,
                        (!affordable || !inStock) && styles.redeemButtonTextDisabled,
                      ]}
                    >
                      {!inStock ? 'Hết quà' : affordable ? 'Đổi quà' : 'Chưa đủ điểm'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Reanimated.View>
            );
          })}
          {rewards.length === 0 && <Text style={[styles.rewardDesc, { color: colors.textSecondary }]}>Chưa có quà tặng. Hãy quay lại sau.</Text>}
        </View>

        {/* ─── Badge List ─── */}
        {isLoading ? (
          <View style={styles.sectionBlock}>
            {[...Array(6)].map((_, i) => (
              <BadgeSkeleton key={i} />
            ))}
          </View>
        ) : allBadges.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.background } ]}>
            <Ionicons name="trophy-outline" size={56} color="#CBD5E1" />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary } ]}>{t('badges.emptyTitle')}</Text>
            <Text style={[styles.emptyDesc, { color: colors.textPlaceholder } ]}>{t('badges.emptyDesc')}</Text>
          </View>
        ) : (
          <>
            {/* Earned section */}
            {sortedBadges.earned.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('badges.earnedSection')}</Text>
                  <View style={[styles.sectionCountPill, { backgroundColor: colors.primaryLight } ]}>
                    <Text style={[styles.sectionCountText, { color: colors.primary } ]}>{sortedBadges.earned.length}</Text>
                  </View>
                </View>
                {sortedBadges.earned.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    earned
                    categoryLabel={getCategoryLabel(badge.category)}
                    onPress={() => router.push(`/badges/${badge.id}`)}
                  />
                ))}
              </View>
            )}

            {/* Locked section */}
            {sortedBadges.locked.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="lock-closed" size={16} color="#565e69" />
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {t('badges.lockedSection')}
                  </Text>
                  <View style={[styles.sectionCountPill, { backgroundColor: 'rgba(148,163,184,0.12)' }]}>
                    <Text style={[styles.sectionCountText, { color: colors.textSecondary }]}>
                      {sortedBadges.locked.length}
                    </Text>
                  </View>
                </View>
                {sortedBadges.locked.map((badge) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    earned={false}
                    categoryLabel={getCategoryLabel(badge.category)}
                    onPress={() => router.push(`/badges/${badge.id}`)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBorder,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
    lineHeight: LineHeights.lg,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerBadgeCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  headerBadgeCountText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    color: Colors.primary,
  },
  scrollContent: {
    paddingBottom: 110,
    gap: Spacing.base,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
  },
  progressBanner: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
    }),
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  progressSub: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  progressPercent: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.primary,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(32,105,58,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  progressStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressStatText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: '#16A34A',
  },
  sectionBlock: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    color: Colors.textPrimary,
    flex: 1,
    letterSpacing: -0.4,
  },
  sectionCountPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sectionCountText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xs,
    color: Colors.primary,
  },
  balanceText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.primary },
  streakRow: { flexDirection: 'row', gap: 10 },
  streakStat: { flex: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 2 },
  streakStatValue: { fontFamily: Fonts.bold, fontSize: 20 },
  streakStatLabel: { fontFamily: Fonts.regular, fontSize: 11 },
  periodTabs: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  periodTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  periodTabText: { fontFamily: Fonts.semiBold, fontSize: 13 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, padding: 10 },
  leaderRank: { width: 26, textAlign: 'center', fontFamily: Fonts.bold, fontSize: 14, color: '#565e69' },
  leaderAvatar: { width: 36, height: 36, borderRadius: 18 },
  leaderInfo: { flex: 1, gap: 1 },
  leaderName: { fontFamily: Fonts.semiBold, fontSize: 14 },
  leaderPoints: { fontFamily: Fonts.regular, fontSize: 11 },
  leaderScore: { fontFamily: Fonts.bold, fontSize: 15 },
  successOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  successCard: { width: '100%', maxWidth: 380, backgroundColor: Colors.white, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 },
  successIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  successTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, color: Colors.textPrimary },
  successCodeLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 8 },
  successCode: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, color: Colors.primary, letterSpacing: 1.5 },
  successButton: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: Colors.primary, paddingVertical: 13, borderRadius: BorderRadius.full, marginTop: 10 },
  successHistoryLink: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, color: Colors.primary, paddingTop: 4 },
  rewardCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    padding: 14,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
    }),
  },
  rewardImage: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  rewardImageFallback: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: 'rgba(32,105,58,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(32,105,58,0.15)',
  },
  rewardInfo: { flex: 1, gap: 4, justifyContent: 'center' },
  rewardName: { fontFamily: Fonts.bold, fontSize: 16, lineHeight: 22, color: Colors.textPrimary },
  rewardSponsor: { fontFamily: Fonts.medium, fontSize: 12, color: Colors.primary },
  rewardDesc: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18, color: Colors.textSecondary },
  rewardCostRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  rewardCost: { fontFamily: Fonts.bold, fontSize: 14, color: '#D97706' },
  rewardStockBadge: { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textSecondary },
  redeemButton: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  redeemButtonDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  redeemButtonText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    color: Colors.white,
  },
  redeemButtonTextDisabled: {
    color: '#94A3B8',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
    }),
  },
  badgeCardLocked: {
    backgroundColor: '#FAFBFC',
    borderColor: Colors.border,
    opacity: 0.85,
  },
  badgeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  badgeIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  badgeIconLocked: {
    opacity: 0.35,
  },
  lockOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInfo: {
    flex: 1,
    gap: 5,
  },
  badgeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeName: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: Colors.textPrimary,
    flexShrink: 1,
    letterSpacing: -0.3,
  },
  badgeNameLocked: {
    color: Colors.textSecondary,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    flexShrink: 0,
  },
  categoryPillText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },
  badgeDesc: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skeletonIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    width: '85%',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
    letterSpacing: -0.4,
  },
  emptyDesc: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    color: Colors.textPlaceholder,
    textAlign: 'center',
  },
});
