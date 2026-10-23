import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

function useShimmer() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return opacity;
}

/** Reusable shimmer block */
function Bone({ style }: { style?: any }) {
  const opacity = useShimmer();
  const colors = getColors(useThemeStore((state) => state.theme));
  return <Animated.View style={[s.bone, { opacity, backgroundColor: colors.border }, style]} />;
}

export default function EventDetailSkeleton() {
  const colors = getColors(useThemeStore((state) => state.theme));
  return (
    <View style={s.container}>
      {/* ─── Hero image ─── */}
      <View style={s.heroWrap}>
        <Bone style={s.heroImage} />
      </View>

      {/* ─── Info section ─── */}
      <View style={s.section}>
        {/* Type tag */}
        <View style={s.typeRow}>
          <Bone style={{ width: 22, height: 22, borderRadius: 11 }} />
          <Bone style={{ width: 100, height: 14 }} />
        </View>

        {/* Title */}
        <Bone style={{ width: '90%', height: 24, marginTop: 8 }} />
        {/* Description lines */}
        <Bone style={{ width: '100%', height: 14, marginTop: 8 }} />
        <Bone style={{ width: '70%', height: 14, marginTop: 6 }} />

        {/* Address row */}
        <View style={[s.typeRow, { marginTop: 10 }]}>
          <Bone style={{ width: 20, height: 20, borderRadius: 10 }} />
          <Bone style={{ width: '60%', height: 13 }} />
        </View>

        {/* Date & Time boxes */}
        <View style={s.dateTimeRow}>
          <Bone style={s.dateTimeBox} />
          <Bone style={s.dateTimeBox} />
        </View>

        {/* Info cards */}
        <View style={s.dateTimeRow}>
          <Bone style={s.infoCard} />
          <Bone style={s.infoCard} />
        </View>
      </View>

      {/* ─── Participants section ─── */}
      <View style={s.section}>
        {/* Section header */}
        <View style={s.sectionHeader}>
          <View style={s.typeRow}>
            <Bone style={{ width: 24, height: 24, borderRadius: 12 }} />
            <Bone style={{ width: 140, height: 16 }} />
          </View>
          <Bone style={{ width: 50, height: 12 }} />
        </View>

        {/* Avatar stack + RSVP */}
        <View style={s.participantsRow}>
          <View style={s.avatarsStack}>
            {[0, 1, 2, 3].map((idx) => (
              <Bone
                key={idx}
                style={[
                  s.avatar,
                  { marginLeft: idx > 0 ? -12 : 0, borderColor: colors.background },
                ]}
              />
            ))}
            <Bone style={[s.avatar, { marginLeft: -12, backgroundColor: colors.borderMedium, borderColor: colors.background }]} />
          </View>
          <View style={[s.rsvpDivider, { backgroundColor: colors.border }]} />
          <View style={{ gap: 6 }}>
            <Bone style={{ width: 60, height: 10 }} />
            <Bone style={{ width: 40, height: 12 }} />
          </View>
        </View>
      </View>

      {/* ─── Equipment section ─── */}
      <View style={[s.equipmentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Header */}
        <View style={s.typeRow}>
          <Bone style={{ width: 20, height: 20, borderRadius: 10 }} />
          <Bone style={{ width: 130, height: 16 }} />
        </View>

        {/* Equipment rows */}
        {[0, 1, 2].map((idx) => (
          <View key={idx} style={[s.equipmentRow, { backgroundColor: colors.background }]}>
            <View style={s.typeRow}>
              <Bone style={{ width: 20, height: 20, borderRadius: 10 }} />
              <Bone style={{ width: 90 + idx * 20, height: 14 }} />
            </View>
            <Bone style={{ width: 70, height: 22, borderRadius: 8 }} />
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 120,
    gap: 24,
  },
  bone: {
    borderRadius: 8,
  },

  // ─── Hero ───
  heroWrap: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 24,
  },

  // ─── Section ───
  section: {
    paddingHorizontal: 16,
    gap: 4,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  dateTimeBox: {
    flex: 1,
    height: 62,
    borderRadius: 16,
  },
  infoCard: {
    flex: 1,
    height: 80,
    borderRadius: 16,
  },

  // ─── Participants ───
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  avatarsStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    borderWidth: 2,
  },
  rsvpDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
  },

  // ─── Equipment ───
  equipmentCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 17,
    gap: 12,
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 16,
  },
});
