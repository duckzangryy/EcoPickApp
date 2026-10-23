import { useLayout } from '@/hooks/use-layout';
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import BottomSheetLib, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';
import React, { useCallback, useMemo, useRef } from 'react';
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

interface FilterSheetProps {
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
  const { bottomTabHeight } = useLayout()
  const sheetRef = useRef<BottomSheetLib>(null);
  const snapPoints = useMemo(() => ['75%'], []);
  const { t } = useTranslation();

  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    sheetRef.current?.close();
    onClose();
  }, [onClose]);

  if (!visible) return null;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.35} pressBehavior="close" />
    ),
    [],
  );

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose],
  );

  return (
    <BottomSheetLib
      ref={sheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={sheetStyles.background}
      handleIndicatorStyle={sheetStyles.handle}
      onChange={handleSheetChange}
    >
      <BottomSheetView style={[sheetStyles.container, { paddingBottom: bottomTabHeight + 16 }]}>
        {/* Header */}
        <View style={sheetStyles.header}>
          <Text style={sheetStyles.headerTitle}>{t('filter.title', 'Filter Reports')}</Text>
          <TouchableOpacity onPress={handleClose} style={sheetStyles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={sheetStyles.scrollContent}>
          {/* ── Severity ── */}
          <View style={sheetStyles.section}>
            <Text style={sheetStyles.sectionLabel}>{t('filter.severity', 'SEVERITY')}</Text>
            <View style={sheetStyles.chipsRow}>
              {SEVERITY_FILTERS.map((item) => {
                const theme = getSeverityTheme(item.key);
                const selected = filters.severity.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      sheetStyles.filterChip,
                      {
                        backgroundColor: selected ? theme.backgroundColor : Colors.background,
                        borderColor: selected ? theme.borderColor : Colors.border,
                      },
                    ]}
                    onPress={() => onToggleSeverity(item.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[sheetStyles.chipDot, { backgroundColor: theme.dotColor }]} />
                    <Text style={[sheetStyles.chipLabel, { color: selected ? theme.textColor : Colors.textSecondary }]}>
                      {item.label}
                    </Text>
                    {/* {selected && <Ionicons name="checkmark" size={14} color={theme.textColor} />} */}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Waste Types ── */}
          <View style={sheetStyles.section}>
            <Text style={sheetStyles.sectionLabel}>{t('filter.wasteType', 'WASTE TYPE')}</Text>
            <View style={sheetStyles.chipsRow}>
              {WASTE_TYPE_CONFIGS.map((item) => {
                const selected = filters.wasteTypes.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      sheetStyles.filterChip,
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
                    <Text style={[sheetStyles.chipLabel, { color: selected ? item.color : Colors.textSecondary }]}>
                      {item.label}
                    </Text>
                    {/* {selected && <Ionicons name="checkmark" size={14} color={item.color} />} */}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Distance Range ── */}
          <View style={sheetStyles.section}>
            <View style={sheetStyles.sliderHeader}>
              <Text style={sheetStyles.sectionLabel}>{t('filter.distance', 'DISTANCE RANGE')}</Text>
              <Text style={sheetStyles.sliderValue}>{filters.distanceRange} km</Text>
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
              style={sheetStyles.slider}
            />
            <View style={sheetStyles.sliderLabels}>
              <Text style={sheetStyles.sliderLabel}>1 km</Text>
              <Text style={sheetStyles.sliderLabel}>50 km</Text>
            </View>
          </View>

          {/* ── Status ── */}
          <View style={sheetStyles.section}>
            <Text style={sheetStyles.sectionLabel}>{t('filter.status', 'STATUS')}</Text>
            <View style={sheetStyles.chipsRow}>
              {STATUS_CONFIGS.map((item) => {
                const selected = filters.status.includes(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      sheetStyles.filterChip,
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
                    <Text style={[sheetStyles.chipLabel, { color: selected ? item.color : Colors.textSecondary }]}>
                      {item.label}
                    </Text>
                    {/* {selected && <Ionicons name="checkmark" size={14} color={item.color} />} */}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* ── Action Buttons ── */}
        <View style={sheetStyles.actions}>
          <TouchableOpacity style={sheetStyles.resetBtn} onPress={onReset} >
            <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
            <Text style={sheetStyles.resetText}>{t('filter.reset', 'Reset')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={sheetStyles.applyBtn} onPress={onApply} activeOpacity={0.8}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
            <Text style={sheetStyles.applyText}>
              {t('filter.apply', 'Apply')} ({matchCount})
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetLib>
  );
}

const sheetStyles = StyleSheet.create({
  background: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 9999,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginVertical: 5,
  },
  container: {
    flex: 1,
    // marginBottom: 300,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
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
    // paddingBottom: 50,
  },
  section: {
    marginBottom: 10,
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
