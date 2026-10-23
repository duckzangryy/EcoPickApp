import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Fonts, FontSizes, LineHeights } from '../constants';
import { getWasteTypeConfig, WasteReport } from '../data/mockData';
import { getSeverityIcon, getSeverityTheme } from '../utils/severity';
import { getDaklakMapUrl } from '../api/services/reportService';
import { getColors } from '../constants/Colors';
import { useThemeStore } from '../stores/themeStore';

interface ReportCardProps {
  report: WasteReport;
  onNavigate?: () => void;
  onView?: () => void;
}

export function ReportCard({ report, onNavigate, onView }: ReportCardProps) {
  const colors = getColors(useThemeStore((state) => state.theme));
  const icon = getSeverityIcon(report.severity);
  const theme = getSeverityTheme(report.severity);
  const isPrimary = report.severity === 'heavy' || report.severity === 'extreme';
  const { t } = useTranslation();
  const imageUrl = report.image && !/^(https?:|data:|blob:)/i.test(report.image)
    ? `${getDaklakMapUrl().replace(/\/$/, '')}/${report.image.replace(/^\//, '')}`
    : report.image;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]} activeOpacity={0.7} onPress={isPrimary ? onNavigate : onView}>
      {imageUrl ? (
        <View style={styles.thumbWrapper}>
          <Image source={{ uri: imageUrl }} style={[styles.thumbnail, { backgroundColor: colors.card }]} resizeMode="cover" />
          <View style={[styles.thumbBadge, { backgroundColor: theme.dotColor, borderColor: colors.background }]}>
            <Ionicons name={icon.name as keyof typeof Ionicons.glyphMap} size={10} color="#FFF" />
          </View>
        </View>
      ) : (
        <View style={[styles.iconContainer, { backgroundColor: icon.bgColor }]}>
          <Ionicons name={icon.name as keyof typeof Ionicons.glyphMap} size={18} color={theme.dotColor} />
        </View>
      )}

      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{report.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>{report.description}</Text>
        {report.wasteTypes && report.wasteTypes.length > 0 && (
          <View style={styles.wasteChipsRow}>
            {report.wasteTypes.slice(0, 3).map((wt) => {
              const wtConfig = getWasteTypeConfig(wt);
              return (
                <View key={wt} style={[styles.miniChip, { backgroundColor: `${wtConfig.color}10` }]}>
                  <Ionicons name={wtConfig.icon as keyof typeof Ionicons.glyphMap} size={9} color={wtConfig.color} />
                  <Text style={[styles.miniChipText, { color: wtConfig.color }]}>{wtConfig.label}</Text>
                </View>
              );
            })}
            {report.wasteTypes.length > 3 && <Text style={[styles.moreText, { color: colors.textSecondary }]}>+{report.wasteTypes.length - 3}</Text>}
          </View>
        )}
        {report.distance ? (
          <View style={styles.distanceBadge}>
            <Ionicons name="bicycle-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.distanceText, { color: colors.textSecondary }]}>{report.distance}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.actionButton, isPrimary ? styles.actionButtonPrimary : { backgroundColor: colors.primaryLight }]}
        onPress={isPrimary ? onNavigate : onView}
        activeOpacity={0.7}
      >
        <Ionicons name={isPrimary ? 'navigate' : 'eye-outline'} size={14} color={isPrimary ? Colors.white : colors.primary} />
        <Text style={[styles.actionText, { color: isPrimary ? Colors.white : colors.primary }]}>
          {isPrimary ? t('reportCard.navigate') : t('reportCard.view')}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: BorderRadius.md, padding: 12, gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center' },
  thumbWrapper: { position: 'relative' },
  thumbnail: { width: 48, height: 48, borderRadius: BorderRadius.md },
  thumbBadge: { position: 'absolute', bottom: -3, right: -3, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  textContainer: { flex: 1 },
  title: { fontFamily: Fonts.bold, fontSize: FontSizes.md, lineHeight: LineHeights.md },
  description: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, lineHeight: LineHeights.sm, marginTop: 1 },
  wasteChipsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  miniChip: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  miniChipText: { fontFamily: Fonts.medium, fontSize: 9 },
  moreText: { fontFamily: Fonts.medium, fontSize: 9 },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  distanceText: { fontFamily: Fonts.medium, fontSize: 11 },
  actionButton: { borderRadius: BorderRadius.md, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap', flexDirection: 'row', minWidth: 100, gap: 3 },
  actionButtonPrimary: { backgroundColor: Colors.primary },
  actionText: { fontFamily: Fonts.bold, fontSize: FontSizes.xs, lineHeight: LineHeights.xs, textAlign: 'center' },
});
