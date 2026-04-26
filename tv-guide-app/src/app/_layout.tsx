import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const {
    prefs,
    loaded,
    toggleService,
    toggleTeam,
    toggleFavoriteSport,
    toggleTvMarket,
    clearTvMarkets,
    completeOnboarding,
    updateTeams,
  } = usePreferences();
  const insets = useSafeAreaInsets();

  if (loaded && !prefs.onboardingComplete) {
    return (
      <View style={styles.fullScreen}>
        <Onboarding
          selectedServices={prefs.selectedServices}
          onToggleService={toggleService}
          selectedTeams={prefs.favoriteTeams ?? []}
          onToggleTeam={toggleTeam}
          onFavoritesMigrated={updateTeams}
          selectedSports={prefs.favoriteSports ?? []}
          onToggleSport={toggleFavoriteSport}
          selectedMarkets={prefs.tvMarkets ?? []}
          onToggleMarket={toggleTvMarket}
          onClearMarkets={clearTvMarkets}
          onComplete={completeOnboarding}
        />
      </View>
    );
  }

  // Apple TV: avoid clipping the native tab bar / focus treatment at the top of the display.
  const tabShell =
    Platform.OS === 'ios' && Platform.isTV
      ? { flex: 1, backgroundColor: '#0D1117' as const, paddingTop: Math.max(insets.top, 8) }
      : styles.fullScreen;

  return (
    <View style={tabShell}>
      <AppTabs />
    </View>
  );
}

export default function TabLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={NavyTheme}>
        <PreferencesProvider>
          <AppContent />
        </PreferencesProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
});
