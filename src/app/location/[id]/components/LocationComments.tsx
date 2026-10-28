
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Fonts, FontSizes, Spacing, getColors } from '../../../../constants';
import { useThemeStore } from '../../../../stores/themeStore';
import { useTranslation } from 'react-i18next';
import { useAddReportComment, useReportComments } from '../../../../hooks/useReportQueries';
import { useAuthStore } from '../../../../stores/authStore';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400';

function timeAgo(dateStr: string, t: any): string {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
  if (mins >= 1440) return t('time.daysAgo', { count: Math.floor(mins / 1440), defaultValue: `${Math.floor(mins / 1440)} ngày trước` });
  if (mins >= 60) return t('time.hoursAgo', { count: Math.floor(mins / 60), defaultValue: `${Math.floor(mins / 60)} giờ trước` });
  return t('time.minsAgo', { count: mins, defaultValue: `${mins} phút trước` });
}

const LocationComments = ({ reportId }: { reportId: string }) => {
  const { t } = useTranslation();
  const colors = getColors(useThemeStore((s) => s.theme));
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const { data: comments = [], isLoading } = useReportComments(reportId);
  const addComment = useAddReportComment();
  const [draft, setDraft] = useState('');

  const handleSend = () => {
    const content = draft.trim();
    if (!content || addComment.isPending) return;
    addComment.mutate(
      { id: reportId, content },
      { onSuccess: () => setDraft('') },
    );
  };

  return (
    <View style={s.section}>
      <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t('location.comments', { count: comments.length })}</Text>

      {isLoading ? (
        <Text style={[s.emptyText, { color: colors.textSecondary }]}>{t('common.loading', { defaultValue: 'Loading...' })}</Text>
      ) : comments.length === 0 ? (
        <Text style={[s.emptyText, { color: colors.textSecondary }]}>{t('location.noComments', { defaultValue: 'Chưa có bình luận. Hãy là người đầu tiên!' })}</Text>
      ) : (
        comments.map((c) => (
          <View key={c.id} style={s.commentItem}>
            <Image source={{ uri: c.author?.avatar || FALLBACK_AVATAR }} style={s.avatar} />
            <View style={[s.commentBubble, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <View style={s.commentHeader}>
                <Text style={[s.commentAuthor, { color: colors.textPrimary }]}>{c.author?.fullname || 'Người dùng EcoPick'}</Text>
                <Text style={[s.commentTime, { color: colors.textPlaceholder }]}>{timeAgo(c.created_at, t).toUpperCase()}</Text>
              </View>
              <Text style={[s.commentText, { color: colors.textSecondary }]}>{c.content}</Text>
            </View>
          </View>
        ))
      )}

      <View style={s.commentInputRow}>
        <Image source={{ uri: user?.avatar || FALLBACK_AVATAR }} style={s.avatar} />
        <View style={[s.inputContainer, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <TextInput
            style={[s.input, { color: token ? colors.textPrimary : colors.textPlaceholder }]}
            placeholder={token ? t('location.addComment') : t('location.loginToComment', { defaultValue: 'Đăng nhập để bình luận' })}
            placeholderTextColor={colors.textPlaceholder}
            value={draft}
            onChangeText={setDraft}
            editable={!!token}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={s.sendBtn}
            onPress={handleSend}
            disabled={!token || !draft.trim() || addComment.isPending}
          >
            <Ionicons
              name="send"
              size={18}
              color={token && draft.trim() ? colors.primary : colors.textPlaceholder}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default LocationComments;

const s = StyleSheet.create({
  section: { paddingHorizontal: Spacing.base, marginBottom: 32 },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: 18, marginBottom: 16 },
  emptyText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginBottom: 16 },
  commentItem: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0' },
  commentBubble: { flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, borderTopLeftRadius: 4 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentAuthor: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
  commentTime: { fontFamily: Fonts.medium, fontSize: 10 },
  commentText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, lineHeight: 20 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16 },
  input: { flex: 1, height: 40, fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  sendBtn: { padding: 4 },
});
