import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EventCard } from './event-card';
import { SportEvent } from '@/lib/types';
import { TV_SIZES } from '@/lib/constants';

interface EventRowProps {
  label: string;
  events: SportEvent[];
  userServices: string[];
  liveCount?: number;
}

export function EventRow({ label, events, userServices }: EventRowProps) {
  if (events.length === 0) return null;

  const liveCount = events.filter((e) => e.status === 'live').length;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {liveCount > 0 && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>
              {liveCount} LIVE
            </Text>
          </View>
        )}
        <Text style={styles.count}>{events.length} game{events.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        horizontal
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} userServices={userServices} />
        )}
        contentContainerStyle={styles.listContent}
        showsHorizontalScrollIndicator={false}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
    overflow: 'visible',
  },
  list: {
    overflow: 'visible',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: TV_SIZES.rowPadding,
    marginBottom: 16,
    gap: 12,
  },
  label: {
    color: '#FFFFFF',
    fontSize: TV_SIZES.sectionLabelSize,
    fontWeight: '700',
  },
  liveBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  count: {
    color: '#4A5568',
    fontSize: 18,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: TV_SIZES.rowPadding,
  },
});
