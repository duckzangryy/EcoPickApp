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
    height: 56,
    borderRadius: BorderRadius.lg,
    position: 'relative',
  },
  shadowWrapper: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 0,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.overlayWhite,
    borderWidth: 1,
    borderColor: 'rgba(32, 105, 58, 0.1)',
    overflow: 'hidden',
    elevation: 8,
  },
  searchIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: BorderRadius.md,
  },
});
