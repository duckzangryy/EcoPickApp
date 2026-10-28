
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { Fonts, FontSizes, Spacing, getColors } from '../../../../constants';
import { useThemeStore } from '../../../../stores/themeStore';

interface LocationDescriptionProps {
  description?: string;
}

const LocationDescription = ({ description }: LocationDescriptionProps) => {
  const { t } = useTranslation();
  const colors = getColors(useThemeStore((s) => s.theme));

  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('location.description')}</Text>
      <Text style={[s.description, { color: colors.textSecondary }]}>
        {description ? description : t('location.noDescription')}
      </Text>
    </View>
  );
}
export default LocationDescription;
const s = StyleSheet.create({
  section: { paddingHorizontal: Spacing.base, marginBottom: 32 },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: 18, marginBottom: 16 },
  description: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
    lineHeight: 24,
  },
});
