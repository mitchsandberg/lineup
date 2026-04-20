import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StreamingService, SportEvent } from '@/lib/types';
import { launchStreamingApp } from '@/lib/deep-links';

interface ServicePickerModalProps {
  visible: boolean;
  services: StreamingService[];
  event: SportEvent | null;
  onClose: () => void;
}

function ServiceOption({
  service,
  onPress,
}: {
  service: StreamingService;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFocus = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1.05,
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
        testID={`service-option-${service.id}`}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={onPress}
        style={({ focused }) => [
          styles.serviceOption,
          focused && styles.serviceOptionFocused,
        ]}
      >
        <View style={[styles.serviceDot, { backgroundColor: service.color }]} />
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.launchArrow}>→</Text>
      </Pressable>
    </Animated.View>
  );
}

export function ServicePickerModal({
  visible,
  services,
  event,
  onClose,
}: ServicePickerModalProps) {
  const handleLaunch = useCallback(
    (serviceId: string) => {
      onClose();
      launchStreamingApp(serviceId);
    },
    [onClose],
  );

  const title = event?.homeTeam && event?.awayTeam
    ? `${getMascot(event.awayTeam)} vs ${getMascot(event.homeTeam)}`
    : event?.title ?? 'Watch on';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View testID="service-picker-modal" style={styles.sheet}>
          <Text style={styles.title}>Available on</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{title}</Text>

          <View style={styles.serviceList}>
            {services.map((svc) => (
              <ServiceOption
                key={svc.id}
                service={svc}
                onPress={() => handleLaunch(svc.id)}
              />
            ))}
          </View>

          <Pressable
            testID="service-picker-cancel"
            onPress={onClose}
            style={({ focused }) => [
              styles.cancelBtn,
              focused && styles.cancelBtnFocused,
            ]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

function getMascot(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: '#1A1F2E',
    borderRadius: 20,
    padding: 28,
    width: 400,
    maxWidth: '90%',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#8B95A5',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  serviceList: {
    gap: 10,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252D3D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceOptionFocused: {
    borderColor: '#FFFFFF',
    backgroundColor: '#2D3A50',
  },
  serviceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
  },
  serviceName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  launchArrow: {
    color: '#8B95A5',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cancelBtnFocused: {
    borderColor: '#FFFFFF',
  },
  cancelText: {
    color: '#8B95A5',
    fontSize: 16,
    fontWeight: '600',
  },
});
