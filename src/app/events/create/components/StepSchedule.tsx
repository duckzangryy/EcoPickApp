import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { Colors, Fonts } from '../../../../constants';
import { getColors } from '@/constants/Colors';
import { useThemeStore } from '@/stores/themeStore';

interface StepScheduleProps {
  t: any;
  startDate: Date;
  endDate: Date;
  showPicker: string | null;
  setShowPicker: (p: string | null) => void;
  onDatePickerChange: (type: string) => (e: any, d?: Date) => void;
  durationDays: number;
  durationHrs: number;
  durationMins: number;
}

const StepSchedule = ({
  t,
  startDate,
  endDate,
  showPicker,
  setShowPicker,
  onDatePickerChange,
  durationDays,
  durationHrs,
  durationMins,
}: StepScheduleProps) => {
  const theme = useThemeStore((s) => s.theme);
  const colors = getColors(theme);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const openPicker = (type: string) => {
    const isStart = type.startsWith('start');
    const mode = type.includes('Time') ? 'time' : 'date';
    const currentValue = isStart ? startDate : endDate;
    const minDate =
      type === 'endDate' || type === 'endTime' ? startDate : new Date();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentValue,
        mode: mode as 'date' | 'time',
        display: 'spinner',
        minimumDate: minDate,
        is24Hour: false,
        onChange: (_event: any, selectedDate?: Date) => {
          if (selectedDate) {
            onDatePickerChange(type)(null, selectedDate);
          }
        },
      });
    } else {
      setTempDate(currentValue);
      setShowPicker(type);
    }
  };

  const handleIOSChange = (_: any, date?: Date) => {
    if (date) setTempDate(date);
  };

  const handleIOSConfirm = () => {
    if (showPicker) {
      onDatePickerChange(showPicker)(null, tempDate);
    }
    setShowPicker(null);
  };

  const pickerMode = showPicker?.includes('Time') ? 'time' : 'date';
  const minimumDate =
    showPicker === 'endDate' || showPicker === 'endTime'
      ? startDate
      : new Date();

  // Build duration text
  const parts: string[] = [];
  if (durationDays > 0) parts.push(`${durationDays} ${t('createEvent.schedule.days', { defaultValue: 'days' })}`);
  if (durationHrs > 0) parts.push(`${durationHrs} ${t('createEvent.schedule.hours', { defaultValue: 'hrs' })}`);
  if (durationMins > 0) parts.push(`${durationMins} ${t('createEvent.schedule.mins', { defaultValue: 'min' })}`);
  const durationText = parts.length > 0 ? parts.join(' ') : `0 ${t('createEvent.schedule.mins', { defaultValue: 'min' })}`;

  return (
    <View style={s.container}>
      {/* ─── Start ─── */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.cardHeader}>
          <View style={[s.cardDot, { backgroundColor: colors.primary }]} />
          <Text style={[s.cardLabel, { color: colors.textPrimary }]}>
            {t('createEvent.schedule.startsAt')}
          </Text>
        </View>

        <View style={s.row}>
          <TouchableOpacity
            style={[s.dateBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => openPicker('startDate')}
            activeOpacity={0.6}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <View>
              <Text style={[s.btnLabel, { color: colors.textPlaceholder }]}>{t('createEvent.schedule.date')}</Text>
              <Text style={[s.btnValue, { color: colors.textPrimary }]}>{dayjs(startDate).format('ddd, MMM D')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.timeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => openPicker('startTime')}
            activeOpacity={0.6}
          >
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <View>
              <Text style={[s.btnLabel, { color: colors.textPlaceholder }]}>{t('createEvent.schedule.time')}</Text>
              <Text style={[s.btnValue, { color: colors.textPrimary }]}>{dayjs(startDate).format('hh:mm A')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Duration badge ─── */}
      <View style={s.durationRow}>
        <View style={[s.durationLine, { backgroundColor: colors.border }]} />
        <View style={[s.durationBadge, { backgroundColor: theme === 'dark' ? 'rgba(32,105,58,0.2)' : '#F0FDF4', borderColor: theme === 'dark' ? colors.primaryBorder : '#DCFCE7' }]}>
          <Ionicons name="hourglass-outline" size={14} color={colors.primary} />
          <Text style={[s.durationText, { color: colors.primary }]}>{durationText}</Text>
        </View>
        <View style={[s.durationLine, { backgroundColor: colors.border }]} />
      </View>

      {/* ─── End ─── */}
      <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.cardHeader}>
          <View style={[s.cardDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[s.cardLabel, { color: colors.textPrimary }]}>
            {t('createEvent.schedule.endsAt')}
          </Text>
        </View>

        <View style={s.row}>
          <TouchableOpacity
            style={[s.dateBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => openPicker('endDate')}
            activeOpacity={0.6}
          >
            <Ionicons name="calendar-outline" size={18} color="#EF4444" />
            <View>
              <Text style={[s.btnLabel, { color: colors.textPlaceholder }]}>{t('createEvent.schedule.date')}</Text>
              <Text style={[s.btnValue, { color: colors.textPrimary }]}>{dayjs(endDate).format('ddd, MMM D')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.timeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => openPicker('endTime')}
            activeOpacity={0.6}
          >
            <Ionicons name="time-outline" size={18} color="#EF4444" />
            <View>
              <Text style={[s.btnLabel, { color: colors.textPlaceholder }]}>{t('createEvent.schedule.time')}</Text>
              <Text style={[s.btnValue, { color: colors.textPrimary }]}>{dayjs(endDate).format('hh:mm A')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Duration Summary ─── */}
      <View style={[s.summary, { backgroundColor: theme === 'dark' ? 'rgba(32,105,58,0.15)' : '#F0FDF4', borderColor: theme === 'dark' ? colors.primaryBorder : '#DCFCE7' }]}>
        <View style={[s.summaryIcon, { backgroundColor: colors.card, borderColor: theme === 'dark' ? colors.primaryBorder : '#DCFCE7' }]}>
          <Ionicons name="timer-outline" size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.summaryLabel, { color: colors.textSecondary }]}>
            {t('createEvent.schedule.duration')}
          </Text>
          <Text style={[s.summaryValue, { color: colors.primary }]}>{durationText}</Text>
        </View>
      </View>

      {/* ─── iOS Modal Picker ─── */}
      {showPicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide" onRequestClose={() => setShowPicker(null)}>
          <TouchableWithoutFeedback onPress={() => setShowPicker(null)}>
            <View style={s.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[s.modalSheet, { backgroundColor: colors.card }]}>
                  <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => setShowPicker(null)}>
                      <Text style={[s.modalCancel, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                    <Text style={[s.modalTitle, { color: colors.textPrimary }]}>
                      {pickerMode === 'date'
                        ? t('createEvent.schedule.selectDate')
                        : t('createEvent.schedule.selectTime')}
                    </Text>
                    <TouchableOpacity onPress={handleIOSConfirm}>
                      <Text style={[s.modalDone, { color: colors.primary }]}>
                        {t('common.done', { defaultValue: 'Done' })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={s.pickerContainer}>
                    <DateTimePicker
                      value={tempDate}
                      mode={pickerMode as 'date' | 'time'}
                      display="spinner"
                      themeVariant={theme}
                      textColor={colors.textPrimary}
                      onChange={handleIOSChange}
                      minimumDate={minimumDate}
                      style={{ height: 200, width: '100%' }}
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}
export default StepSchedule;
const s = StyleSheet.create({
  container: {
    padding: 20,
  },

  // ─── Card ───
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E8ECF0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  cardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardLabel: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: '#1E293B',
  },

  // ─── Buttons ───
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    minWidth: 120,
  },
  btnLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnValue: {
    fontFamily: Fonts.semiBold,
    fontSize: 14,
    color: '#1E293B',
    marginTop: 1,
  },

  // ─── Duration badge (between cards) ───
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 20,
  },
  durationLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginHorizontal: 8,
  },
  durationText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    color: Colors.primary,
  },

  // ─── Summary ───
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  summaryLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    color: Colors.primary,
  },

  // ─── iOS Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    color: '#1E293B',
  },
  modalCancel: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: '#94A3B8',
  },
  modalDone: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    color: Colors.primary,
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
