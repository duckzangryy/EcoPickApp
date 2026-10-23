import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes, LineHeights, BorderRadius, Spacing } from '../../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

interface SettingNavRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  onPress: () => void;
  isLast?: boolean;
  destructive?: boolean;
  subtitle?: string;
}

export default function SettingNavRow({ icon, iconColor, iconBg, label, value, onPress, isLast, destructive, subtitle }: SettingNavRowProps) {
  const colors = getColors(useThemeStore((state) => state.theme));
  return (
    <TouchableOpacity
      style={[styles.settingRow, { borderBottomColor: colors.border }, !isLast && styles.settingRowBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.settingRowLeft}>
        <View style={[
          styles.settingIconBox,
          { backgroundColor: destructive ? 'rgba(239,68,68,0.1)' : (iconBg || colors.primaryLight) },
        ]}>
          <Ionicons name={icon} size={16} color={destructive ? '#EF4444' : (iconColor || colors.primary)} />
        </View>
        <View>
          <Text style={[styles.settingRowLabel, { color: destructive ? '#EF4444' : colors.textPrimary }]}>{label}</Text>
          {subtitle ? <Text style={[styles.settingRowSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.settingRowRight}>
        {value ? <Text style={styles.settingRowValue}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={16} color={Colors.textPlaceholder} />
      </View>
    </TouchableOpacity>
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
    borderBottomColor: Colors.border,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
    color: Colors.textPrimary,
  },
  destructiveText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
    color: '#EF4444',
  },
  settingRowSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  settingRowValue: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    color: Colors.textSecondary,
  },
});
