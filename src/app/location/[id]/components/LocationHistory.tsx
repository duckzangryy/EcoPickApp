
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, getColors } from '../../../../constants';
import { useThemeStore } from '../../../../stores/themeStore';

interface LocationHistoryProps {
  reporter: string | null
}

const LocationHistory = ({ reporter }: LocationHistoryProps) => {
  const { t } = useTranslation();
  const colors = getColors(useThemeStore((s) => s.theme));

  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('location.statusHistory')}</Text>
      <View style={s.timeline}>
        <View style={s.timelineLine} />

        <View style={s.timelineItem}>
          <View style={[s.timelineIconWrapper, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={16} color={Colors.white} />
          </View>
          <View style={s.timelineContent}>
            <Text style={[s.timelineTitle, { color: colors.textPrimary }]}>{t('location.reported')}</Text>
            <Text style={[s.timelineDesc, { color: colors.textSecondary }]}>{t('location.reportedDesc', { reporter })}</Text>
          </View>
        </View>

        <View style={s.timelineItem}>
          <View style={[s.timelineIconWrapper, { backgroundColor: colors.border }]}>
            <Ionicons name="eye-outline" size={16} color={Colors.textSecondary} />
          </View>
          <View style={s.timelineContent}>
            <Text style={[s.timelineTitle, { color: colors.textPrimary }]}>{t('location.underReview')}</Text>
            <Text style={[s.timelineDesc, { color: colors.textSecondary }]}>{t('location.underReviewDesc')}</Text>
          </View>
        </View>

        <View style={s.timelineItem}>
          <View style={[s.timelineIconWrapper, { backgroundColor: colors.border }]}>
            <Ionicons name="leaf-outline" size={16} color={Colors.textSecondary} />
          </View>
          <View style={s.timelineContent}>
            <Text style={[s.timelineTitle, { color: colors.textPrimary }]}>{t('location.cleaned')}</Text>
            <Text style={[s.timelineDesc, { color: colors.textSecondary }]}>{t('location.cleanedDesc')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default LocationHistory;
const s = StyleSheet.create({
  section: { paddingHorizontal: Spacing.base, marginBottom: 32 },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: 18, marginBottom: 16 },
  timeline: { paddingLeft: 12, position: 'relative' },
  timelineLine: { position: 'absolute', top: 20, bottom: 20, left: 27, width: 2 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 24, gap: 16 },
  timelineIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineContent: { flex: 1, paddingTop: 4 },
  timelineTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: 2 },
  timelineDesc: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
});
