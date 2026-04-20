import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { EventRow } from '@/components/event-row';
import { SportFilter } from '@/components/sport-filter';
import { ServicePickerModal } from '@/components/service-picker-modal';
import { fetchEvents, filterEvents, groupEventsByTime, groupEventsBySport } from '@/lib/api';
import { GroupedEvents, SportEvent, StreamingService } from '@/lib/types';
import { usePreferences } from '@/hooks/use-preferences';
import { useResponsive } from '@/hooks/use-responsive';

export default function GuideScreen() {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerServices, setPickerServices] = useState<StreamingService[]>([]);
  const [pickerEvent, setPickerEvent] = useState<SportEvent | null>(null);
  const { prefs, setSport, loaded } = usePreferences();
  const sizes = useResponsive();
  const { width, height } = useWindowDimensions();
  const isWebMobile = Platform.OS === 'web' && width < 768;
  const isLandscape = width > height;

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

  const filteredEvents = filterEvents(events, prefs.selectedSport, prefs.selectedServices);

  const grouped: GroupedEvents[] = prefs.selectedSport === 'all'
    ? groupEventsBySport(filteredEvents)
    : groupEventsByTime(filteredEvents);

  const isMobile = sizes.rowPadding < 32;

  const landscapeMobile = Platform.OS === 'web' && isLandscape && height < 500;
  const tabBarHeight = isWebMobile && !landscapeMobile ? 72 : 0;

  const dynamicStyles = useMemo(() => ({
    header: {
      paddingHorizontal: sizes.rowPadding,
      paddingTop: landscapeMobile ? 8 : isMobile ? (tabBarHeight + 8) : 80,
      paddingBottom: isMobile ? 8 : 16,
    },
    headerTitle: { fontSize: isMobile ? 28 : 42 },
    headerSubtitle: { fontSize: isMobile ? 16 : 22 },
    emptyText: { fontSize: isMobile ? 22 : 28 },
    emptySubtext: { fontSize: isMobile ? 16 : 20 },
    emptyIcon: { width: isMobile ? 60 : 80, height: isMobile ? 60 : 80, borderRadius: isMobile ? 30 : 40 },
    emptyIconText: { fontSize: isMobile ? 28 : 36 },
  }), [sizes, isMobile, tabBarHeight, landscapeMobile]);

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
    <SportFilter selected={prefs.selectedSport} onSelect={setSport} sizes={sizes} />
  );

  const eventContent = grouped.length === 0 ? (
    <View style={styles.emptyContainer}>
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

  const useFullScroll = Platform.OS === 'web' && isLandscape && height < 500;

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
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
  scrollPadding: {
    height: 120,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
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
    paddingBottom: 80,
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
});
