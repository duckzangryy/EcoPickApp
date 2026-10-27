
import { useEvent, useEventParticipants, useJoinEvent, useLeaveEvent } from '@/hooks/useEventQueries';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Colors, Fonts } from '../../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';
import { shareContent } from '../../../utils/share';
import EventChat from './components/EventChat';
import EventDetailSkeleton from './components/EventDetailSkeleton';
import EventEquipment from './components/EventEquipment';
import EventHero from './components/EventHero';
import EventInfo from './components/EventInfo';
import EventParticipants from './components/EventParticipants';
import { parseEquipment } from './constants';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const colors = getColors(theme);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  // API
  const { data: event, isLoading, isError } = useEvent(id!);
  const { data: participants = [] } = useEventParticipants(
    id ? { event: id } : undefined,
  );

  const joinMutation = useJoinEvent();
  const leaveMutation = useLeaveEvent();


  const [joined, setJoined] = useState(false);
  const userParticipant = participants.find(
    (p) => p.event === id && p.user === user?.id
  );

  React.useEffect(() => {
    setJoined(!!userParticipant);
  }, [userParticipant]);

  const handleJoinEvent = useCallback(async () => {
    if (!event || !user?.id) return;
    if (joined) {
      if (!userParticipant) return;
      try {
        Alert.alert(
          t('eventDetail.leaveEventWarning'),
          t('eventDetail.leaveEventConfirm'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('eventDetail.confirm'), onPress: async () => {
                const result = await leaveMutation.mutateAsync(userParticipant.id);
                setJoined(false);
                if (typeof result?.newTotal === 'number') {
                  updateUser({ eco_points: result.newTotal });
                }
                Toast.show({
                  type: 'success',
                  text1: t('eventDetail.leaveEvent'),
                });
              },
              style: 'destructive',
            }
          ]
        );
      } catch (error: any) {
        console.log('Error leaving event:', error?.response?.data || error);
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          text2: error?.response?.data?.detail ||
            t('eventDetail.leaveError'),
        });
      }
      return;
    }

    try {
      const result = await joinMutation.mutateAsync({
        event: id,
        user: user.id,
        status: 'joined',
      });
      setJoined(true);
      if (typeof result?.newTotal === 'number') {
        updateUser({ eco_points: result.newTotal });
      }
      Toast.show({
        type: 'success',
        text1: t('eventDetail.joinEvent'),
        text2: result?.pointsEarned ? `+${result.pointsEarned} điểm Eco` : undefined,
      });
    } catch (error: any) {
      console.log('Error creating event:', error?.response?.data || error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error?.response?.data?.detail ||
          t('eventDetail.joinError'),
      })
    }
  }, [event, user?.id, joined, userParticipant, joinMutation, leaveMutation, t, updateUser]);

  const handleOpenMaps = useCallback(() => {
    if (!event) return;
    const destLat = event.latitude || 37.7749;
    const destLng = event.longitude || -122.4194;
    const destTitle = event.title;

    router.push({
      pathname: '/(tabs)/map',
      params: { destLat: destLat.toString(), destLng: destLng.toString(), destTitle },
    });
  }, [event, router]);

  const handleShare = useCallback(async () => {
    if (!event) return;
    const res = await shareContent({
      type: 'event',
      title: event.title,
      description: event.description,
      coords: { latitude: event.latitude || 37.7749, longitude: event.longitude || -122.4194 },
      eventId: event.id,
    });
    if (!res.success && res.reason === 'error') {
      Toast.show({
        type: 'error',
        text1: t('share.errorTitle', { defaultValue: 'Share Failed' }),
        text2: t('share.errorMessage', { defaultValue: 'Could not share. Please try again.' }),
      });
    }
  }, [event, t]);

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
        <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]} >
          <TouchableOpacity style={s.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={s.headerBtn} />
        </View>
        <ScrollView
          style={s.scrollContainer}
          contentContainerStyle={s.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <EventDetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isError || !event) {
    return (
      <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />
        <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]} >
          <TouchableOpacity style={s.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={16} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: colors.textPrimary } ]}>{t('common.error', { defaultValue: 'Error' })}</Text>
          <View style={s.headerBtn} />
        </View>
        <View style={s.loadingContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#EF4444" />
          <Text style={[s.errorText, { color: colors.textSecondary }]}>
            {t('common.errorLoading', { defaultValue: 'Failed to load event details' })}
          </Text>
          <TouchableOpacity style={s.retryButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={16} color={Colors.white} />
            <Text style={s.retryButtonText}>{t('common.goBack', { defaultValue: 'Go Back' })}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const equipmentList = parseEquipment(event.equipment);
  const isEventEnded = event.status === 'completed' || event.status === 'cancelled';
  const joinedCount = participants.filter(
    (p) => (p.event === id || (p as any).event_id === id) && (p.status === 'joined' || !p.status)
  ).length;
  const participantCount = Math.max(
    joinedCount,
    Number(event.current_paticipants ?? (event as any).current_participants ?? 0)
  );

  return (
    <SafeAreaView style={[s.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]} >
        <TouchableOpacity style={s.headerBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={s.headerBtn} activeOpacity={0.7} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scrollContainer}
          contentContainerStyle={[s.contentContainer, { paddingBottom: 110 + Math.max(insets.bottom, 16) }]}
          showsVerticalScrollIndicator={false}
        >
          <EventHero event={event} onOpenMaps={handleOpenMaps} />

          <View style={s.detailsSection}>
            <EventInfo event={event} />
            <EventParticipants participantsCount={participantCount} eventID={id} />
            <EventEquipment equipmentList={equipmentList} />
            <EventChat />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Join Button */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + (Platform.OS === 'ios' ? 12 : 8), backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            s.mainJoinButton,
            joined && { backgroundColor: colors.borderMedium },
            isEventEnded && s.disabledButton,
          ]}
          onPress={handleJoinEvent}
          activeOpacity={0.8}
          disabled={isEventEnded || joinMutation.isPending || leaveMutation.isPending}
        >
          {joinMutation.isPending || leaveMutation.isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Ionicons
              name={
                isEventEnded
                  ? 'close-circle'
                  : joined
                    ? 'checkmark-circle'
                    : 'person-add-outline'
              }
              size={16.4}
              color={Colors.white}
            />
          )}
          <Text style={s.mainJoinButtonText}>
            {isEventEnded
              ? t('eventDetail.eventEnded')
              : joined
                ? t('eventDetail.joined')
                : t('eventDetail.letJoin')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    // paddingVertical: 12,
    backgroundColor: 'rgba(246,248,247,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(32,105,58,0.1)',
    zIndex: 10,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Fonts.bold, fontSize: 18, lineHeight: 28, color: '#0F172A', flex: 1, textAlign: 'center' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontFamily: Fonts.medium, fontSize: 16, color: '#EF4444', textAlign: 'center', paddingHorizontal: 32 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryButtonText: { fontFamily: Fonts.bold, fontSize: 14, color: Colors.white },
  scrollContainer: { flex: 1 },
  contentContainer: { paddingTop: 16, paddingBottom: 120, gap: 16 },
  detailsSection: { paddingHorizontal: 16, gap: 24 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#F6F8F7',
    paddingHorizontal: 16,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: 'rgba(32,105,58,0.1)',
  },
  mainJoinButton: { backgroundColor: '#20693A', paddingVertical: 16, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  joinedButton: { backgroundColor: '#0F172A' },
  disabledButton: { backgroundColor: '#94A3B8' },
  mainJoinButtonText: { fontFamily: Fonts.bold, fontSize: 16, lineHeight: 24, color: Colors.white, textAlign: 'center' },
});
