
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../../../../constants';
import { useTranslation } from 'react-i18next';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

interface EventHeroProps {
  event: any; // We use any for now or infer
  onOpenMaps: () => void;
}

export default function EventHero({ event, onOpenMaps }: EventHeroProps) {
  const { t } = useTranslation();
  const colors = getColors(useThemeStore((state) => state.theme));

  return (
    <View style={[s.mapPreviewContainer, { backgroundColor: colors.card, borderColor: colors.border }]} >
      <Image
        source={{
          uri:
            event.cover_image_url ||
            'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop',
        }}
        style={s.mapPreviewImage}
        resizeMode="cover"
      />
      {event.status && (
        <View
          style={[
            s.routeBadge,
            event.status === 'ongoing' && { backgroundColor: '#F59E0B' },
            event.status === 'completed' && { backgroundColor: '#6B7280' },
            event.status === 'cancelled' && { backgroundColor: '#EF4444' },
          ]}
        >
          <Ionicons name="git-network-outline" size={10.5} color={Colors.white} />
          <Text style={s.routeText}>{event.status.toUpperCase()}</Text>
        </View>
      )}
      <TouchableOpacity style={[s.openMapsBtn, { backgroundColor: colors.card }]} activeOpacity={0.8} onPress={onOpenMaps}>
        <Ionicons name="open-outline" size={10.5} color={colors.primary} />
        <Text style={[s.openMapsText, { color: colors.primary }]}>{t('eventDetail.openMaps')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  mapPreviewContainer: {
    marginHorizontal: 16,
    aspectRatio: 16 / 9,
    backgroundColor: 'rgba(32,105,58,0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(32,105,58,0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  mapPreviewImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  routeBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    transform: [{ translateY: -14 }],
    backgroundColor: '#20693A',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  routeText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.white,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  openMapsBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  openMapsText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
    color: '#20693A',
    textAlign: 'center',
  },
});
