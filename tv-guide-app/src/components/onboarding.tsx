import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { STREAMING_SERVICES } from '@/data/services';
import { TV_SIZES } from '@/lib/constants';

interface OnboardingProps {
  selectedServices: string[];
  onToggleService: (serviceId: string) => void;
  onComplete: () => void;
}

export function Onboarding({ selectedServices, onToggleService, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);

  if (step === 0) {
    return <WelcomeStep onNext={() => setStep(1)} />;
  }

  return (
    <ServicePickerStep
      selectedServices={selectedServices}
      onToggle={onToggleService}
      onComplete={onComplete}
    />
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const btnScale = useRef(new Animated.Value(1)).current;

  return (
    <View style={styles.screen}>
      <View style={styles.welcomeContent}>
        <Text style={styles.logoText}>Lineup</Text>
        <Text style={styles.tagline}>Live Sports TV Guide</Text>

        <View style={styles.featureList}>
          <FeatureRow
            number="1"
            title="See what's on"
            desc="Live and upcoming games across all your streaming services"
          />
          <FeatureRow
            number="2"
            title="Tap to watch"
            desc="Press select on any game to instantly open the right streaming app"
          />
          <FeatureRow
            number="3"
            title="Never miss a game"
            desc="NFL, NBA, MLB, NHL, Soccer, and more — all in one place"
          />
        </View>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            onPress={onNext}
            onFocus={() =>
              Animated.spring(btnScale, {
                toValue: 1.05,
                useNativeDriver: true,
                friction: 8,
              }).start()
            }
            onBlur={() =>
              Animated.spring(btnScale, {
                toValue: 1,
                useNativeDriver: true,
                friction: 8,
              }).start()
            }
            style={({ focused }) => [
              styles.ctaButton,
              focused && styles.ctaButtonFocused,
            ]}
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function FeatureRow({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureNumber}>
        <Text style={styles.featureNumberText}>{number}</Text>
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </View>
  );
}

function ServicePickerStep({
  selectedServices,
  onToggle,
  onComplete,
}: {
  selectedServices: string[];
  onToggle: (id: string) => void;
  onComplete: () => void;
}) {
  const btnScale = useRef(new Animated.Value(1)).current;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.pickerContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Pick your streaming services</Text>
        <Text style={styles.stepSubtitle}>
          Lineup will only show games available on your services. You can change this anytime in Settings.
        </Text>

        <View style={styles.serviceGrid}>
          {STREAMING_SERVICES.map((service) => (
            <ServiceChip
              key={service.id}
              name={service.name}
              color={service.color}
              isSelected={selectedServices.includes(service.id)}
              onPress={() => onToggle(service.id)}
            />
          ))}
        </View>

        <Text style={styles.selectedCount}>
          {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
        </Text>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable
            onPress={onComplete}
            onFocus={() =>
              Animated.spring(btnScale, {
                toValue: 1.05,
                useNativeDriver: true,
                friction: 8,
              }).start()
            }
            onBlur={() =>
              Animated.spring(btnScale, {
                toValue: 1,
                useNativeDriver: true,
                friction: 8,
              }).start()
            }
            style={({ focused }) => [
              styles.ctaButton,
              focused && styles.ctaButtonFocused,
              selectedServices.length === 0 && styles.ctaButtonDisabled,
            ]}
            disabled={selectedServices.length === 0}
          >
            <Text style={styles.ctaText}>
              {selectedServices.length === 0 ? 'Select at least one' : "Let\u2019s go"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function ServiceChip({
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

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onFocus={() =>
          Animated.spring(scaleAnim, {
            toValue: TV_SIZES.focusScale,
            useNativeDriver: true,
            friction: 8,
          }).start()
        }
        onBlur={() =>
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
          }).start()
        }
        style={({ focused }) => [
          styles.chip,
          isSelected && { backgroundColor: color, borderColor: color },
          focused && styles.chipFocused,
        ]}
      >
        <Text style={styles.chipCheck}>{isSelected ? '✓' : ''}</Text>
        <Text style={styles.chipName}>{name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 64,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: '#8E8E93',
    fontSize: 24,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 48,
  },
  featureList: {
    width: '100%',
    maxWidth: 600,
    gap: 24,
    marginBottom: 48,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  featureNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureNumberText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    color: '#8E8E93',
    fontSize: 17,
    lineHeight: 24,
  },
  pickerContent: {
    paddingHorizontal: 60,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepSubtitle: {
    color: '#8E8E93',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 36,
    maxWidth: 550,
    lineHeight: 26,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  chip: {
    width: 220,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    borderWidth: 3,
    borderColor: '#3A3A3C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  chipFocused: {
    borderColor: '#FFFFFF',
  },
  chipCheck: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    width: 26,
  },
  chipName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  selectedCount: {
    color: '#8E8E93',
    fontSize: 16,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  ctaButtonFocused: {
    backgroundColor: '#E5E5E5',
    borderColor: '#4DA6FF',
  },
  ctaButtonDisabled: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  ctaText: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
