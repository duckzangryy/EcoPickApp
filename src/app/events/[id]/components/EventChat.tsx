
import React from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../../../constants';
import { useTranslation } from 'react-i18next';
import { CHAT_AVATAR } from '../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

export default function EventChat() {
  const { t } = useTranslation();
  const colors = getColors(useThemeStore((state) => state.theme));

  return (
    <View style={s.chatSection}>
      <View style={s.sectionHeader}>
        <View style={s.sectionTitleRow}>
          <Ionicons name="chatbubbles-outline" size={20} color={colors.textPrimary} />
          <Text style={[s.sectionTitleText, { color: colors.textPrimary }]}>{t('eventDetail.coordination')}</Text>
        </View>
        <Text style={[s.newMessagesText, { color: colors.textSecondary }]}>{t('eventDetail.newMessages', { count: 3 })}</Text>
      </View>

      <View style={s.chatMessages}>
        {/* Message from other user — left aligned */}
        <View style={s.chatRowLeft}>
          <Image source={{ uri: CHAT_AVATAR }} style={s.chatAvatar} />
          <View style={[s.chatBubbleLeft, { backgroundColor: colors.card }]}>
            <View style={s.chatBubbleHeader}>
              <Text style={[s.chatAuthor, { color: colors.textPrimary }]}>Mark T.</Text>
              <Text style={[s.chatTime, { color: colors.textPlaceholder }]}>10:24 AM</Text>
            </View>
            <Text style={[s.chatText, { color: colors.textPrimary }]}>
              {"I'll bring an extra pair of grabbers if anyone needs them!"}
            </Text>
          </View>
        </View>

        {/* Message from you — right aligned */}
        <View style={s.chatRowRight}>
          <View style={[s.chatBubbleRight, { backgroundColor: colors.background }]}>
            <View style={s.chatBubbleHeaderRight}>
              <Text style={[s.chatTimeRight, { color: colors.textPlaceholder }]}>10:30 AM</Text>
              <Text style={[s.chatOrganizer, { color: colors.primary }]}>{t('common.organizer')}</Text>
            </View>
            <Text style={[s.chatTextRight, { color: colors.textPrimary }]}>That would be great, Mark! Thanks.</Text>
          </View>
          <View style={[s.youBadge, { backgroundColor: colors.primary }]}>
            <Text style={[s.youBadgeText, { color: colors.background }]}>{t('common.you')}</Text>
          </View>
        </View>
      </View>

      {/* Send Input */}
      <View style={s.sendInputContainer}>
        <View style={[s.sendInputBox, { backgroundColor: colors.background }]}>
          <TextInput
            style={[s.sendInput, { color: colors.textPrimary }]}
            placeholder={t('eventDetail.postUpdate')}
            placeholderTextColor={colors.textPlaceholder}
          />
        </View>
        <TouchableOpacity style={[s.sendIconBox, { backgroundColor: colors.primary }]}>
          <Ionicons name="paper-plane" size={14} color={colors.background} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  chatSection: { gap: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitleText: { fontFamily: Fonts.bold, fontSize: 16, lineHeight: 24 },
  newMessagesText: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 16 },
  chatMessages: { gap: 12 },
  chatRowLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  chatAvatar: { width: 32, height: 32, borderRadius: 9999 },
  chatBubbleLeft: {
    flex: 1,
    padding: 12,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopLeftRadius: 0,
    gap: 4,
  },
  chatBubbleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatAuthor: { fontFamily: Fonts.bold, fontSize: 12, lineHeight: 16 },
  chatTime: { fontFamily: Fonts.regular, fontSize: 10, lineHeight: 15 },
  chatText: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  chatRowRight: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  chatBubbleRight: {
    flex: 1,
    padding: 12,
    borderTopLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 0,
    gap: 4,
  },
  chatBubbleHeaderRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatTimeRight: { fontFamily: Fonts.regular, fontSize: 10, lineHeight: 15 },
  chatOrganizer: { fontFamily: Fonts.bold, fontSize: 12, lineHeight: 16, textAlign: 'right' },
  chatTextRight: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20, textAlign: 'right' },
  youBadge: { width: 32, height: 32, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
  youBadgeText: { fontFamily: Fonts.bold, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  sendInputContainer: { position: 'relative' },
  sendInputBox: { borderRadius: 9999, paddingLeft: 20, paddingRight: 48, overflow: 'hidden' },
  sendInput: { fontFamily: Fonts.regular, fontSize: 14, height: 46 },
  sendIconBox: { position: 'absolute', right: 8, top: 6, width: 36, height: 36, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
});
