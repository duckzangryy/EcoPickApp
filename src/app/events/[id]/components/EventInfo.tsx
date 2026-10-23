
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '../../../../constants';
import { formatDate, formatEventType, formatTime } from '../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

interface EventInfoProps {
  event: any;
}

export default function EventInfo({ event }: EventInfoProps) {
  const { t } = useTranslation();
  const colors = getColors(useThemeStore((state) => state.theme));
  return (
    <View style={s.container}>
      {/* Type & Title */}
      <View style={s.titleBlock}>
        <View style={s.typeRow}>
          <Ionicons name="leaf-sharp" size={21} color={colors.primary} />
          <Text style={[s.typeText, { color: colors.primary } ]}>
            {formatEventType(event.type) || t('eventDetail.communityEvent')}
          </Text>
        </View>
        <Text style={[s.title, { color: colors.textPrimary } ]}>{event.title}</Text>
        <Text style={[s.description, { color: colors.textSecondary } ]}>
          {event.description || t('eventDetail.defaultDescription')}
        </Text>
        {event.address && (
          <View style={s.addressRow}>
            <Ionicons name="location-sharp" size={21} color='#ff0000' />
            <Text style={[s.addressText, { color: colors.textSecondary }]}>{event.address}</Text>
          </View>
        )}
      </View>

      {/* Date & Time Row */}
      <View style={s.dateTimeRow}>
        <View style={[s.dateTimeBox, { backgroundColor: colors.card, borderColor: colors.border } ]}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <View style={s.dateTimeTextWrap}>
            <Text style={[s.dateTimeLabel, { color: colors.textSecondary } ]}>{t('eventDetail.date')}</Text>
            <Text style={[s.dateTimeValue, { color: colors.textPrimary } ]} numberOfLines={1}>{formatDate(event.start_date)}</Text>
          </View>
        </View>
        <View style={[s.dateTimeBox, { backgroundColor: colors.card, borderColor: colors.border } ]}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <View style={s.dateTimeTextWrap}>
            <Text style={[s.dateTimeLabel, { color: colors.textSecondary } ]}>{t('eventDetail.time')}</Text>
            <Text style={[s.dateTimeValue, { color: colors.textPrimary } ]} numberOfLines={1}>{formatTime(event.start_date)}</Text>
          </View>
        </View>
      </View>

      {/* Info Cards */}
      <View style={s.infoCardsRow}>
        {event.difficulty && (
          <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border } ]}>
            <Ionicons name="speedometer-outline" size={18} color={colors.primary} />
            <Text style={[s.infoCardLabel, { color: colors.textSecondary } ]}>{t('eventDetail.difficulty', { defaultValue: 'Difficulty' })}</Text>
            <Text style={[s.infoCardValue, { color: colors.textPrimary } ]}>
              {event.difficulty.charAt(0).toUpperCase() + event.difficulty.slice(1)}
            </Text>
          </View>
        )}
        {event.eco_point_reward > 0 && (
          <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border } ]}>
            <Ionicons name="leaf-outline" size={18} color="#16A34A" />
            <Text style={[s.infoCardLabel, { color: colors.textSecondary } ]}>{t('eventDetail.ecoPoints', { defaultValue: 'Eco Points' })}</Text>
            <Text style={[s.infoCardValue, { color: '#16A34A' }]}>
              +{event.eco_point_reward}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 24,
  },
  titleBlock: { gap: 4 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeText: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
    color: '#20693A',
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  addressText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  dateTimeRow: { flexDirection: 'row', gap: 12 },
  dateTimeBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(32,105,58,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(32,105,58,0.1)',
    padding: 13,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateTimeLabel: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 16 },
  dateTimeTextWrap: { flex: 1, minWidth: 0 },
  dateTimeValue: { fontFamily: Fonts.bold, fontSize: 14, lineHeight: 20, flexShrink: 1 },
  infoCardsRow: { flexDirection: 'row', gap: 12 },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(32,105,58,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(32,105,58,0.1)',
    padding: 13,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  infoCardLabel: { fontFamily: Fonts.regular, fontSize: 11, lineHeight: 16 },
  infoCardValue: { fontFamily: Fonts.bold, fontSize: 16, lineHeight: 20 },
});
