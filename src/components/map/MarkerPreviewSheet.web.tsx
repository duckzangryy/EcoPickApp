import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useCallback, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getDaklakMapUrl } from '../../api/services/reportService';
import { BorderRadius, Colors, Fonts, FontSizes, getColors, Spacing } from '../../constants';
import type { SeverityLevel, WasteReport } from '../../data/mockData';
import { getWasteTypeConfig } from '../../data/mockData';
import { useThemeStore } from '../../stores/themeStore';
import { getSeverityIcon, getSeverityTheme } from '../../utils/severity';

export interface MarkerPreviewSheetRef {
  show: (report: WasteReport) => void;
  dismiss: () => void;
  expand: () => void;
}

interface MarkerPreviewSheetProps {
  onViewDetails?: (report: WasteReport) => void;
  onGetDirections?: (report: WasteReport) => void;
  onDismiss?: () => void;
}

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
  extreme: 'Extreme',
};

export const MarkerPreviewSheet = forwardRef<MarkerPreviewSheetRef, MarkerPreviewSheetProps>(
  ({ onViewDetails, onGetDirections, onDismiss }, ref) => {
    const { t } = useTranslation();
    const [report, setReport] = useState<WasteReport | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const themeMode = useThemeStore((s) => s.theme);
    const colors = getColors(themeMode);

    useImperativeHandle(ref, () => ({
      show: (r: WasteReport) => {
        setReport(r);
        setIsExpanded(false);
      },
      dismiss: () => {
        setReport(null);
        setIsExpanded(false);
        onDismiss?.();
      },
      expand: () => {
        setIsExpanded(true);
      },
    }));

    const getTimeAgo = useCallback(
      (dateStr: string) => {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.max(1, Math.floor(diffMs / 60000));
        const diffHrs = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHrs / 24);

        if (diffDays > 0) return `${diffDays} ${t('time.daysAgo', 'ngày trước')}`;
        if (diffHrs > 0) return `${diffHrs} ${t('time.hoursAgo', 'giờ trước')}`;
        return `${diffMins} ${t('time.minsAgo', 'phút trước')}`;
      },
      [t],
    );

    if (!report) return null;

    const theme = getSeverityTheme(report.severity);
    const icon = getSeverityIcon(report.severity);
    const imageUrl = report.image && !/^(https?:|data:|blob:)/i.test(report.image)
      ? `${getDaklakMapUrl().replace(/\/$/, '')}/${report.image.replace(/^\//, '')}`
      : report.image;

    return (
      <View style={styles.webWrapper} pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Top preview row */}
          <View style={styles.previewRow}>
            {/* Thumbnail */}
            <View style={styles.thumbWrapper}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.thumbnail} resizeMode="cover" />
              ) : (
                <View style={[styles.thumbnail, styles.imagePlaceholder, { backgroundColor: colors.border }]}>
                  <Ionicons name="image-outline" size={24} color={colors.textPlaceholder} />
                </View>
              )}
              <View style={[styles.thumbBadge, { backgroundColor: theme.dotColor }]}>
                <Ionicons name={icon.name as keyof typeof Ionicons.glyphMap} size={11} color="#FFF" />
              </View>
            </View>

            {/* Info */}
            <View style={styles.previewInfo}>
              <Text style={[styles.previewTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {report.title}
              </Text>

              {/* Waste types */}
              {report.wasteTypes && report.wasteTypes.length > 0 && (
                <View style={styles.wasteChipsRow}>
                  {report.wasteTypes.slice(0, 3).map((wt) => {
                    const wtConfig = getWasteTypeConfig(wt);
                    return (
                      <View key={wt} style={[styles.miniChip, { backgroundColor: `${wtConfig.color}15` }]}>
                        <Ionicons name={wtConfig.icon as keyof typeof Ionicons.glyphMap} size={10} color={wtConfig.color} />
                        <Text style={[styles.miniChipText, { color: wtConfig.color }]}>{wtConfig.label}</Text>
                      </View>
                    );
                  })}
                  {report.wasteTypes.length > 3 && (
                    <Text style={[styles.moreChipText, { color: colors.textSecondary }]}>+{report.wasteTypes.length - 3}</Text>
                  )}
                </View>
              )}

              {/* Meta info */}
              <View style={styles.metaRow}>
                <View style={[styles.severityBadge, { backgroundColor: theme.backgroundColor, borderColor: theme.borderColor }]}>
                  <View style={[styles.severityDot, { backgroundColor: theme.dotColor }]} />
                  <Text style={[styles.severityLabel, { color: theme.textColor }]}>
                    {SEVERITY_LABELS[report.severity]}
                  </Text>
                </View>

                {report.distance ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={11} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{report.distance}</Text>
                  </View>
                ) : null}

                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={11} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{getTimeAgo(report.createdAt)}</Text>
                </View>
              </View>
            </View>

            {/* Close button */}
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.border }]}
              onPress={() => {
                setReport(null);
                onDismiss?.();
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Description preview if present */}
          {report.description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={isExpanded ? 6 : 2}>
              {report.description}
            </Text>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: colors.primary }]}
              onPress={() => onViewDetails?.(report)}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                {t('marker.viewDetails', 'Xem chi tiết')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => onGetDirections?.(report)}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={16} color="#FFF" />
              <Text style={styles.primaryBtnText}>
                {t('marker.getDirections', 'Chỉ đường')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  },
);

MarkerPreviewSheet.displayName = 'MarkerPreviewSheet';

const styles = StyleSheet.create({
  webWrapper: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 20,
    gap: 12,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  previewInfo: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  wasteChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniChipText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },
  moreChipText: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
  },
  severityDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  severityLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  secondaryBtnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  primaryBtnText: {
    color: '#FFF',
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
});
