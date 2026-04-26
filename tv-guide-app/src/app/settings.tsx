import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ServiceSelectorContent } from '@/components/service-selector';
import { TeamPicker } from '@/components/team-picker';
import { MarketPicker } from '@/components/market-picker';
import { FeedbackSection } from '@/components/feedback-section';
import { DeepLinkDevPanel } from '@/components/deep-link-dev-panel';
import { usePreferences } from '@/hooks/use-preferences';

export default function SettingsScreen() {
  const { prefs, toggleService, toggleTeam, updateTeams, toggleFavoriteSport, toggleTvMarket, clearTvMarkets } = usePreferences();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 600;
  const isLandscapeMobile = Platform.OS === 'web' && width > height && height < 500;
  const isWebMobile = Platform.OS === 'web' && width < 768;
  const isNativeMobile = (Platform.OS === 'ios' || Platform.OS === 'android') && !Platform.isTV;
  const topPadding = isLandscapeMobile
    ? 8
    : isNativeMobile
      ? insets.top + 8
      : isWebMobile
        ? 80
        : 80;

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

        <Text style={[styles.heading, isMobile && { fontSize: 26 }]}>TV Markets</Text>
        <Text style={styles.subheading}>
          Select your local TV markets to see regional sports networks and local channels.
        </Text>

        <MarketPicker
          selectedMarkets={prefs.tvMarkets ?? []}
          onToggle={toggleTvMarket}
          onClear={clearTvMarkets}
          compact={isMobile}
        />

        <View style={styles.divider} />

        <Text style={[styles.heading, isMobile && { fontSize: 26 }]}>My Favorites</Text>
        <Text style={styles.subheading}>
          Pick whole sports, specific teams, or both. Nothing is selected until you turn it on.
        </Text>

        <TeamPicker
          selectedTeams={prefs.favoriteTeams ?? []}
          onToggle={toggleTeam}
          onFavoritesMigrated={updateTeams}
          selectedSports={prefs.favoriteSports ?? []}
          onToggleSport={toggleFavoriteSport}
          compact={isMobile}
        />

        <View style={styles.divider} />

        {__DEV__ && (
          <>
            <DeepLinkDevPanel />
            <View style={styles.divider} />
          </>
        )}

        <Text style={[styles.heading, isMobile && { fontSize: 26 }]}>Questions or Suggestions?</Text>
        <FeedbackSection compact={isMobile} />
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
