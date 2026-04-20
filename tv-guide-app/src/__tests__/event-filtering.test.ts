import { filterEvents } from '@/lib/api';
import { SportEvent } from '@/lib/types';

function makeEvent(overrides: Partial<SportEvent> = {}): SportEvent {
  return {
    id: 'test-1',
    title: 'Test Event',
    sport: 'nba',
    league: 'NBA',
    channel: 'ESPN',
    startTime: new Date().toISOString(),
    status: 'live',
    availableServices: ['youtube-tv', 'hulu-live'],
    ...overrides,
  };
}

describe('Event filtering', () => {
  const events: SportEvent[] = [
    makeEvent({ id: 'nba-1', sport: 'nba', availableServices: ['youtube-tv', 'hulu-live'] }),
    makeEvent({ id: 'nfl-1', sport: 'nfl', availableServices: ['youtube-tv', 'peacock'] }),
    makeEvent({ id: 'mlb-1', sport: 'mlb', availableServices: ['espn-plus'] }),
    makeEvent({ id: 'soccer-1', sport: 'soccer', availableServices: ['peacock'] }),
    makeEvent({ id: 'nhl-1', sport: 'nhl', availableServices: ['prime-video'] }),
    makeEvent({ id: 'nba-2', sport: 'nba', availableServices: ['apple-tv'] }),
    makeEvent({ id: 'no-service', sport: 'mma', availableServices: [] }),
  ];

  describe('sport filtering', () => {
    it('"all" shows all events', () => {
      const result = filterEvents(events, 'all', ['youtube-tv', 'hulu-live', 'espn-plus', 'peacock', 'prime-video', 'apple-tv']);
      expect(result).toHaveLength(events.length);
    });

    it('filters to NBA only', () => {
      const result = filterEvents(events, 'nba', ['youtube-tv', 'hulu-live', 'apple-tv']);
      expect(result.every((e) => e.sport === 'nba')).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('filters to NFL only', () => {
      const result = filterEvents(events, 'nfl', ['youtube-tv', 'peacock']);
      expect(result.every((e) => e.sport === 'nfl')).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('returns empty when no events match sport', () => {
      const result = filterEvents(events, 'golf', ['youtube-tv']);
      expect(result).toHaveLength(0);
    });
  });

  describe('service filtering', () => {
    it('only shows events available on selected services', () => {
      const result = filterEvents(events, 'all', ['peacock']);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('nfl-1');
      expect(ids).toContain('soccer-1');
      expect(ids).not.toContain('nba-1');
      expect(ids).not.toContain('mlb-1');
      expect(ids).not.toContain('nhl-1');
    });

    it('shows events from multiple selected services', () => {
      const result = filterEvents(events, 'all', ['youtube-tv', 'espn-plus']);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('nba-1');
      expect(ids).toContain('nfl-1');
      expect(ids).toContain('mlb-1');
    });

    it('events with empty availableServices always show', () => {
      const result = filterEvents(events, 'all', ['youtube-tv']);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('no-service');
    });

    it('returns only channel-unknown events when no services selected', () => {
      const result = filterEvents(events, 'all', []);
      expect(result.every((e) => e.availableServices.length === 0)).toBe(true);
    });
  });

  describe('combined sport + service filtering', () => {
    it('NBA + youtube-tv shows NBA events on YouTube TV', () => {
      const result = filterEvents(events, 'nba', ['youtube-tv']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('nba-1');
    });

    it('NBA + apple-tv shows NBA events on Apple TV', () => {
      const result = filterEvents(events, 'nba', ['apple-tv']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('nba-2');
    });

    it('NBA + prime-video returns empty (no NBA on Prime)', () => {
      const result = filterEvents(events, 'nba', ['prime-video']);
      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty events array', () => {
      expect(filterEvents([], 'all', ['youtube-tv'])).toEqual([]);
    });

    it('handles event available on many services', () => {
      const multiService = [
        makeEvent({
          id: 'multi',
          availableServices: ['youtube-tv', 'hulu-live', 'espn-plus', 'peacock', 'prime-video'],
        }),
      ];
      const result = filterEvents(multiService, 'all', ['prime-video']);
      expect(result).toHaveLength(1);
    });
  });
});
