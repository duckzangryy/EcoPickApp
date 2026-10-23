import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { BorderRadius, Colors, Fonts, FontSizes, LineHeights, Spacing } from '../constants';
import { WasteReport } from '../data/mockData';
import { ReportCard } from './ReportCard';

interface BottomSheetProps {
  reports: WasteReport[];
  totalCount: number;
  onNavigateReport?: (report: WasteReport) => void;
  onViewReport?: (report: WasteReport) => void;
}

export function ReportsBottomSheet({
  reports,
  totalCount,
  onNavigateReport,
  onViewReport,
}: BottomSheetProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.webWrapper} pointerEvents="box-none">
      <View style={[styles.panel, isExpanded ? styles.panelExpanded : styles.panelCollapsed]}>
        {/* Drag handle / Toggle button */}
        <TouchableOpacity
          style={styles.toggleBar}
          activeOpacity={0.8}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Ionicons name="location" size={18} color={Colors.primary} />
              <Text style={styles.title}>{t('bottomSheet.nearbyReports')}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalCount}</Text>
              </View>
            </View>
            <View style={styles.toggleBtn}>
              <Text style={styles.toggleText}>
                {isExpanded ? 'Thu gọn' : 'Xem danh sách'}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-down' : 'chevron-up'}
                size={18}
                color={Colors.primary}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Content list when expanded or partially open */}
        {isExpanded && (
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          >
            {reports && reports.length > 0 ? (
              reports.map((report) => (
                <View key={report.id} style={styles.itemWrapper}>
                  <ReportCard
                    report={report}
                    onNavigate={() => onNavigateReport?.(report)}
                    onView={() => onViewReport?.(report)}
                  />
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('bottomSheet.noLocations')}</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  panel: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    overflow: 'hidden',
  },
  panelCollapsed: {
    height: 72,
  },
  panelExpanded: {
    height: 380,
  },
  toggleBar: {
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.divider,
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  badge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    color: Colors.primary,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
  },
  toggleText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    color: Colors.primary,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.base,
    gap: 12,
  },
  itemWrapper: {
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
  },
});

export default ReportsBottomSheet;
