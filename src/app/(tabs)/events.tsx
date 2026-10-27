import { useLayout } from '@/hooks/use-layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  DeviceEventEmitter,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Event } from '../../api/services/eventService';
import { Colors, Fonts } from '../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useEvents } from '../../hooks/useEventQueries';
import { useAuthStore } from '../../stores/authStore';

const TAB_KEYS = ['upcoming', 'myEvents', 'past'] as const;

const AVATAR_IMAGES = [
  'https://i.pravatar.cc/100?u=a1',
  'https://i.pravatar.cc/100?u=b2',
  'https://i.pravatar.cc/100?u=c3',
];

/** Format API date string to display format */
function formatEventDate(dateStr: string): string {
  try {
    // Handle "DD/MM/YYYY HH:mm:ss" format from API
    if (dateStr.includes('/')) {
      const [datePart] = dateStr.split(' ');
      const [day, month, year] = datePart.split('/');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    // Handle ISO format
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatEventTime(dateStr: string): string {
  try {
    if (dateStr.includes('/')) {
      const parts = dateStr.split(' ');
      if (parts.length > 1) {
        const [h, m] = parts[1].split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
      }
    }
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

/** Default cover image when event has none */
const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop';

// ─── Skeleton Loader ───────────────────────────────────────────────────────────
function EventSkeleton() {
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [shimmer]);

  return (
    <View style={styles.eventCard}>
      {/* Image placeholder */}
      <Animated.View style={[skeletonStyles.image, { opacity: shimmer }]} />

      {/* Content area */}
      <View style={styles.eventContent}>
        <View style={styles.textContent}>
          {/* Title lines */}
          <Animated.View style={[skeletonStyles.line, { width: '80%', opacity: shimmer }]} />
          <Animated.View style={[skeletonStyles.line, { width: '55%', height: 12, opacity: shimmer }]} />
        </View>

        {/* Footer */}
        <View style={styles.eventFooter}>
          <View style={styles.avatarsSection}>
            <View style={styles.avatarsStack}>
              {[0, 1, 2].map((idx) => (
                <Animated.View
                  key={idx}
                  style={[skeletonStyles.avatar, { marginLeft: idx > 0 ? -8 : 0, opacity: shimmer }]}
                />
              ))}
            </View>
            <Animated.View style={[skeletonStyles.line, { width: 60, height: 10, marginLeft: 12, opacity: shimmer }]} />
          </View>
          <Animated.View style={[skeletonStyles.button, { opacity: shimmer }]} />
        </View>
      </View>
    </View>
  );
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const colors = getColors(theme);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tabPress_events', () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return () => sub.remove();
  }, []);

  // ── Fetch events from API ──
  const { data: apiEvents = [], isLoading, isRefetching, isError, refetch } = useEvents();

  const filteredEvents = useMemo(() => {
    let list = apiEvents;
    if (activeTab === 'upcoming') {
      list = apiEvents.filter((e) => e.status === 'upcoming' || e.status === 'ongoing');
    } else if (activeTab === 'myEvents') {
      list = apiEvents.filter((e) => e.organizer_id === user?.id);
    } else if (activeTab === 'past') {
      list = apiEvents.filter((e) => e.status === 'completed' || e.status === 'cancelled');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.address?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, apiEvents, user?.id, searchQuery]);

  const handleJoinEvent = useCallback(
    (event: Event) => {
      router.push(`/events/${event.id}`);
    },
    [router],
  );

  const handlePressCard = useCallback(
    (event: Event) => {
      router.push(`/events/${event.id}`);
    },
    [router],
  );

  const renderEvent = useCallback(
    ({ item }: { item: Event }) => (
      <Reanimated.View entering={FadeInDown.duration(280)}>
      <TouchableOpacity style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => handlePressCard(item)} activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.cover_image_url || DEFAULT_EVENT_IMAGE }}
            style={styles.eventImage}
            resizeMode="cover"
          />
          {item.organizer_id === user?.id && (
            <View style={styles.organizerBadge}>
              <Text style={styles.organizerText}>{t('common.organizer').toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.eventContent}>
          <View style={styles.textContent}>
            <Text style={[styles.eventTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.eventDateContainer}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={[styles.eventDateText, { color: colors.primary } ]}>
                {formatEventDate(item.start_date)} • {formatEventTime(item.start_date)}
              </Text>
            </View>
          </View>

          <View style={styles.eventFooterMargin}>
            <View style={styles.eventFooter}>
              <View style={styles.avatarsSection}>
                {(() => {
                  const count = Number(item.current_paticipants ?? (item as any).current_participants ?? 0);
                  if (count <= 0) {
                    return (
                      <>
                        <View style={[styles.emptyAvatarBadge, { backgroundColor: colors.primaryLight }]}>
                          <Ionicons name="people-outline" size={14} color={colors.primary} />
                        </View>
                        <Text style={[styles.othersText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {t('eventDetail.noParticipants', { defaultValue: 'Chưa có người tham gia' })}
                        </Text>
                      </>
                    );
                  }
                  const visibleAvatars = AVATAR_IMAGES.slice(0, Math.min(count, 3));
                  return (
                    <>
                      <View style={styles.avatarsStack}>
                        {visibleAvatars.map((uri, idx) => (
                          <View key={idx} style={[styles.avatar, { zIndex: 3 - idx, marginLeft: idx > 0 ? -6 : 0 }]}>
                            <Image source={{ uri }} style={styles.avatarImage} />
                          </View>
                        ))}
                      </View>
                      <Text style={[styles.othersText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {count <= 3
                          ? `${count} ${t('common.participants', { defaultValue: 'người tham gia' })}`
                          : `+${count - 3} ${t('common.others', { defaultValue: 'người khác' })}`}
                      </Text>
                    </>
                  );
                })()}
              </View>
              <TouchableOpacity style={[styles.joinButton, { backgroundColor: colors.primary }]} onPress={() => handleJoinEvent(item)} activeOpacity={0.8}>
                <Text style={styles.joinButtonText}>{t('events.join')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      </Reanimated.View>
    ),
    [handleJoinEvent, handlePressCard, user?.id, t, colors.card, colors.border],
  );
  const {bottomTabHeight} = useLayout();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 0), backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerInner}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('events.headerTitle')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.searchButton, isSearchVisible && { backgroundColor: colors.primaryLight }]}
              onPress={() => {
                setIsSearchVisible((v) => !v);
                if (isSearchVisible) setSearchQuery('');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name={isSearchVisible ? 'close' : 'search'} size={18} color={isSearchVisible ? colors.primary : colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/events/create')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.createBtnText}>Tạo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      {isSearchVisible && (
        <View style={styles.searchBarWrapper}>
          <View style={[styles.searchBarInner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Tìm sự kiện theo tên hoặc địa điểm..."
              placeholderTextColor={colors.textPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <View style={[styles.tabsContainer, { backgroundColor: colors.primaryLight }]}>
          {TAB_KEYS.map((tabKey) => (
            <TouchableOpacity
              key={tabKey}
              style={[styles.tab, activeTab === tabKey && [styles.activeTab, { backgroundColor: colors.card }]]}
              onPress={() => setActiveTab(tabKey)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tabKey && { color: colors.primary }]}>
                {t(`events.${tabKey}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Event List */}
      {isLoading ? (
        <View style={styles.listContent}>
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              <EventSkeleton />
              {i < 2 && <View style={{ height: 16 }} />}
            </React.Fragment>
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredEvents}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomTabHeight }]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.textPlaceholder} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{isError ? 'Không tải được sự kiện. Kéo xuống để thử lại.' : t('events.noEvents')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Header ───
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(32,105,58,0.1)',
  },
  headerInner: {
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 28,
    height: 36,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: '#0F172A',
    letterSpacing: -0.5,
    textAlign: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  createBtnText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: 13,
  },

  // ─── Search Bar ───
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
  },
  searchBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    height: '100%',
  },

  // ─── Tabs ───
  tabsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(32,105,58,0.06)',
    borderRadius: 14,
    padding: 4,
    height: 48,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748B',
  },
  activeTabText: {
    fontFamily: Fonts.bold,
    color: '#20693A',
  },

  // ─── Event List ───
  listContent: {
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
  },

  // ─── Event Card ───
  eventCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 4 },
      default: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  organizerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(32,105,58,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  organizerText: {
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  eventContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    gap: 14,
  },
  textContent: {
    gap: 8,
  },
  eventTitle: {
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  eventDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(32,105,58,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  eventDateText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    lineHeight: 18,
    color: '#20693A',
  },

  // ─── Footer ───
  eventFooterMargin: {
    paddingTop: 4,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarsSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 6,
    minWidth: 0,
  },
  avatarsStack: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.white,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  emptyAvatarBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  othersText: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
    flexShrink: 1,
  },
  joinButton: {
    backgroundColor: '#20693A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    flexShrink: 0,
    shadowColor: '#20693A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  joinButtonText: {
    color: Colors.white,
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  // ─── Empty State ───
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: '#94A3B8',
  },
});

// ─── Skeleton Styles ───
const skeletonStyles = StyleSheet.create({
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#E8ECF0',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  line: {
    height: 16,
    backgroundColor: '#E8ECF0',
    borderRadius: 8,
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 9999,
    backgroundColor: '#E8ECF0',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  button: {
    width: 80,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E8ECF0',
  },
});
