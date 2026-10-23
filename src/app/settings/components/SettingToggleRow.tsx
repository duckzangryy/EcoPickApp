import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts, FontSizes, LineHeights, BorderRadius, Spacing } from '../../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

interface SettingToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  isLast?: boolean;
}

export default function SettingToggleRow({ icon, iconColor, iconBg, label, value, onToggle, isLast }: SettingToggleRowProps) {
  const colors = getColors(useThemeStore((state) => state.theme));
  return (
    <View style={[styles.settingRow, !isLast && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={styles.settingRowLeft}>
        <View style={[styles.settingIconBox, { backgroundColor: iconBg || colors.primaryLight }]}>
          <Ionicons name={icon} size={16} color={iconColor || colors.primary} />
        </View>
        <Text style={[styles.settingRowLabel, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.borderMedium, true: colors.primaryLight }}
        thumbColor={value ? colors.primary : colors.textPlaceholder}
        ios_backgroundColor={colors.borderMedium}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: 14,
    minHeight: 52,
  },
  settingRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingIconBox: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingRowLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    color: '#0F172A',
  },
});
