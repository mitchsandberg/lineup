import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { STATUS_COLORS, TV_SIZES } from '@/lib/constants';
import { SportEvent } from '@/lib/types';
import { SERVICE_MAP } from '@/data/services';
import { launchStreamingApp } from '@/lib/deep-links';

interface EventCardProps {
  event: SportEvent;
  userServices: string[];
  onPress?: () => void;
}

export function EventCard({ event, userServices, onPress }: EventCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isFocused, setIsFocused] = useState(false);

  const matchingServices = event.availableServices.filter((s) =>
    userServices.includes(s),
  );
  const primaryService = matchingServices[0];
  const primaryServiceInfo = primaryService ? SERVICE_MAP[primaryService] : null;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    Animated.spring(scaleAnim, {
      toValue: TV_SIZES.focusScale,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [scaleAnim]);

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
    if (onPress) {
      onPress();
      return;
    }
    if (primaryService) {
      launchStreamingApp(primaryService);
    }
  }, [onPress, primaryService]);

  const isLive = event.status === 'live';
  const startTime = new Date(event.startTime);
  const timeStr = startTime.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onFocus={handleFocus}
        onBlur={handleBlur}
        onPress={handlePress}
        style={({ focused }) => [
          styles.card,
          focused && styles.cardFocused,
        ]}
      >
        <View style={styles.topRow}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[event.status] }]}>
            <Text style={styles.statusText}>
              {isLive ? '● LIVE' : timeStr}
            </Text>
          </View>
          <Text style={styles.channelText}>{event.channel}</Text>
        </View>

        <View style={styles.middleRow}>
          {event.homeTeam && event.awayTeam ? (
            <>
              <View style={styles.teamRow}>
                <Text style={styles.teamName} numberOfLines={1}>{event.awayTeam}</Text>
                {event.awayScore != null && (
                  <Text style={styles.score}>{event.awayScore}</Text>
                )}
              </View>
              <View style={styles.teamRow}>
                <Text style={styles.teamName} numberOfLines={1}>{event.homeTeam}</Text>
                {event.homeScore != null && (
                  <Text style={styles.score}>{event.homeScore}</Text>
                )}
              </View>
            </>
          ) : (
            <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
          )}
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.leagueText}>{event.league}</Text>
          <View style={styles.serviceBadges}>
            {matchingServices.slice(0, 3).map((sId) => {
              const service = SERVICE_MAP[sId];
              if (!service) return null;
              return (
                <View key={sId} style={[styles.serviceBadge, { backgroundColor: service.color }]}>
                  <Text style={styles.serviceBadgeText} numberOfLines={1}>
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
            Press OK to watch on {primaryServiceInfo.name}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: TV_SIZES.cardWidth,
    height: TV_SIZES.cardHeight,
    marginRight: TV_SIZES.cardGap,
  },
  card: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    borderWidth: TV_SIZES.focusBorderWidth,
    borderColor: 'transparent',
  },
  cardFocused: {
    borderColor: TV_SIZES.focusBorderColor,
    backgroundColor: '#2C2C2E',
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
    fontSize: TV_SIZES.badgeSize,
    fontWeight: '700',
  },
  channelText: {
    color: '#8E8E93',
    fontSize: TV_SIZES.badgeSize,
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
    fontSize: TV_SIZES.titleSize,
    fontWeight: '600',
    flex: 1,
  },
  score: {
    color: '#FFFFFF',
    fontSize: TV_SIZES.titleSize,
    fontWeight: '700',
    marginLeft: 12,
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: TV_SIZES.titleSize,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leagueText: {
    color: '#8E8E93',
    fontSize: TV_SIZES.subtitleSize,
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
    fontSize: 11,
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
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
});
