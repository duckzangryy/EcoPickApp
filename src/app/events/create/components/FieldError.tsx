import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Fonts } from '../../../../constants';

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <View style={s.errorRow}>
      <Ionicons name="alert-circle" size={13} color="#EF4444" />
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
};

export { FieldError };
export default FieldError;

const s = StyleSheet.create({
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  errorText: { fontFamily: Fonts.medium, fontSize: 12, color: '#EF4444' },
});
