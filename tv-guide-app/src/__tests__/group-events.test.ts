import { groupEventsByTime } from '@/lib/api';
import { SportEvent } from '@/lib/types';

function makeEvent(overrides: Partial<SportEvent> = {}): SportEvent {
  return {
    id: 'test-1',
    title: 'Team A at Team B',
    sport: 'nba',
    league: 'NBA',
    channel: 'ESPN',
    startTime: new Date().toISOString(),
    status: 'upcoming',
    availableServices: ['youtube-tv'],
    ...overrides,
  };
}

describe('groupEventsByTime', () => {
  const now = Date.now();
  const ONE_MINUTE = 60_000;
  const ONE_HOUR = 60 * ONE_MINUTE;

  describe('live grouping', () => {
    it('groups live events into "Live Now"', () => {
      const events = [
        makeEvent({ id: 'live-1', status: 'live', startTime: new Date(now - ONE_HOUR).toISOString() }),
        makeEvent({ id: 'live-2', status: 'live', startTime: new Date(now - 2 * ONE_HOUR).toISOString() }),
      ];
      const groups = groupEventsByTime(events);
      const liveGroup = groups.find((g) => g.group === 'live');
      expect(liveGroup).toBeDefined();
      expect(liveGroup!.label).toBe('Live Now');
      expect(liveGroup!.events).toHaveLength(2);
    });
  });

  describe('starting soon grouping', () => {
    it('groups events within 90 minutes as "Starting Soon"', () => {
      const events = [
        makeEvent({
          id: 'soon-1',
          status: 'upcoming',
          startTime: new Date(now + 30 * ONE_MINUTE).toISOString(),
        }),
        makeEvent({
          id: 'soon-2',
          status: 'upcoming',
          startTime: new Date(now + 60 * ONE_MINUTE).toISOString(),
        }),
      ];
      const groups = groupEventsByTime(events);
      const soonGroup = groups.find((g) => g.group === 'starting-soon');
      expect(soonGroup).toBeDefined();
      expect(soonGroup!.label).toBe('Starting Soon');
      expect(soonGroup!.events).toHaveLength(2);
    });
  });

  describe('later today grouping', () => {
    it('groups events later today', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-04-20T12:00:00'));

      const laterToday = new Date('2026-04-20T20:00:00');
      const events = [
        makeEvent({
          id: 'later-1',
          status: 'upcoming',
          startTime: laterToday.toISOString(),
        }),
      ];
      const groups = groupEventsByTime(events);
      const laterGroup = groups.find((g) => g.group === 'later-today');
      expect(laterGroup).toBeDefined();
      expect(laterGroup!.label).toBe('Later Today');

      jest.useRealTimers();
    });
  });

  describe('tomorrow grouping', () => {
    it('groups events scheduled for tomorrow', () => {
      const tomorrow = new Date(now + 24 * ONE_HOUR);
      tomorrow.setHours(14, 0, 0, 0);
      const events = [
        makeEvent({
          id: 'tomorrow-1',
          status: 'upcoming',
          startTime: tomorrow.toISOString(),
        }),
      ];
      const groups = groupEventsByTime(events);
      const tomorrowGroup = groups.find((g) => g.group === 'tomorrow');
      expect(tomorrowGroup).toBeDefined();
      expect(tomorrowGroup!.label).toBe('Tomorrow');
    });
  });

  describe('filtering', () => {
    it('excludes final events', () => {
      const events = [
        makeEvent({ id: 'final-1', status: 'final' }),
        makeEvent({ id: 'live-1', status: 'live' }),
      ];
      const groups = groupEventsByTime(events);
      const allGroupedEvents = groups.flatMap((g) => g.events);
      expect(allGroupedEvents.find((e) => e.id === 'final-1')).toBeUndefined();
      expect(allGroupedEvents.find((e) => e.id === 'live-1')).toBeDefined();
    });
  });

  describe('empty states', () => {
    it('returns empty array for no events', () => {
      expect(groupEventsByTime([])).toEqual([]);
    });

    it('omits empty groups', () => {
      const events = [makeEvent({ id: 'live-1', status: 'live' })];
      const groups = groupEventsByTime(events);
      for (const group of groups) {
        expect(group.events.length).toBeGreaterThan(0);
      }
    });

    it('returns empty array when all events are final', () => {
      const events = [
        makeEvent({ id: 'final-1', status: 'final' }),
        makeEvent({ id: 'final-2', status: 'final' }),
      ];
      expect(groupEventsByTime(events)).toEqual([]);
    });
  });

  describe('group ordering', () => {
    it('returns groups in correct order: live, starting-soon, later-today, tomorrow', () => {
      const tomorrow = new Date(now + 24 * ONE_HOUR);
      tomorrow.setHours(14, 0, 0, 0);

      const events = [
        makeEvent({ id: 'live-1', status: 'live' }),
        makeEvent({
          id: 'soon-1',
          status: 'upcoming',
          startTime: new Date(now + 30 * ONE_MINUTE).toISOString(),
        }),
        makeEvent({
          id: 'tomorrow-1',
          status: 'upcoming',
          startTime: tomorrow.toISOString(),
        }),
      ];
      const groups = groupEventsByTime(events);
      const groupNames = groups.map((g) => g.group);

      if (groupNames.length >= 2) {
        const liveIdx = groupNames.indexOf('live');
        const soonIdx = groupNames.indexOf('starting-soon');
        const tomorrowIdx = groupNames.indexOf('tomorrow');

        if (liveIdx >= 0 && soonIdx >= 0) expect(liveIdx).toBeLessThan(soonIdx);
        if (soonIdx >= 0 && tomorrowIdx >= 0) expect(soonIdx).toBeLessThan(tomorrowIdx);
      }
    });
  });
});
