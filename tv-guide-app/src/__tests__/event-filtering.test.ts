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

  describe('favoriteTeams filtering', () => {
    const teamEvents: SportEvent[] = [
      makeEvent({ id: 'e1', sport: 'nba', homeTeamId: '2', awayTeamId: '13', availableServices: ['youtube-tv'] }),
      makeEvent({ id: 'e2', sport: 'nba', homeTeamId: '5', awayTeamId: '8', availableServices: ['youtube-tv'] }),
      makeEvent({ id: 'e3', sport: 'mlb', homeTeamId: '7', awayTeamId: '10', availableServices: ['youtube-tv'] }),
      makeEvent({ id: 'e4', sport: 'mma', availableServices: ['espn-plus'] }),
    ];

    it('no favoriteTeams param shows all events', () => {
      const result = filterEvents(teamEvents, 'all', ['youtube-tv', 'espn-plus']);
      expect(result).toHaveLength(4);
    });

    it('empty favoriteTeams array shows all events', () => {
      const result = filterEvents(teamEvents, 'all', ['youtube-tv', 'espn-plus'], []);
      expect(result).toHaveLength(4);
    });

    it('filters to only events matching favorite team IDs (namespaced)', () => {
      const result = filterEvents(teamEvents, 'all', ['youtube-tv', 'espn-plus'], ['nba:2']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e1');
    });

    it('matches both home and away team IDs', () => {
      const result = filterEvents(teamEvents, 'all', ['youtube-tv', 'espn-plus'], ['nba:13']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('e1');
    });

    it('multiple favorite teams match multiple events', () => {
      const result = filterEvents(teamEvents, 'all', ['youtube-tv', 'espn-plus'], ['nba:2', 'mlb:7']);
      expect(result).toHaveLength(2);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('e1');
      expect(ids).toContain('e3');
    });

    it('events without team IDs are excluded when favoriteTeams is active', () => {
      const result = filterEvents(teamEvents, 'all', ['youtube-tv', 'espn-plus'], ['999']);
      expect(result).toHaveLength(0);
    });

    it('combines with sport filter', () => {
      const result = filterEvents(teamEvents, 'nba', ['youtube-tv'], ['nba:2', 'nba:5']);
      expect(result).toHaveLength(2);
    });

    it('combines sport + team + service filters together', () => {
      const result = filterEvents(teamEvents, 'nba', ['espn-plus'], ['nba:2']);
      expect(result).toHaveLength(0);
    });

    it('namespaced id does not match other sport with same raw ESPN id', () => {
      const collision: SportEvent[] = [
        makeEvent({ id: 'c1', sport: 'nba', homeTeamId: '9', awayTeamId: '1', availableServices: ['youtube-tv'] }),
        makeEvent({ id: 'c2', sport: 'mlb', homeTeamId: '9', awayTeamId: '8', availableServices: ['youtube-tv'] }),
      ];
      const r = filterEvents(collision, 'all', ['youtube-tv'], ['mlb:9']);
      expect(r).toHaveLength(1);
      expect(r[0].id).toBe('c2');
    });
  });

  describe('favoriteSports filtering', () => {
    const mixedEvents: SportEvent[] = [
      makeEvent({ id: 's1', sport: 'nba', homeTeamId: '2', awayTeamId: '13', availableServices: ['youtube-tv'] }),
      makeEvent({ id: 's2', sport: 'golf', availableServices: ['espn-plus'] }),
      makeEvent({ id: 's3', sport: 'mma', availableServices: ['espn-plus'] }),
      makeEvent({ id: 's4', sport: 'mlb', homeTeamId: '7', awayTeamId: '10', availableServices: ['youtube-tv'] }),
      makeEvent({ id: 's5', sport: 'tennis', availableServices: ['espn-plus'] }),
    ];
    const allServices = ['youtube-tv', 'espn-plus'];

    it('favoriteSports alone filters to matching sports', () => {
      const result = filterEvents(mixedEvents, 'all', allServices, [], ['golf', 'mma']);
      expect(result).toHaveLength(2);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('s2');
      expect(ids).toContain('s3');
    });

    it('favoriteSports + favoriteTeams combines with OR logic', () => {
      const result = filterEvents(mixedEvents, 'all', allServices, ['nba:2'], ['golf']);
      expect(result).toHaveLength(2);
      const ids = result.map((e) => e.id);
      expect(ids).toContain('s1');
      expect(ids).toContain('s2');
    });

    it('empty favoriteSports with empty favoriteTeams shows all events', () => {
      const result = filterEvents(mixedEvents, 'all', allServices, [], []);
      expect(result).toHaveLength(5);
    });

    it('favoriteSports respects sport filter pill', () => {
      const result = filterEvents(mixedEvents, 'golf', allServices, [], ['golf', 'mma']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s2');
    });

    it('favoriteSports respects service filter', () => {
      const result = filterEvents(mixedEvents, 'all', ['youtube-tv'], [], ['golf']);
      expect(result).toHaveLength(0);
    });

    it('only favoriteSports set (no teams) matches sport events', () => {
      const result = filterEvents(mixedEvents, 'all', allServices, undefined, ['tennis']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s5');
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
