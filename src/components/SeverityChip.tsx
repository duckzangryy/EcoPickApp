import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts, FontSizes, LineHeights } from '../constants';
import { SeverityLevel } from '../data/mockData';
import { getSeverityTheme } from '../utils/severity';

interface SeverityChipProps {
  severity: SeverityLevel;
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function SeverityChip({ severity, label, selected = false, onPress }: SeverityChipProps) {
  const theme = getSeverityTheme(severity);

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: theme.backgroundColor,
          borderColor: theme.borderColor,
          borderWidth: selected ? 1.5 : 1,
          opacity: selected ? 1 : 0.45,
          shadowColor: selected ? theme.dotColor : 'transparent',
          shadowOpacity: selected ? 0.25 : 0,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: theme.dotColor }]} />
      <Text
        style={[
          styles.label,
          {
            color: theme.textColor,
            fontFamily: selected ? Fonts.bold : Fonts.medium,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 9999,
    height: 34,
    gap: 7,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 9999,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
  },
});
