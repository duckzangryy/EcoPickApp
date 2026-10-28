
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Fonts } from '../../../../constants';
import { getColors } from '@/constants/Colors';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';

interface ChatMessage {
  id: string;
  author: string;
  time: string;
  text: string;
  isMe: boolean;
}

export default function EventChat() {
  const { t } = useTranslation();
  const colors = getColors(useThemeStore((state) => state.theme));
  const user = useAuthStore((state) => state.user);

  // ponytail: chat chỉ lưu local, chưa có API event_messages — wire backend khi cần đồng bộ nhóm
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        author: user?.fullname || 'Bạn',
        time: timeStr,
        text: trimmed,
        isMe: true,
      },
    ]);
    setInputText('');
  };

  return (
    <View style={s.chatSection}>
      <View style={s.sectionHeader}>
        <View style={s.sectionTitleRow}>
          <Ionicons name="chatbubbles-outline" size={20} color={colors.textPrimary} />
          <Text style={[s.sectionTitleText, { color: colors.textPrimary }]}>{t('eventDetail.coordination')}</Text>
        </View>
        <Text style={[s.newMessagesText, { color: colors.textSecondary }]}>
          {t('eventDetail.newMessages', { count: messages.length })}
        </Text>
      </View>

      <View style={s.chatMessages}>
        {messages.map((msg) =>
          msg.isMe ? (
            <View key={msg.id} style={s.chatRowRight}>
              <View style={[s.chatBubbleRight, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
                <View style={s.chatBubbleHeaderRight}>
                  <Text style={[s.chatTimeRight, { color: colors.textPlaceholder }]}>{msg.time}</Text>
                  <Text style={[s.chatOrganizer, { color: colors.primary }]}>{msg.author}</Text>
                </View>
                <Text style={[s.chatTextRight, { color: colors.textPrimary }]}>{msg.text}</Text>
              </View>
              <View style={[s.youBadge, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={14} color="#fff" />
              </View>
            </View>
          ) : (
            <View key={msg.id} style={s.chatRowLeft}>
              <View style={[s.chatAvatar, { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontFamily: Fonts.bold, fontSize: 12, color: colors.primary }}>{msg.author.charAt(0).toUpperCase()}</Text></View>
              <View style={[s.chatBubbleLeft, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <View style={s.chatBubbleHeader}>
                  <Text style={[s.chatAuthor, { color: colors.textPrimary }]}>{msg.author}</Text>
                  <Text style={[s.chatTime, { color: colors.textPlaceholder }]}>{msg.time}</Text>
                </View>
                <Text style={[s.chatText, { color: colors.textPrimary }]}>{msg.text}</Text>
              </View>
            </View>
          )
        )}
      </View>

      {/* Send Input */}
      <View style={s.sendInputContainer}>
        <View style={[s.sendInputBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <TextInput
            style={[s.sendInput, { color: colors.textPrimary }]}
            placeholder={t('eventDetail.postUpdate', { defaultValue: 'Nhắn tin điều phối với nhóm...' })}
            placeholderTextColor={colors.textPlaceholder}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
        </View>
        <TouchableOpacity
          style={[s.sendIconBox, { backgroundColor: colors.primary, opacity: inputText.trim() ? 1 : 0.6 }]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="paper-plane" size={15} color="#fff" />
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
