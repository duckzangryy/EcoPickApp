import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Controller } from 'react-hook-form';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Colors, Fonts } from '../../../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';
import { EVENT_TYPES } from '../constants';
import FieldError from './FieldError';

function LocationSyncEffect({
  paramsLocation,
  onChange,
  value,
}: {
  paramsLocation: string;
  onChange: (v: string) => void;
  value: string;
}) {
  React.useEffect(() => {
    if (paramsLocation && paramsLocation !== value) {
      onChange(paramsLocation);
    }
  }, [paramsLocation, onChange, value]);
  return null;
}

interface StepDetailsProps {
  control: any;
  errors: any;
  t: any;
  coverImage: string | null;
  pickCoverImage: () => void;
  eventType: string;
  setEventType: (t: string) => void;
  latitude: number;
  longitude: number;
  address: string;
  params: any;
}

const StepDetails = ({
  control,
  errors,
  t,
  coverImage,
  pickCoverImage,
  eventType,
  setEventType,
  latitude,
  longitude,
  address,
  params,
}: StepDetailsProps) => {
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const colors = getColors(theme);

  const openLocationPicker = () => {
    router.push({
      pathname: '/pick-location',
      params: {
        initialLat: latitude || 10.7769,
        initialLng: longitude || 106.7009,
        returnTo: 'events/create',
      },
    } as any);
  };

  const iconWrapBg = theme === 'dark' ? 'rgba(32,105,58,0.2)' : '#F0FDF4';

  return (
    <View style={s.stepBody}>
      {/* ─── Section: Event Name ─── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIconWrap, { backgroundColor: iconWrapBg }]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
          </View>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('createEvent.labels.title', { defaultValue: 'Event Name' })}</Text>
          <View style={s.requiredDot} />
        </View>
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }, errors.title && s.inputError]}>
                <TextInput
                  style={[s.input, { color: colors.textPrimary }]}
                  placeholder={t('createEvent.placeholders.title')}
                  placeholderTextColor={colors.textPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  returnKeyType="next"
                />
              </View>
              {errors.title && <FieldError message={t(errors.title.message as string)} />}
            </>
          )}
        />
      </View>

      {/* ─── Section: Event Type ─── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIconWrap, { backgroundColor: iconWrapBg }]}>
            <Ionicons name="pricetag" size={14} color={colors.primary} />
          </View>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('createEvent.labels.type', { defaultValue: 'Event Type' })}</Text>
        </View>
        <View style={s.typeWrap}>
          {EVENT_TYPES.map((type) => {
            const isSel = eventType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  s.typeChip,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSel && [s.typeChipSel, { borderColor: colors.primary, backgroundColor: theme === 'dark' ? 'rgba(32,105,58,0.2)' : '#F0FDF4' }],
                ]}
                onPress={() => setEventType(type.id)}
                activeOpacity={0.7}
              >
                <View style={[s.typeIco, { backgroundColor: theme === 'dark' ? colors.border : '#F1F5F9' }, isSel && [s.typeIcoSel, { backgroundColor: colors.primary }]]}>
                  <Ionicons name={type.icon as any} size={16} color={isSel ? '#fff' : colors.textSecondary} />
                </View>
                <Text style={[s.typeText, { color: colors.textSecondary }, isSel && [s.typeTextSel, { color: colors.primary }]]}>{t(type.label)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Section: Description ─── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIconWrap, { backgroundColor: iconWrapBg }]}>
            <Ionicons name="document-text" size={14} color={colors.primary} />
          </View>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
            {t('createEvent.labels.description', { defaultValue: 'Description' })}
          </Text>
        </View>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <View style={[s.textAreaWrap, { backgroundColor: colors.card, borderColor: colors.border }, errors.description && s.inputError]}>
                <TextInput
                  style={[s.textArea, { color: colors.textPrimary }]}
                  placeholder={t('createEvent.placeholders.description')}
                  placeholderTextColor={colors.textPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  textAlignVertical="top"
                />
              </View>
              <View style={s.fieldFooter}>
                {errors.description ? (
                  <FieldError message={errors.description.message as string} />
                ) : (
                  <View />
                )}
                <Text style={[s.charCount, { color: colors.textPlaceholder }]}>{(value || '').length}/500</Text>
              </View>
            </>
          )}
        />
      </View>

      {/* ─── Section: Location ─── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIconWrap, { backgroundColor: iconWrapBg }]}>
            <Ionicons name="location" size={14} color={colors.primary} />
          </View>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('createEvent.labels.location', { defaultValue: 'Location' })}</Text>
          <View style={s.requiredDot} />
        </View>
        <Controller
          control={control}
          name="location"
          render={({ field: { onChange, onBlur, value } }) => (
            <>
              <LocationSyncEffect paramsLocation={params.location} onChange={onChange} value={value} />
              <View style={[s.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }, errors.location && s.inputError]}>
                <TextInput
                  style={[s.input, { color: colors.textPrimary }]}
                  placeholder={t('createEvent.placeholders.location')}
                  placeholderTextColor={colors.textPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
                <TouchableOpacity style={[s.mapBtn, { backgroundColor: colors.primary }]} onPress={openLocationPicker} activeOpacity={0.7}>
                  <Ionicons name="map" size={14} color="#fff" />
                </TouchableOpacity>
              </View>

              {address ? (
                <View style={s.addressRow}>
                  <Ionicons name="navigate-outline" size={14} color={colors.primary} />
                  <Text style={[s.addressText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {address}
                  </Text>
                </View>
              ) : null}

              {errors.location && <FieldError message={t(errors.location.message as string)} />}
            </>
          )}
        />
      </View>

      {/* ─── Section: Cover Image ─── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIconWrap, { backgroundColor: iconWrapBg }]}>
            <Ionicons name="image" size={14} color={colors.primary} />
          </View>
          <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
            {t('createEvent.labels.coverImage')}
          </Text>
        </View>
        <TouchableOpacity style={[s.coverBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickCoverImage} activeOpacity={0.8}>
          {coverImage ? (
            <Image source={{ uri: coverImage }} style={s.coverImg} />
          ) : (
            <View style={s.coverEmpty}>
              <View style={[s.coverIconWrap, { backgroundColor: iconWrapBg }]}>
                <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
              </View>
              <Text style={[s.coverTitle, { color: colors.textPrimary }]}>{t('createEvent.placeholders.coverHint')}</Text>
              <Text style={[s.coverSubtext, { color: colors.textSecondary }]}>JPG, PNG — Max 5MB</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
export default StepDetails;
const s = StyleSheet.create({
  stepBody: {
    padding: 20,
    gap: 4,
  },

  // ─── Section ───
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  requiredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  optionalBadge: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: '#94A3B8',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },

  // ─── Input ───
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 14,
  },

  // ─── TextArea ───
  textAreaWrap: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  textArea: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  charCount: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#94A3B8',
  },

  // ─── Event Types ───
  typeWrap: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
  },
  typeChipSel: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  typeIco: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcoSel: {
    backgroundColor: Colors.primary,
  },
  typeText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#64748B',
  },
  typeTextSel: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },

  // ─── Location ───
  mapBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  addressText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },

  // ─── Cover Image ───
  coverBtn: {
    width: '100%',
    height: 160,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
    borderStyle: 'dashed',
    borderRadius: 16,
    overflow: 'hidden',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  coverIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverTitle: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    color: '#475569',
  },
  coverSubtext: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#94A3B8',
  },
});
