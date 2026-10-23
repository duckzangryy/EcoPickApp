
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts } from '../../../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

interface EventParticipantsProps {
  participantsCount: number;
  eventID: string;
}

export default function EventParticipants({ participantsCount, eventID }: EventParticipantsProps) {
  const { t } = useTranslation()
  const colors = getColors(useThemeStore((state) => state.theme));

  return (
    <View style={s.participantsSection}>
      <View style={s.sectionHeader}>
        <View style={s.sectionTitleRow}>
          <Ionicons name="people-outline" size={24} color={colors.textPrimary} />
          <Text style={[s.sectionTitleText, { color: colors.textPrimary } ]}>
            {t('eventDetail.participants', { count: participantsCount })}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push({ pathname: `/events/participants`, params: { id: eventID } })}>
          <Text style={[s.viewAllText, { color: colors.primary }]}>{t('common.viewAll')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  participantsSection: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitleText: { fontFamily: Fonts.bold, fontSize: 16, lineHeight: 24 },
  viewAllText: { fontFamily: Fonts.bold, fontSize: 12, lineHeight: 16, textAlign: 'center' },
});
