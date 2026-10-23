import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Fonts, FontSizes, LineHeights, Spacing } from '../../constants';
import {
  SEVERITY_FILTERS,
  STATUS_CONFIGS,
  WASTE_TYPE_CONFIGS,
  type ReportStatus,
  type SeverityLevel,
  type WasteType,
} from '../../data/mockData';
import type { MapFilters } from '../../stores/mapStore';
import { getSeverityTheme } from '../../utils/severity';

export interface FilterSheetProps {
  visible: boolean;
  filters: MapFilters;
  onToggleSeverity: (severity: SeverityLevel) => void;
  onToggleWasteType: (type: WasteType) => void;
  onToggleStatus: (status: ReportStatus) => void;
  onDistanceChange: (km: number) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
  matchCount: number;
}

export function FilterSheet({
  visible,
  filters,
  onToggleSeverity,
  onToggleWasteType,
  onToggleStatus,
  onDistanceChange,
  onApply,
  onReset,
  onClose,
  matchCount,
}: FilterSheetProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View style={styles.backdrop}>
      {/* Click outside backdrop to close */}
      <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />

      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('filter.title', 'Filter Reports')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* ── Severity ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('filter.severity', 'SEVERITY')}</Text>
            <View style={styles.chipsRow}>
              {SEVERITY_FILTERS.map((item) => {
                const theme = getSeverityTheme(item.key);
                const selected = filters.severity.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selected ? theme.backgroundColor : Colors.background,
                        borderColor: selected ? theme.borderColor : Colors.border,
                      },
                    ]}
                    onPress={() => onToggleSeverity(item.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.chipDot, { backgroundColor: theme.dotColor }]} />
                    <Text style={[styles.chipLabel, { color: selected ? theme.textColor : Colors.textSecondary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Waste Types ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('filter.wasteType', 'WASTE TYPE')}</Text>
            <View style={styles.chipsRow}>
              {WASTE_TYPE_CONFIGS.map((item) => {
                const selected = filters.wasteTypes.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selected ? `${item.color}20` : Colors.background,
                        borderColor: selected ? `${item.color}40` : Colors.border,
                      },
                    ]}
                    onPress={() => onToggleWasteType(item.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={selected ? item.color : Colors.textSecondary}
                    />
                    <Text style={[styles.chipLabel, { color: selected ? item.color : Colors.textSecondary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Distance Range ── */}
          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={styles.sectionLabel}>{t('filter.distance', 'DISTANCE RANGE')}</Text>
              <Text style={styles.sliderValue}>{filters.distanceRange} km</Text>
            </View>
            <Slider
              minimumValue={1}
              maximumValue={50}
              step={1}
              value={filters.distanceRange}
              onValueChange={onDistanceChange}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
              style={styles.slider}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>1 km</Text>
              <Text style={styles.sliderLabel}>50 km</Text>
            </View>
          </View>

          {/* ── Status ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('filter.status', 'STATUS')}</Text>
            <View style={styles.chipsRow}>
              {STATUS_CONFIGS.map((item) => {
                const selected = filters.status.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selected ? item.bgColor : Colors.background,
                        borderColor: selected ? `${item.color}30` : Colors.border,
                      },
                    ]}
                    onPress={() => onToggleStatus(item.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={14}
                      color={selected ? item.color : Colors.textSecondary}
                    />
                    <Text style={[styles.chipLabel, { color: selected ? item.color : Colors.textSecondary }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* ── Action Buttons ── */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
            <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.resetText}>{t('filter.reset', 'Reset')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
            <Text style={styles.applyText}>
              {t('filter.apply', 'Apply')} ({matchCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 1100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  panel: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    lineHeight: LineHeights.lg,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.primary,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderLabel: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    color: Colors.textPlaceholder,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  resetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  applyBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
});

export default FilterSheet;
