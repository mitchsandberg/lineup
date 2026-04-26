import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EventRow } from '@/components/event-row';
import { SportFilter } from '@/components/sport-filter';
import { ServicePickerModal } from '@/components/service-picker-modal';
import { fetchEvents, filterEvents, groupEventsByTime, groupEventsBySport } from '@/lib/api';
import { GroupedEvents, SportEvent, StreamingService } from '@/lib/types';
import { usePreferences } from '@/hooks/use-preferences';
import { useResponsive } from '@/hooks/use-responsive';
import { enrichEventWithRSN } from '@/lib/rsn';

const useTVEventHandler = Platform.isTV
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native').useTVEventHandler
  : (_: unknown) => {};

export default function GuideScreen() {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerServices, setPickerServices] = useState<StreamingService[]>([]);
  const [pickerEvent, setPickerEvent] = useState<SportEvent | null>(null);
  const [showMyTeams, setShowMyTeams] = useState(false);
  const [teamToggleFocused, setTeamToggleFocused] = useState(false);
  const { prefs, setSport, loaded } = usePreferences();
  const sizes = useResponsive();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isWebMobile = Platform.OS === 'web' && width < 768;
  const isLandscape = width > height;
  const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

  const showServicePicker = useCallback((services: StreamingService[], event: SportEvent) => {
    setPickerServices(services);
    setPickerEvent(event);
    setPickerVisible(true);
  }, []);

  const hideServicePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
      console.warn(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 60_000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  const enrichedEvents = useMemo(
    () => events.map((e) => enrichEventWithRSN(e, prefs.tvMarkets ?? [])),
    [events, prefs.tvMarkets],
  );

  const hasFavorites = (prefs.favoriteTeams ?? []).length > 0 || (prefs.favoriteSports ?? []).length > 0;
  const activeTeamFilter = showMyTeams && hasFavorites ? (prefs.favoriteTeams ?? []) : undefined;
  const activeSportFilter = showMyTeams && hasFavorites ? (prefs.favoriteSports ?? []) : undefined;
  const filteredEvents = filterEvents(enrichedEvents, prefs.selectedSport, prefs.selectedServices, activeTeamFilter, activeSportFilter);

  const grouped: GroupedEvents[] = prefs.selectedSport === 'all'
    ? groupEventsBySport(filteredEvents)
    : groupEventsByTime(filteredEvents);

  useTVEventHandler((event: { eventType?: string; eventKeyAction?: number }) => {
    if (!teamToggleFocused) return;
    if (event.eventKeyAction !== 1) return;
    if (event.eventType === 'left') setShowMyTeams(false);
    if (event.eventType === 'right') setShowMyTeams(true);
  });

  const isMobile = sizes.rowPadding < 32;

  const landscapeMobile = Platform.OS === 'web' && isLandscape && height < 500;
  const tabBarHeight = isWebMobile && !landscapeMobile ? 72 : 0;

  const dynamicStyles = useMemo(() => ({
    header: {
      paddingHorizontal: sizes.rowPadding,
      paddingTop: landscapeMobile
        ? 8
        : isNativeMobile && !Platform.isTV
          ? insets.top + 8
          : isMobile
            ? tabBarHeight + 8
            : 80,
      paddingBottom: isMobile ? 8 : 16,
    },
    headerTitle: { fontSize: isMobile ? 28 : 42 },
    headerSubtitle: { fontSize: isMobile ? 16 : 22 },
    emptyText: { fontSize: isMobile ? 22 : 28 },
    emptySubtext: { fontSize: isMobile ? 16 : 20 },
    emptyIcon: { width: isMobile ? 60 : 80, height: isMobile ? 60 : 80, borderRadius: isMobile ? 30 : 40 },
    emptyIconText: { fontSize: isMobile ? 28 : 36 },
    emptyContainer: { paddingBottom: landscapeMobile ? 0 : isMobile ? 20 : 120 },
  }), [sizes, isMobile, tabBarHeight, landscapeMobile, isNativeMobile, insets.top]);

  if (!loaded || loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading sports...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const headerBlock = (
    <View testID="guide-header" style={[styles.header, dynamicStyles.header]}>
      <Text style={[styles.headerTitle, dynamicStyles.headerTitle]}>Lineup</Text>
      <Text testID="guide-date" style={[styles.headerSubtitle, dynamicStyles.headerSubtitle]}>
        {new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </Text>
    </View>
  );

  const filterBlock = (
    <>
      <SportFilter selected={prefs.selectedSport} onSelect={setSport} sizes={sizes} />
      {hasFavorites && (
        <View testID="team-toggle" style={[styles.teamToggleRow, { paddingHorizontal: sizes.rowPadding }]}>
          {Platform.isTV ? (
            <Pressable
              testID="team-toggle-my"
              accessibilityRole="switch"
              accessibilityState={{ checked: showMyTeams }}
              accessibilityLabel="Show my favorites"
              onPress={() => setShowMyTeams((current) => !current)}
              onFocus={() => setTeamToggleFocused(true)}
              onBlur={() => setTeamToggleFocused(false)}
              style={({ focused }) => [
                styles.tvTeamSegmentToggle,
                focused && styles.tvTeamSegmentToggleFocused,
              ]}
            >
              <View style={[styles.tvTeamSegment, !showMyTeams && styles.tvTeamSegmentActive]}>
                <Text style={[styles.tvTeamSegmentText, !showMyTeams && styles.tvTeamSegmentTextActive]}>
                  All Sports
                </Text>
              </View>
              <View style={[styles.tvTeamSegment, showMyTeams && styles.tvTeamSegmentActive]}>
                <Text style={[styles.tvTeamSegmentText, showMyTeams && styles.tvTeamSegmentTextActive]}>
                  My Favorites
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.teamToggle}>
              <Pressable
                testID="team-toggle-all"
                onPress={() => setShowMyTeams(false)}
                style={[
                  styles.teamToggleBtn,
                  isMobile && styles.teamToggleBtnCompact,
                  !showMyTeams && styles.teamToggleBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.teamToggleText,
                    isMobile && { fontSize: 12 },
                    !showMyTeams && styles.teamToggleTextActive,
                  ]}
                >
                  All Games
                </Text>
              </Pressable>
              <Pressable
                testID="team-toggle-my"
                onPress={() => setShowMyTeams(true)}
                style={[
                  styles.teamToggleBtn,
                  isMobile && styles.teamToggleBtnCompact,
                  showMyTeams && styles.teamToggleBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.teamToggleText,
                    isMobile && { fontSize: 12 },
                    showMyTeams && styles.teamToggleTextActive,
                  ]}
                >
                  My Favorites
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </>
  );

  const eventContent = grouped.length === 0 ? (
    <View style={[styles.emptyContainer, dynamicStyles.emptyContainer]}>
      <View style={[styles.emptyIconContainer, dynamicStyles.emptyIcon]}>
        <Text style={[styles.emptyIconText, dynamicStyles.emptyIconText]}>—</Text>
      </View>
      <Text style={[styles.emptyText, dynamicStyles.emptyText]}>No games right now</Text>
      <Text style={[styles.emptySubtext, dynamicStyles.emptySubtext]}>
        {prefs.selectedSport !== 'all'
          ? 'Try selecting a different sport or check back later'
          : 'When games are on, just press select to start watching — Lineup opens the right app for you'}
      </Text>
    </View>
  ) : (
    <>
      {grouped.map((group) => (
        <EventRow
          key={group.group}
          label={group.label}
          events={group.events}
          userServices={prefs.selectedServices}
          sizes={sizes}
          onShowServicePicker={showServicePicker}
        />
      ))}
      <View style={styles.scrollPadding} />
    </>
  );

  const useFullScroll = Platform.OS === 'web' && isLandscape && height < 500 && grouped.length > 0;
  const isEmpty = grouped.length === 0;

  return (
    <View testID="guide-screen" style={styles.container}>
      {useFullScroll ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {headerBlock}
          {filterBlock}
          {eventContent}
        </ScrollView>
      ) : (
        <>
          {headerBlock}
          {filterBlock}
          <ScrollView style={styles.scrollView} contentContainerStyle={isEmpty ? styles.scrollViewCentered : undefined} showsVerticalScrollIndicator={false}>
            {eventContent}
          </ScrollView>
        </>
      )}

      <ServicePickerModal
        visible={pickerVisible}
        services={pickerServices}
        event={pickerEvent}
        onClose={hideServicePicker}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    ...(Platform.OS === 'web' ? { height: '100vh' as unknown as number } : {}),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#8B95A5',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewCentered: {
    flexGrow: 1,
  },
  scrollPadding: {
    height: 120,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  loadingText: {
    color: '#8B95A5',
    fontSize: 22,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyIconContainer: {
    borderWidth: 2,
    borderColor: '#2D3548',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyIconText: {
    color: '#4A5568',
    fontWeight: '300',
  },
  emptyText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#8B95A5',
    textAlign: 'center',
    maxWidth: 400,
  },
  teamToggleRow: {
    marginBottom: 8,
  },
  teamToggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    backgroundColor: '#1A1F2E',
    borderRadius: 20,
    padding: 3,
    marginRight: 20,
  },
  teamToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamToggleBtnCompact: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  teamToggleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  teamToggleBtnFocused: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  teamToggleText: {
    color: '#8B95A5',
    fontSize: 14,
    fontWeight: '600',
  },
  teamToggleTextActive: {
    color: '#000000',
  },
  tvTeamSegmentToggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F2E',
    borderRadius: 26,
    borderWidth: 3,
    borderColor: 'transparent',
    padding: 3,
  },
  tvTeamSegmentToggleFocused: {
    borderColor: '#FFFFFF',
  },
  tvTeamSegment: {
    minWidth: 150,
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  tvTeamSegmentActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111827',
  },
  tvTeamSegmentText: {
    color: '#B8C0D0',
    fontSize: 18,
    fontWeight: '700',
  },
  tvTeamSegmentTextActive: {
    color: '#111827',
  },
});
