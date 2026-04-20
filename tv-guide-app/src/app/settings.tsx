import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ServiceSelectorContent } from '@/components/service-selector';
import { TeamPicker } from '@/components/team-picker';
import { usePreferences } from '@/hooks/use-preferences';

export default function SettingsScreen() {
  const { prefs, toggleService, toggleTeam, toggleFavoriteSport } = usePreferences();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 600;
  const isLandscapeMobile = Platform.OS === 'web' && width > height && height < 500;
  const isWebMobile = Platform.OS === 'web' && width < 768;
  const topPadding = isLandscapeMobile ? 8 : isWebMobile ? 80 : 80;

  return (
    <View testID="settings-screen" style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
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
        <ServiceSelectorContent
          selectedServices={prefs.selectedServices}
          onToggle={toggleService}
          compact={isMobile}
        />

        <View style={styles.divider} />

        <Text style={[styles.heading, isMobile && { fontSize: 26 }]}>My Favorites</Text>
        <Text style={styles.subheading}>
          Follow sports and teams to quickly filter the guide to what you care about.
        </Text>

        <TeamPicker
          selectedTeams={prefs.favoriteTeams ?? []}
          onToggle={toggleTeam}
          selectedSports={prefs.favoriteSports ?? []}
          onToggleSport={toggleFavoriteSport}
          compact={isMobile}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollContent: {
    padding: 60,
    paddingTop: 80,
    paddingBottom: 40,
  },
  divider: {
    height: 1,
    backgroundColor: '#2D3548',
    marginTop: 32,
    marginBottom: 32,
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
    marginBottom: 24,
    lineHeight: 28,
  },
});
