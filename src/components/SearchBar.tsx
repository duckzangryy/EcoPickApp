import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes, BorderRadius } from '../constants';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  onFocus?: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  onFocus,
  placeholder,
}: SearchBarProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.shadowWrapper} />
      <TouchableOpacity
        style={styles.inner}
        activeOpacity={0.9}
        onPress={onFocus}
      >
        <Ionicons name="search-outline" size={18} color={Colors.textPlaceholder} style={styles.searchIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || t('search.placeholder')}
          placeholderTextColor={Colors.textPlaceholder}
          style={styles.input}
          onFocus={onFocus}
          editable={!onFocus} // When onFocus is provided, tapping opens the overlay instead
          pointerEvents={onFocus ? 'none' : 'auto'}
        />
        <TouchableOpacity onPress={onFilterPress} style={styles.filterButton} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 54,
    borderRadius: 20,
    position: 'relative',
  },
  shadowWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  searchIcon: {
    marginLeft: 18,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
});
