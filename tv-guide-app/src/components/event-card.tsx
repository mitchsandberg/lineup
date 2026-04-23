import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { STATUS_COLORS, type ResponsiveSizes } from '@/lib/constants';
import { SportEvent, StreamingService } from '@/lib/types';
import { SERVICE_MAP } from '@/data/services';
import { launchStreamingApp } from '@/lib/deep-links';
import { formatEventTime } from '@/lib/api';

function getMascotName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
}

interface EventCardProps {
  event: SportEvent;
  userServices: string[];
  sizes: ResponsiveSizes;
  onPress?: () => void;
  onShowServicePicker?: (services: StreamingService[], event: SportEvent) => void;
}

export function EventCard({ event, userServices, sizes, onPress, onShowServicePicker }: EventCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressableRef = useRef<View>(null);
  const [isFocused, setIsFocused] = useState(false);

  const matchingServices = event.availableServices.filter((s) =>
    userServices.includes(s),
  );
  const primaryService = matchingServices[0];
  const primaryServiceInfo = primaryService ? SERVICE_MAP[primaryService] : null;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.spring(scaleAnim, {
      toValue: sizes.focusScale,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [scaleAnim, sizes.focusScale]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    setIsFocused(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();

    if (Platform.OS === 'web' && pressableRef.current) {
      (pressableRef.current as unknown as HTMLElement).blur?.();
    }

    if (onPress) {
      onPress();
      return;
    }

    const resolved = matchingServices.map((id) => SERVICE_MAP[id]).filter(Boolean);
    /**
     * Always surface the provider sheet when we have any matching service and a picker handler
     * is wired up. Even with a single provider, we want the user to confirm before we deep-link
     * into a third-party app — otherwise tapping a card "jumps out" of Lineup unexpectedly.
     * (The Roku app is its own codebase and does not run this path.)
     */
    if (resolved.length >= 1 && onShowServicePicker) {
      onShowServicePicker(resolved, event);
      return;
    }

    if (primaryService) {
      launchStreamingApp(primaryService);
    }
  }, [onPress, primaryService, matchingServices, event, onShowServicePicker, scaleAnim]);

  const isLive = event.status === 'live';
  const timeStr = formatEventTime(event.startTime);

  const dynamicStyles = useMemo(() => ({
    wrapper: { width: sizes.cardWidth, marginRight: sizes.cardGap },
    card: { height: sizes.cardHeight, borderWidth: sizes.focusBorderWidth, padding: sizes.cardWidth < 300 ? 14 : 20 },
    cardFocused: { borderColor: sizes.focusBorderColor },
    statusText: { fontSize: sizes.badgeSize },
    channelText: { fontSize: sizes.badgeSize },
    teamName: { fontSize: sizes.titleSize },
    score: { fontSize: sizes.titleSize },
    eventTitle: { fontSize: sizes.titleSize },
    leagueText: { fontSize: sizes.subtitleSize },
    serviceBadgeText: { fontSize: sizes.cardWidth < 300 ? 9 : 11 },
  }), [sizes]);

  return (
    <Animated.View testID={`event-card-${event.id}`} style={[dynamicStyles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        ref={pressableRef}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={handlePress}
        style={({ focused }) => [
          styles.card,
          dynamicStyles.card,
          focused && [styles.cardFocused, dynamicStyles.cardFocused],
        ]}
      >
        <View style={styles.topRow}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[event.status] }]}>
            <Text style={[styles.statusText, dynamicStyles.statusText]}>
              {isLive ? '● LIVE' : timeStr}
            </Text>
          </View>
          <Text style={[styles.channelText, dynamicStyles.channelText]}>{event.channel}</Text>
        </View>

        <View style={styles.middleRow}>
          {event.homeTeam && event.awayTeam ? (
            <>
              <View style={styles.teamRow}>
                <Text style={[styles.teamName, dynamicStyles.teamName]} numberOfLines={1}>{getMascotName(event.awayTeam)}</Text>
                {event.awayScore != null && (
                  <Text style={[styles.score, dynamicStyles.score]}>{event.awayScore}</Text>
                )}
              </View>
              <View style={styles.teamRow}>
                <Text style={[styles.teamName, dynamicStyles.teamName]} numberOfLines={1}>{getMascotName(event.homeTeam)}</Text>
                {event.homeScore != null && (
                  <Text style={[styles.score, dynamicStyles.score]}>{event.homeScore}</Text>
                )}
              </View>
            </>
          ) : (
            <Text style={[styles.eventTitle, dynamicStyles.eventTitle]} numberOfLines={2}>{event.title}</Text>
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text style={[styles.leagueText, dynamicStyles.leagueText]}>{event.league}</Text>
          <View style={styles.serviceBadges}>
            {matchingServices.slice(0, 3).map((sId) => {
              const service = SERVICE_MAP[sId];
              if (!service) return null;
              return (
                <View key={sId} style={[styles.serviceBadge, { backgroundColor: service.color }]}>
                  <Text style={[styles.serviceBadgeText, dynamicStyles.serviceBadgeText]} numberOfLines={1}>
                    {service.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </Pressable>
      {isFocused && primaryServiceInfo && (
        <View style={styles.watchHint}>
          <View style={[styles.watchHintDot, { backgroundColor: primaryServiceInfo.color }]} />
          <Text style={styles.watchHintText} numberOfLines={1}>
            {matchingServices.length > 1
              ? `Watch on ${primaryServiceInfo.name} +${matchingServices.length - 1} more`
              : `Watch on ${primaryServiceInfo.name}`}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1F2E',
    borderRadius: 16,
    justifyContent: 'space-between',
    borderColor: 'transparent',
  },
  cardFocused: {
    backgroundColor: '#252D3D',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  channelText: {
    color: '#8B95A5',
    fontWeight: '600',
  },
  middleRow: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamName: {
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  score: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 12,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueText: {
    color: '#8B95A5',
    fontWeight: '500',
  },
  serviceBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  serviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  serviceBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  watchHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  watchHintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  watchHintText: {
    color: '#8B95A5',
    fontSize: 13,
    fontWeight: '500',
  },
});
