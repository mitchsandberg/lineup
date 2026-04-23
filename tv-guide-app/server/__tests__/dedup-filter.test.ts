import { dedupeAndFilter, NormalizedEvent } from '../sports-api';

function makeEvent(overrides: Partial<NormalizedEvent> = {}): NormalizedEvent {
  return {
    id: 'test-1',
    title: 'Team A at Team B',
    sport: 'nba',
    league: 'NBA',
    channel: 'ESPN',
    startTime: new Date().toISOString(),
    status: 'upcoming',
    homeTeam: 'Team B',
    awayTeam: 'Team A',
    ...overrides,
  };
}

const NOW = new Date('2026-04-18T22:00:00Z').getTime();
const ONE_HOUR = 60 * 60_000;
const ONE_DAY = 24 * ONE_HOUR;

describe('dedupeAndFilter', () => {
  describe('time-based filtering', () => {
    it('keeps live events', () => {
      const events = [
        makeEvent({
          id: 'live-1',
          status: 'live',
          startTime: new Date(NOW - 2 * ONE_HOUR).toISOString(),
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(1);
    });

    it('keeps upcoming events within 48 hours', () => {
      const events = [
        makeEvent({
          id: 'upcoming-1',
          status: 'upcoming',
          startTime: new Date(NOW + 6 * ONE_HOUR).toISOString(),
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(1);
    });

    it('filters out final events older than 24 hours', () => {
      const events = [
        makeEvent({
          id: 'old-final',
          status: 'final',
          startTime: new Date(NOW - 2 * ONE_DAY).toISOString(),
          homeTeam: 'Old Team A',
          awayTeam: 'Old Team B',
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(0);
    });

    it('keeps final events from today', () => {
      const events = [
        makeEvent({
          id: 'recent-final',
          status: 'final',
          startTime: new Date(NOW - 6 * ONE_HOUR).toISOString(),
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(1);
    });

    it('filters out events more than 48 hours in the future', () => {
      const events = [
        makeEvent({
          id: 'far-future',
          status: 'upcoming',
          startTime: new Date(NOW + 3 * ONE_DAY).toISOString(),
          homeTeam: 'Future A',
          awayTeam: 'Future B',
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(0);
    });

    it('keeps events at the 48-hour boundary', () => {
      const events = [
        makeEvent({
          id: 'boundary',
          status: 'upcoming',
          startTime: new Date(NOW + 47 * ONE_HOUR).toISOString(),
          homeTeam: 'Boundary A',
          awayTeam: 'Boundary B',
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(1);
    });
  });

  describe('deduplication', () => {
    it('removes duplicate events with same teams and date', () => {
      const time = new Date(NOW + ONE_HOUR).toISOString();
      const events = [
        makeEvent({ id: 'espn-1', homeTeam: 'Lakers', awayTeam: 'Celtics', startTime: time }),
        makeEvent({ id: 'sdb-1', homeTeam: 'Lakers', awayTeam: 'Celtics', startTime: time }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('espn-1');
    });

    it('keeps events with same teams on different dates', () => {
      const events = [
        makeEvent({
          id: 'game-1',
          homeTeam: 'Lakers',
          awayTeam: 'Celtics',
          startTime: new Date(NOW + ONE_HOUR).toISOString(),
        }),
        makeEvent({
          id: 'game-2',
          homeTeam: 'Lakers',
          awayTeam: 'Celtics',
          startTime: new Date(NOW + ONE_DAY + ONE_HOUR).toISOString(),
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(2);
    });

    it('keeps two games same teams on same UTC date but different first pitch (series doubleheader / west-coast night)', () => {
      // Same YYYY-MM-DD in UTC, different first-pitch times; both within dedupe window
      const a = new Date(NOW + ONE_DAY);
      a.setUTCHours(1, 45, 0, 0);
      const b = new Date(NOW + ONE_DAY);
      b.setUTCHours(19, 45, 0, 0);
      const events = [
        makeEvent({
          id: 'late-night-us',
          homeTeam: 'San Francisco Giants',
          awayTeam: 'Los Angeles Dodgers',
          startTime: a.toISOString(),
        }),
        makeEvent({
          id: 'next-day-day-game',
          homeTeam: 'San Francisco Giants',
          awayTeam: 'Los Angeles Dodgers',
          startTime: b.toISOString(),
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(2);
    });

    it('keeps events with different teams on same date', () => {
      const time = new Date(NOW + ONE_HOUR).toISOString();
      const events = [
        makeEvent({ id: 'game-1', homeTeam: 'Lakers', awayTeam: 'Celtics', startTime: time }),
        makeEvent({ id: 'game-2', homeTeam: 'Warriors', awayTeam: 'Bucks', startTime: time }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(2);
    });

    it('keeps non-team events with different titles on the same day', () => {
      const time = new Date(NOW + ONE_HOUR).toISOString();
      const events = [
        makeEvent({
          id: 'event-1',
          title: 'UFC 315',
          homeTeam: undefined,
          awayTeam: undefined,
          startTime: time,
        }),
        makeEvent({
          id: 'event-2',
          title: 'WrestleMania',
          homeTeam: undefined,
          awayTeam: undefined,
          startTime: time,
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(2);
    });

    it('dedupes non-team events with the same title on the same day', () => {
      const time = new Date(NOW + ONE_HOUR).toISOString();
      const events = [
        makeEvent({
          id: 'espn-ufc',
          title: 'UFC 315',
          homeTeam: undefined,
          awayTeam: undefined,
          startTime: time,
        }),
        makeEvent({
          id: 'sdb-ufc',
          title: 'UFC 315',
          homeTeam: undefined,
          awayTeam: undefined,
          startTime: time,
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result).toHaveLength(1);
    });
  });

  describe('sorting', () => {
    it('sorts events chronologically', () => {
      const events = [
        makeEvent({
          id: 'later',
          startTime: new Date(NOW + 6 * ONE_HOUR).toISOString(),
          homeTeam: 'Later A',
          awayTeam: 'Later B',
        }),
        makeEvent({
          id: 'sooner',
          startTime: new Date(NOW + ONE_HOUR).toISOString(),
          homeTeam: 'Sooner A',
          awayTeam: 'Sooner B',
        }),
        makeEvent({
          id: 'middle',
          startTime: new Date(NOW + 3 * ONE_HOUR).toISOString(),
          homeTeam: 'Middle A',
          awayTeam: 'Middle B',
        }),
      ];
      const result = dedupeAndFilter(events, NOW);
      expect(result.map((e) => e.id)).toEqual(['sooner', 'middle', 'later']);
    });
  });

  describe('combined scenarios', () => {
    it('handles a realistic mix of events', () => {
      const events = [
        // Live game - keep
        makeEvent({
          id: 'live-nba',
          status: 'live',
          startTime: new Date(NOW - ONE_HOUR).toISOString(),
          homeTeam: 'Lakers',
          awayTeam: 'Celtics',
        }),
        // Finished today - keep
        makeEvent({
          id: 'final-mlb',
          status: 'final',
          startTime: new Date(NOW - 4 * ONE_HOUR).toISOString(),
          homeTeam: 'Yankees',
          awayTeam: 'Red Sox',
        }),
        // Super Bowl from months ago - drop
        makeEvent({
          id: 'old-nfl',
          status: 'final',
          startTime: new Date(NOW - 60 * ONE_DAY).toISOString(),
          homeTeam: 'Patriots',
          awayTeam: 'Seahawks',
        }),
        // Tomorrow's game - keep
        makeEvent({
          id: 'tomorrow-nhl',
          status: 'upcoming',
          startTime: new Date(NOW + ONE_DAY).toISOString(),
          homeTeam: 'Bruins',
          awayTeam: 'Rangers',
        }),
        // Next week - drop
        makeEvent({
          id: 'next-week',
          status: 'upcoming',
          startTime: new Date(NOW + 7 * ONE_DAY).toISOString(),
          homeTeam: 'Heat',
          awayTeam: 'Bulls',
        }),
        // Duplicate of live game from different source - drop
        makeEvent({
          id: 'live-nba-dupe',
          status: 'live',
          startTime: new Date(NOW - ONE_HOUR).toISOString(),
          homeTeam: 'Lakers',
          awayTeam: 'Celtics',
        }),
      ];

      const result = dedupeAndFilter(events, NOW);
      const ids = result.map((e) => e.id);

      expect(ids).toContain('live-nba');
      expect(ids).toContain('final-mlb');
      expect(ids).toContain('tomorrow-nhl');
      expect(ids).not.toContain('old-nfl');
      expect(ids).not.toContain('next-week');
      expect(ids).not.toContain('live-nba-dupe');
      expect(result).toHaveLength(3);
    });

    it('returns empty array for empty input', () => {
      expect(dedupeAndFilter([], NOW)).toEqual([]);
    });
  });
});
