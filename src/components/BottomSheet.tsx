import { useLayout } from '@/hooks/use-layout';
import BottomSheetLib, { BottomSheetFlatList, BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Fonts, FontSizes, LineHeights, Spacing } from '../constants';
import { WasteReport } from '../data/mockData';
import { ReportCard } from './ReportCard';

interface BottomSheetProps {
  reports: WasteReport[];
  totalCount: number;
  onNavigateReport?: (report: WasteReport) => void;
  onViewReport?: (report: WasteReport) => void;
}

export function ReportsBottomSheet({ reports, totalCount, onNavigateReport, onViewReport }: BottomSheetProps) {
  const { insets, bottomTabHeight } = useLayout();
  const sheetRef = useRef<BottomSheetLib>(null);
  const { t } = useTranslation();

  // Snap points: Peek (25%), Half (50%), Max (92% — covers search bar)
  const snapPoints = useMemo(() => ['30%', '45%', '92%'], []);

  const renderReport = useCallback(
    ({ item }: { item: WasteReport }) => (
      <ReportCard report={item} onNavigate={() => onNavigateReport?.(item)} onView={() => onViewReport?.(item)} />
    ),
    [onNavigateReport, onViewReport],
  );
  const keyExtractor = useCallback((item: WasteReport) => item.id, []);

  return (
    <BottomSheetLib
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      topInset={insets.top + 12}
      enablePanDownToClose={false}
      enableOverDrag={false}
      animateOnMount={true}
      containerStyle={styles.sheetContainer}
      style={styles.sheetZ}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('bottomSheet.nearbyReports')}</Text>
        <View style={styles.headerRight}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t('bottomSheet.found', { count: totalCount })}</Text>
          </View>
        </View>
      </View>
      {reports && reports.length > 0 ? (
        <BottomSheetFlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={keyExtractor}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomTabHeight + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
      ) : (
        <BottomSheetView style={{ alignItems: 'center', justifyContent: 'center', flex: 1, padding: 32 }}>
          <Text style={{ color: Colors.textSecondary, fontSize: 16 }}>{t('bottomSheet.noLocations')}</Text>
        </BottomSheetView>
      )}
    </BottomSheetLib>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    pointerEvents: 'box-none',
  },
  sheetZ: {
    zIndex: 25,
  },
  sheetBackground: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 9999,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
    paddingTop: 4,
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 9999,
    backgroundColor: Colors.overlayWhite,
    marginLeft: 2,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    lineHeight: LineHeights.lg,
    color: Colors.textPrimary,
    letterSpacing: -0.45,
  },
  badge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },
});
