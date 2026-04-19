import React, { useCallback, useRef } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SPORT_FILTERS, TV_SIZES } from '@/lib/constants';
import { SportCategory } from '@/lib/types';

interface SportFilterProps {
  selected: SportCategory;
  onSelect: (sport: SportCategory) => void;
}

export function SportFilter({ selected, onSelect }: SportFilterProps) {
  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={SPORT_FILTERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FilterChip
            label={item.label}
            icon={item.icon}
            isSelected={selected === item.id}
            onPress={() => onSelect(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

function FilterChip({
  label,
  icon,
  isSelected,
  onPress,
}: {
  label: string;
  icon: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFocus = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1.1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  const handleBlur = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={onPress}
        style={({ focused }) => [
          styles.chip,
          isSelected && styles.chipSelected,
          focused && styles.chipFocused,
        ]}
      >
        <Text style={styles.chipIcon}>{icon}</Text>
        <Text
          style={[
            styles.chipLabel,
            isSelected && styles.chipLabelSelected,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: TV_SIZES.filterHeight + 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: TV_SIZES.rowPadding,
    gap: 12,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#1A1F2E',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  chipSelected: {
    backgroundColor: '#FFFFFF',
  },
  chipFocused: {
    borderColor: '#FFFFFF',
  },
  chipIcon: {
    fontSize: 20,
  },
  chipLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  chipLabelSelected: {
    color: '#000000',
  },
});
