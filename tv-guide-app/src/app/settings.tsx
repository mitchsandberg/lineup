import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ServiceSelector } from '@/components/service-selector';
import { usePreferences } from '@/hooks/use-preferences';

export default function SettingsScreen() {
  const { prefs, toggleService } = usePreferences();

  return (
    <View testID="settings-screen" style={styles.container}>
      <ServiceSelector
        selectedServices={prefs.selectedServices}
        onToggle={toggleService}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
});
