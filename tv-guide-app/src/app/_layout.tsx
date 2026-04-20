import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppTabs from '@/components/app-tabs';
import { Onboarding } from '@/components/onboarding';
import { PreferencesProvider, usePreferences } from '@/hooks/use-preferences';

const NavyTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0D1117',
    card: '#1A1F2E',
    border: '#2D3548',
  },
};

function AppContent() {
  const { prefs, loaded, toggleService, toggleTeam, toggleFavoriteSport, completeOnboarding } = usePreferences();

  if (loaded && !prefs.onboardingComplete) {
    return (
      <View style={styles.fullScreen}>
        <Onboarding
          selectedServices={prefs.selectedServices}
          onToggleService={toggleService}
          selectedTeams={prefs.favoriteTeams ?? []}
          onToggleTeam={toggleTeam}
          selectedSports={prefs.favoriteSports ?? []}
          onToggleSport={toggleFavoriteSport}
          onComplete={completeOnboarding}
        />
      </View>
    );
  }

  return <AppTabs />;
}

export default function TabLayout() {
  return (
    <ThemeProvider value={NavyTheme}>
      <PreferencesProvider>
        <AppContent />
      </PreferencesProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
});
