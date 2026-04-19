import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MAJOR_SERVICES, LEAGUE_SERVICES } from '@/data/services';
import { TV_SIZES } from '@/lib/constants';

interface ServiceSelectorProps {
  selectedServices: string[];
  onToggle: (serviceId: string) => void;
}

export function ServiceSelector({ selectedServices, onToggle }: ServiceSelectorProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>My Streaming Services</Text>
      <Text style={styles.subheading}>
        Select the services you subscribe to. Only events available on your services will be shown.
      </Text>
      <View style={styles.grid}>
        {MAJOR_SERVICES.map((service) => (
          <ServiceToggle
            key={service.id}
            name={service.name}
            color={service.color}
            isSelected={selectedServices.includes(service.id)}
            onPress={() => onToggle(service.id)}
          />
        ))}
      </View>
      <Text style={styles.sectionLabel}>League Packages</Text>
      <View style={styles.grid}>
        {LEAGUE_SERVICES.map((service) => (
          <ServiceToggle
            key={service.id}
            name={service.name}
            color={service.color}
            isSelected={selectedServices.includes(service.id)}
            onPress={() => onToggle(service.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function ServiceToggle({
  name,
  color,
  isSelected,
  onPress,
}: {
  name: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFocus = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: TV_SIZES.focusScale,
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
          styles.toggle,
          isSelected && { backgroundColor: color, borderColor: color },
          focused && styles.toggleFocused,
        ]}
      >
        <Text style={styles.checkmark}>{isSelected ? '✓' : ''}</Text>
        <Text style={styles.serviceName}>{name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: TV_SIZES.rowPadding,
    paddingTop: 80,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
  },
  subheading: {
    color: '#8B95A5',
    fontSize: 20,
    marginBottom: 32,
    lineHeight: 28,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 16,
  },
  toggle: {
    width: 280,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#1A1F2E',
    borderWidth: 3,
    borderColor: '#2D3548',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  toggleFocused: {
    borderColor: '#FFFFFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    width: 30,
  },
  serviceName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    flex: 1,
  },
});
