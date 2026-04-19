import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { EventCard } from './event-card';
import { SportEvent } from '@/lib/types';
import { type ResponsiveSizes } from '@/lib/constants';

interface EventRowProps {
  label: string;
  events: SportEvent[];
  userServices: string[];
  sizes: ResponsiveSizes;
  liveCount?: number;
}

export function EventRow({ label, events, userServices, sizes }: EventRowProps) {
  if (events.length === 0) return null;

  const liveCount = events.filter((e) => e.status === 'live').length;

  const dynamicStyles = useMemo(() => ({
    labelRow: { paddingHorizontal: sizes.rowPadding, marginBottom: sizes.rowPadding < 32 ? 10 : 16 },
    label: { fontSize: sizes.sectionLabelSize },
    count: { fontSize: sizes.subtitleSize + 2 },
    listContent: { paddingHorizontal: sizes.rowPadding },
  }), [sizes]);

  return (
    <View style={styles.container}>
      <View style={[styles.labelRow, dynamicStyles.labelRow]}>
        <Text style={[styles.label, dynamicStyles.label]}>{label}</Text>
        {liveCount > 0 && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>
              {liveCount} LIVE
            </Text>
          </View>
        )}
        <Text style={[styles.count, dynamicStyles.count]}>{events.length} game{events.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        horizontal
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} userServices={userServices} sizes={sizes} />
        )}
        contentContainerStyle={dynamicStyles.listContent}
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
    gap: 12,
  },
  label: {
    color: '#FFFFFF',
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
    fontWeight: '500',
  },
});
