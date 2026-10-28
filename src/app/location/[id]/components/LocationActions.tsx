
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Fonts, FontSizes, Spacing } from '../../../../constants';
import { useClaimReport } from '../../../../hooks/useReportQueries';
import { useAuthStore } from '../../../../stores/authStore';

interface LocationActionsProps {
  reportId: string;
  status?: string;
  role?: string;
  onNavigate: () => void;
  onCreateEvent: () => void;
}

const IN_PROGRESS_LABEL = { vi: 'Đang được dọn dẹp', en: 'Cleanup in progress' };

const LocationActions = ({ reportId, status, role, onNavigate, onCreateEvent }: LocationActionsProps) => {
  const { t, i18n } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const claim = useClaimReport();

  const claimed = status === 'in_progress' || status === 'cleaned';
  const canClaim = !!token && !claimed && status !== 'completed';

  const handleClaim = () => {
    if (!canClaim || claim.isPending) return;
    claim.mutate(reportId);
  };

  return (
    <View style={s.actionRow}>
      {claimed ? (
        <View style={[s.claimedBanner]}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
          <Text style={s.claimedText}>
            {status === 'cleaned'
              ? t('location.cleaned', { defaultValue: 'Đã dọn dẹp' })
              : i18n.language?.startsWith('vi') ? IN_PROGRESS_LABEL.vi : IN_PROGRESS_LABEL.en}
          </Text>
        </View>
      ) : (
        <TouchableOpacity style={s.navigateBtn} activeOpacity={0.8} onPress={onNavigate}>
          <Ionicons name="navigate" size={20} color={Colors.white} />
          <Text style={s.navigateText}>{t('location.navigate')}</Text>
        </TouchableOpacity>
      )}
      {canClaim && (
        <TouchableOpacity
          style={[s.eventBtn, claim.isPending && { opacity: 0.6 }]}
          activeOpacity={0.8}
          onPress={handleClaim}
        >
          <Ionicons name="hand-left-outline" size={20} color={Colors.white} />
          <Text style={s.eventText}>{t('location.claimCleanup', { defaultValue: 'Nhận dọn dẹp' })}</Text>
        </TouchableOpacity>
      )}
      {claimed && role !== 'user' && (
        <TouchableOpacity style={s.eventBtn} activeOpacity={0.8} onPress={onCreateEvent}>
          <Ionicons name="calendar-outline" size={20} color={Colors.white} />
          <Text style={s.eventText}>{t('location.createEvent')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default LocationActions;

const s = StyleSheet.create({
  actionRow: { flexDirection: 'row', paddingHorizontal: Spacing.base, gap: Spacing.sm, marginBottom: 32 },
  navigateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  navigateText: { fontFamily: Fonts.bold, color: Colors.white, fontSize: FontSizes.md },
  eventBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  eventText: { fontFamily: Fonts.bold, color: Colors.white, fontSize: FontSizes.md },
  claimedBanner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  claimedText: { fontFamily: Fonts.bold, color: Colors.white, fontSize: FontSizes.md },
});
