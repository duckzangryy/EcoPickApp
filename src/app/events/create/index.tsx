import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCreateEvent } from '@/hooks/useEventQueries';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { getColors } from '@/constants/Colors';
import { formatDateTime } from '@/utils/formatDatetime';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';
import { Colors, Fonts } from '../../../constants';
import StepDetails from './components/StepDetails';
import StepSchedule from './components/StepSchedule';
import StepSettings from './components/StepSettings';
import { CreateEventFormData, createEventSchema, STEPS } from './constants';

export default function CreateEventScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useThemeStore((st) => st.theme);
  const colors = getColors(theme);
  const user = useAuthStore((st) => st.user);
  const createEvent = useCreateEvent();
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{
    location?: string;
    address?: string;
    latitude?: string;
    longitude?: string;
  }>();

  // ── React Hook Form ──
  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      location: params.location || '',
      maxParticipants: 30,
      ecoPointReward: 50,
    },
    mode: 'onBlur',
  });

  // ── Non-zod state ──
  const [eventType, setEventType] = useState('cleanup');
  const [difficulty, setDifficulty] = useState('easy');
  const [address, setAddress] = useState(params.address || '');
  const [latitude, setLatitude] = useState(params.latitude ? parseFloat(params.latitude) : 0);
  const [longitude, setLongitude] = useState(params.longitude ? parseFloat(params.longitude) : 0);

  useEffect(() => {
    if (params.address) setAddress(params.address);
    if (params.latitude) setLatitude(parseFloat(params.latitude));
    if (params.longitude) setLongitude(parseFloat(params.longitude));
  }, [params.address, params.latitude, params.longitude]);

  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(
    new Set(['Gloves', 'Trash bags']),
  );
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
    return d;
  });

  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(12, 0, 0, 0);
    return d;
  });

  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // ── Animated progress ──
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: activeStep / (STEPS.length - 1),
      useNativeDriver: false,
      damping: 18,
      stiffness: 200,
    }).start();
  }, [activeStep, progressAnim]);

  // ── Keyboard padding ──
  const keyboardPadding = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) =>
        Animated.spring(keyboardPadding, {
          toValue: e.endCoordinates.height,
          useNativeDriver: false,
        }).start(),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () =>
        Animated.spring(keyboardPadding, {
          toValue: 0,
          useNativeDriver: false,
        }).start(),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardPadding]);

  // ── Handlers ──
  const toggleEquipment = useCallback((item: string) => {
    setSelectedEquipment((prev) => {
      const n = new Set(prev);
      if (n.has(item)) n.delete(item);
      else n.add(item);
      return n;
    });
  }, []);

  const pickCoverImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('common.error'), 'Photo library permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const goNext = async () => {
    if (activeStep === 0) {
      const valid = await trigger(['title', 'location']);
      if (!valid) return;
    }
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const onSubmit = async (data: CreateEventFormData) => {
    if (!user?.id) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('createEvent.loginRequired'),
      })
      return;
    }
    if (endDate <= startDate) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('createEvent.validation.endDateAfterStart'),
      })
      return;
    }

    try {
      let coverImagePayload: any = undefined;
      if (coverImage) {
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          coverImage,
          [],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        if (manipulatedImage.uri) {
          const uriParts = manipulatedImage.uri.split('.');
          const fileExt = uriParts[uriParts.length - 1]?.toLowerCase() || 'jpg';
          const mimeType = fileExt === 'jpg' || fileExt === 'jpeg' ? 'image/jpeg'
            : fileExt === 'png' ? 'image/png'
              : 'image/jpeg'; // fallback

          coverImagePayload = {
            uri: manipulatedImage.uri,
            name: `event_${Date.now()}.${fileExt}`,
            type: mimeType,
          };
        }
      }

      const event = await createEvent.mutateAsync({
        organizer_id: user.id,
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        type: eventType,
        start_date: formatDateTime(startDate),
        end_date: formatDateTime(endDate),
        latitude,
        longitude,
        location: data.location.trim(),
        address: address.trim() || undefined,
        max_paticipants: data.maxParticipants || undefined,
        equipment: Array.from(selectedEquipment).join(',') || undefined,
        difficulty,
        eco_point_reward: data.ecoPointReward || 0,
        cover_image_url: coverImagePayload,
        status: 'upcoming',
      });
      router.replace(`/events/${event.id}`);
    } catch (error: any) {
      console.log('Error creating event:', error?.response?.data || error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error?.response?.data?.detail || t('createEvent.createError'),
      })
    }
  };

  const onDatePickerChange = (type: string) => (_: any, date?: Date) => {
    if (!date) return;

    if (type === 'startDate') {
      const u = new Date(startDate);
      u.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setStartDate(u);
      if (u >= endDate) {
        const e = new Date(u);
        e.setHours(u.getHours() + 3);
        setEndDate(e);
      }
    } else if (type === 'startTime') {
      const u = new Date(startDate);
      u.setHours(date.getHours(), date.getMinutes());
      setStartDate(u);
    } else if (type === 'endDate') {
      const u = new Date(endDate);
      u.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setEndDate(u);
    } else {
      const u = new Date(endDate);
      u.setHours(date.getHours(), date.getMinutes());
      setEndDate(u);
    }
  };

  const diffMs = Math.max(0, endDate.getTime() - startDate.getTime());
  const totalMins = Math.round(diffMs / 60000);
  const durationDays = Math.floor(totalMins / 1440);
  const durationHrs = Math.floor((totalMins % 1440) / 60);
  const durationMins = totalMins % 60;

  const currentStep = STEPS[activeStep];
  const isLastStep = activeStep === STEPS.length - 1;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} />

      {/* ─── Header ─── */}
      <SafeAreaView edges={['top']} style={[s.headerArea, { backgroundColor: colors.card }]}>
        <View style={s.header}>
          <TouchableOpacity
            style={[s.closeBtn, { backgroundColor: theme === 'dark' ? colors.border : '#F1F5F9' }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={[s.headerTitle, { color: colors.textPrimary }]}>{t('createEvent.title')}</Text>
            <Text style={[s.headerSubtitle, { color: colors.textSecondary }]}>
              {t('createEvent.step', { defaultValue: 'Step' })} {activeStep + 1}{' '}
              {t('createEvent.of', { defaultValue: 'of' })} {STEPS.length} —{' '}
              {t(currentStep.labelKey as any)}
            </Text>
          </View>
          <View style={s.headerRight} />
        </View>

        {/* Progress bar */}
        <View style={[s.progressTrack, { backgroundColor: colors.borderMedium }]}>
          <Animated.View style={[s.progressFill, { width: progressWidth, backgroundColor: colors.primary }]} />
        </View>

        {/* Step pills */}
        <View style={s.stepper}>
          {STEPS.map((step, idx) => {
            const done = idx < activeStep;
            const active = idx === activeStep;
            return (
              <TouchableOpacity
                key={step.key}
                style={[
                  s.stepPill,
                  { backgroundColor: theme === 'dark' ? colors.card : '#F8FAFC', borderColor: colors.border },
                  active && [s.stepPillActive, { backgroundColor: theme === 'dark' ? 'rgba(32,105,58,0.2)' : '#F0FDF4', borderColor: colors.primary }],
                  done && [s.stepPillDone, { backgroundColor: theme === 'dark' ? colors.card : '#fff', borderColor: theme === 'dark' ? colors.primary : '#DCFCE7' }],
                ]}
                onPress={() => idx < activeStep && setActiveStep(idx)}
                activeOpacity={idx < activeStep ? 0.7 : 1}
              >
                {done ? (
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                ) : (
                  <Ionicons
                    name={step.icon as any}
                    size={14}
                    color={active ? colors.primary : colors.textPlaceholder}
                  />
                )}
                <Text
                  style={[
                    s.stepPillText,
                    { color: colors.textSecondary },
                    active && [s.stepPillTextActive, { color: colors.primary }],
                    done && [s.stepPillTextDone, { color: colors.primary }],
                  ]}
                >
                  {t(step.labelKey as any)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* ─── Content ─── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={s.scroll}
          contentContainerStyle={s.scrollInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {activeStep === 0 && (
            <StepDetails
              control={control}
              errors={errors}
              t={t}
              coverImage={coverImage}
              pickCoverImage={pickCoverImage}
              eventType={eventType}
              setEventType={setEventType}
              latitude={latitude}
              longitude={longitude}
              address={address}
              params={params}
            />
          )}
          {activeStep === 1 && (
            <StepSchedule
              t={t}
              startDate={startDate}
              endDate={endDate}
              showPicker={showPicker}
              setShowPicker={setShowPicker}
              onDatePickerChange={onDatePickerChange}
              durationDays={durationDays}
              durationHrs={durationHrs}
              durationMins={durationMins}
            />
          )}
          {activeStep === 2 && (
            <StepSettings
              t={t}
              control={control}
              errors={errors}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              selectedEquipment={selectedEquipment}
              toggleEquipment={toggleEquipment}
            />
          )}
          <Animated.View style={{ height: keyboardPadding }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Bottom Bar ─── */}
      <SafeAreaView edges={['bottom']} style={[s.bottomArea, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View style={s.bottomBar}>
          {activeStep > 0 ? (
            <TouchableOpacity
              style={s.backBtn}
              onPress={() => {
                setActiveStep((p) => p - 1);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
              <Text style={[s.backBtnText, { color: colors.textSecondary }]}>{t('common.back')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.backPlaceholder} />
          )}

          {!isLastStep ? (
            <TouchableOpacity style={[s.nextBtn, { backgroundColor: colors.primary }]} onPress={goNext} activeOpacity={0.8}>
              <Text style={s.nextBtnText}>{t('common.next')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.publishBtn, { backgroundColor: colors.primary }, createEvent.isPending && { opacity: 0.7 }]}
              onPress={handleSubmit(onSubmit as any)}
              activeOpacity={0.8}
              disabled={createEvent.isPending}
            >
              {createEvent.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="rocket-outline" size={16} color="#fff" />
              )}
              <Text style={s.publishBtnText}>
                {createEvent.isPending ? t('createEvent.creating') : t('createEvent.publish')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F6F8F7',
  },

  // ─── Header ───
  headerArea: {
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: '#0F172A',
    lineHeight: 24,
  },
  headerSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1,
  },
  headerRight: {
    width: 40,
  },

  // ─── Progress Bar ───
  progressTrack: {
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // ─── Step Pills ───
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepPillActive: {
    backgroundColor: '#F0FDF4',
    borderColor: Colors.primary,
  },
  stepPillDone: {
    backgroundColor: '#fff',
    borderColor: '#DCFCE7',
  },
  stepPillText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#94A3B8',
  },
  stepPillTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  stepPillTextDone: {
    color: Colors.primary,
  },

  // ─── Content ───
  scroll: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 24,
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
  },

  // ─── Bottom Bar ───
  bottomArea: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 768,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 6,
    minWidth: 80,
  },
  backBtnText: {
    fontFamily: Fonts.semiBold,
    fontSize: 15,
    color: '#475569',
  },
  backPlaceholder: {
    minWidth: 80,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  dotDone: {
    backgroundColor: '#BBF7D0',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 80,
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#fff',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    // backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    minWidth: 80,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  publishBtnText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#fff',
  },
});
