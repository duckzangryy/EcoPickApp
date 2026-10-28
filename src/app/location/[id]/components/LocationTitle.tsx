
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Fonts, FontSizes, Spacing, getColors } from '../../../../constants';
import { useThemeStore } from '../../../../stores/themeStore';
import { useToggleReportUpvote, useReportUpvoteState } from '../../../../hooks/useReportQueries';
import { useAuthStore } from '../../../../stores/authStore';

interface LocationTitleProps {
  reportId: string;
  reportTitle: string;
  severityLabel: string;
  severityTheme: { backgroundColor: string; borderColor: string; textColor: string };
  distanceText: string;
}

const LocationUpvote = ({ reportId }: { reportId: string }) => {
  const { t } = useTranslation();
  const themeMode = useThemeStore((s) => s.theme);
  const colors = getColors(themeMode);
  const token = useAuthStore((s) => s.token);
  const { data: state } = useReportUpvoteState(reportId);
  const toggle = useToggleReportUpvote();

  // Chưa đăng nhập: hiển thị số nhưng bấm không làm gì (server sẽ 401)
  const onPress = () => {
    if (!token || toggle.isPending) return;
    toggle.mutate({ id: reportId, upvote: !state?.upvoted });
  };

  const upvoted = !!state?.upvoted;
  return (
    <TouchableOpacity
      style={[s.upvoteBtn, { backgroundColor: colors.white, borderColor: colors.border }, upvoted && { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!token}
    >
      <Ionicons name={upvoted ? 'thumbs-up' : 'thumbs-up-outline'} size={14} color={upvoted ? colors.primary : colors.textSecondary} />
      <Text style={[s.upvoteText, upvoted && { color: colors.primary, fontFamily: Fonts.semiBold }]}>
        {state?.upvoteCount ?? 0}
      </Text>
    </TouchableOpacity>
  );
};

const LocationTitle = ({ reportId, reportTitle, severityLabel, severityTheme, distanceText }: LocationTitleProps) => {
  const { t } = useTranslation();
  const themeMode = useThemeStore((s) => s.theme);
  const colors = getColors(themeMode);

  return (
    <View style={s.titleSection}>
      <View style={s.titleRow}>
        <Text style={[s.title, { color: colors.textPrimary }]}>{reportTitle}</Text>
        <View
          style={[
            s.severityBadge,
            { backgroundColor: severityTheme.backgroundColor, borderColor: severityTheme.borderColor },
          ]}
        >
          <Ionicons name="warning-outline" size={14} color={severityTheme.textColor} />
          <Text style={[s.severityText, { color: severityTheme.textColor }]}>
            {severityLabel?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={s.metaRow}>
        <View style={s.metaItem}>
          <Ionicons name="navigate-outline" size={16} color={colors.textSecondary} />
          <Text style={[s.metaText, { color: colors.textSecondary }]}>{distanceText}</Text>
        </View>
        <View style={s.metaItem}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[s.metaText, { color: colors.textSecondary }]}>{t('location.reportedAgo')}</Text>
        </View>
        <LocationUpvote reportId={reportId} />
      </View>
    </View>
  );
}
export default LocationTitle;

const s = StyleSheet.create({
  titleSection: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  title: { flex: 1, fontFamily: Fonts.bold, fontSize: 24, lineHeight: 30 },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  severityText: { fontFamily: Fonts.bold, fontSize: 10, letterSpacing: 0.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  upvoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  upvoteText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
});