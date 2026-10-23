import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, FontSizes, LineHeights, Spacing } from '../../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}

export default function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  const colors = getColors(useThemeStore((state) => state.theme));
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderRow}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {description ? <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: Spacing.md,
    paddingLeft: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.base,
    lineHeight: LineHeights.base,
    color: '#0F172A',
  },
  sectionDesc: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    color: '#64748B',
    marginTop: 2,
    paddingLeft: 26,
  },
});
