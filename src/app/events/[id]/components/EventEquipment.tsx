
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../../../constants';
import { useTranslation } from 'react-i18next';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

interface EventEquipmentProps {
  equipmentList: { name: string; status: 'BRING OWN' | 'PROVIDED' }[];
}

export default function EventEquipment({ equipmentList }: EventEquipmentProps) {
  const { t } = useTranslation();
  const colors = getColors(useThemeStore((state) => state.theme));

  if (equipmentList.length === 0) return null;

  return (
    <View style={[s.equipmentCard, { backgroundColor: colors.card, borderColor: colors.border } ]}>
      <View style={s.equipmentHeader}>
        <Ionicons name="cube-outline" size={20} color={colors.textPrimary} />
        <Text style={[s.sectionTitleText, { color: colors.textPrimary } ]}>{t('eventDetail.equipmentNeeded')}</Text>
      </View>
      <View style={s.equipmentList}>
        {equipmentList.map((item, index) => (
          <View key={index} style={[s.equipmentRow, { backgroundColor: colors.background } ]}>
            <View style={s.equipmentLeft}>
              <Ionicons
                name={
                  item.name.toLowerCase().includes('water')
                    ? 'water-outline'
                    : item.name.toLowerCase().includes('bag')
                    ? 'bag-outline'
                    : 'hand-left-outline'
                }
                size={20}
                color={colors.textSecondary}
              />
              <Text style={[s.equipmentName, { color: colors.textPrimary } ]}>{item.name}</Text>
            </View>
            <View
              style={[
                s.equipmentStatus,
                item.status === 'PROVIDED' ? s.statusProvided : s.statusBring,
              ]}
            >
              <Text
                style={[
                  s.equipmentStatusText,
                  item.status === 'PROVIDED' ? s.statusProvidedText : s.statusBringText,
                ]}
              >
                {item.status === 'PROVIDED' ? t('eventDetail.provided') : t('eventDetail.bringOwn')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  equipmentCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 17,
    gap: 12,
  },
  equipmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitleText: { fontFamily: Fonts.bold, fontSize: 16, lineHeight: 24 },
  equipmentList: { gap: 8 },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 16,
  },
  equipmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  equipmentName: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  equipmentStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  equipmentStatusText: { fontFamily: Fonts.bold, fontSize: 10, lineHeight: 15 },
  statusProvided: { backgroundColor: '#DCFCE7' },
  statusProvidedText: { color: '#15803D' },
  statusBring: { backgroundColor: '#FEF9C3' },
  statusBringText: { color: '#A16207' },
});
