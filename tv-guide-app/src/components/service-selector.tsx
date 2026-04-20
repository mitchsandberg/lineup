import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { MAJOR_SERVICES, LEAGUE_SERVICES } from '@/data/services';
import { getSizesForWidth } from '@/lib/constants';

interface ServiceSelectorProps {
  selectedServices: string[];
  onToggle: (serviceId: string) => void;
}

export function ServiceSelector({ selectedServices, onToggle }: ServiceSelectorProps) {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 600;
  const isLandscapeMobile = Platform.OS === 'web' && width > height && height < 500;
  const isWebMobile = Platform.OS === 'web' && width < 768;
  const topPadding = isLandscapeMobile ? 8 : isWebMobile ? 80 : 80;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        isMobile && { padding: 20 },
        isLandscapeMobile && { padding: 20 },
        { paddingTop: topPadding },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.heading, isMobile && { fontSize: 26 }]}>My Streaming Services</Text>
      <Text style={styles.subheading}>
        Select the services you subscribe to. Only events available on your services will be shown.
      </Text>
      <View style={[styles.grid, isMobile && { gap: 12 }]}>
        {MAJOR_SERVICES.map((service) => (
          <ServiceToggle
            key={service.id}
            name={service.name}
            color={service.color}
            isSelected={selectedServices.includes(service.id)}
            onPress={() => onToggle(service.id)}
            compact={isMobile}
          />
        ))}
      </View>
      <Text style={styles.sectionLabel}>League Packages</Text>
      <View style={[styles.grid, isMobile && { gap: 12 }]}>
        {LEAGUE_SERVICES.map((service) => (
          <ServiceToggle
            key={service.id}
            name={service.name}
            color={service.color}
            isSelected={selectedServices.includes(service.id)}
            onPress={() => onToggle(service.id)}
            compact={isMobile}
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
  compact,
}: {
  name: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();
  const sizes = getSizesForWidth(width);

  const handleFocus = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: sizes.focusScale,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [scaleAnim, sizes.focusScale]);

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
          compact && { width: 160, height: 70, paddingHorizontal: 14 },
          isSelected && { backgroundColor: color, borderColor: color },
          focused && styles.toggleFocused,
        ]}
      >
        <Text style={[styles.checkmark, compact && { fontSize: 18, width: 24 }]}>{isSelected ? '✓' : ''}</Text>
        <Text style={[styles.serviceName, compact && { fontSize: 16 }]}>{name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 60,
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
