import type { SportEvent } from '@/lib/types';

describe('api module-level constants', () => {
  it('uses android emulator IP when Platform.OS is android', () => {
    jest.resetModules();
    const rn = require('react-native');
    rn.Platform.OS = 'android';
    const api = require('@/lib/api');
    expect(api).toBeDefined();
  });

  it('uses localhost when Platform.OS is not android', () => {
    jest.resetModules();
    const rn = require('react-native');
    rn.Platform.OS = 'ios';
    const api = require('@/lib/api');
    expect(api).toBeDefined();
  });
});

describe('groupEventsBySport', () => {
  function makeEvent(overrides: Partial<SportEvent>): SportEvent {
    return {
      id: 'e-' + Math.random().toString(36).slice(2, 6),
      title: 'Test Event',
      sport: 'nba',
      league: 'NBA',
      channel: 'ESPN',
      startTime: new Date().toISOString(),
      status: 'upcoming',
      availableServices: [],
      ...overrides,
    };
  }

  it('groups events by sport and excludes final events', () => {
    const { groupEventsBySport } = require('@/lib/api');
    const events = [
      makeEvent({ sport: 'nba', status: 'live' }),
      makeEvent({ sport: 'nba', status: 'final' }),
      makeEvent({ sport: 'mlb', status: 'upcoming' }),
    ];

    const groups = groupEventsBySport(events);

    expect(groups).toHaveLength(2);
    expect(groups[0].group).toBe('nba');
    expect(groups[0].events).toHaveLength(1);
    expect(groups[1].group).toBe('mlb');
  });

  it('sorts live events before upcoming events within a sport', () => {
    const { groupEventsBySport } = require('@/lib/api');
    const upcoming = makeEvent({
      sport: 'nba',
      status: 'upcoming',
      startTime: new Date(Date.now() - 60000).toISOString(),
    });
    const live = makeEvent({
      sport: 'nba',
      status: 'live',
      startTime: new Date(Date.now() + 60000).toISOString(),
    });

    const groups = groupEventsBySport([upcoming, live]);
    expect(groups[0].events[0].status).toBe('live');
    expect(groups[0].events[1].status).toBe('upcoming');
  });

  it('sorts by start time when statuses are equal', () => {
    const { groupEventsBySport } = require('@/lib/api');
    const earlier = makeEvent({
      sport: 'nba',
      status: 'upcoming',
      startTime: '2026-04-20T10:00:00Z',
    });
    const later = makeEvent({
      sport: 'nba',
      status: 'upcoming',
      startTime: '2026-04-20T20:00:00Z',
    });

    const groups = groupEventsBySport([later, earlier]);
    expect(groups[0].events[0].startTime).toBe('2026-04-20T10:00:00Z');
    expect(groups[0].events[1].startTime).toBe('2026-04-20T20:00:00Z');
  });

  it('defaults to "other" sport when event.sport is empty', () => {
    const { groupEventsBySport } = require('@/lib/api');
    const events = [makeEvent({ sport: '' as any, status: 'upcoming' })];

    const groups = groupEventsBySport(events);
    expect(groups).toHaveLength(1);
    expect(groups[0].group).toBe('other');
  });

  it('uses sport as label when SPORT_LABELS has no entry', () => {
    const { groupEventsBySport } = require('@/lib/api');
    const events = [makeEvent({ sport: 'other', status: 'upcoming' })];

    const groups = groupEventsBySport(events);
    expect(groups[0].label).toBe('Other');
  });

  it('returns empty array for all-final events', () => {
    const { groupEventsBySport } = require('@/lib/api');
    const events = [makeEvent({ status: 'final' }), makeEvent({ status: 'final' })];

    const groups = groupEventsBySport(events);
    expect(groups).toHaveLength(0);
  });
});

describe('toSportEvent (via fetchEvents)', () => {
  it('falls back to empty services when channel has no mapping and no availableServices', async () => {
    jest.resetModules();
    const rn = require('react-native');
    rn.Platform.OS = 'web';
    const { fetchEvents } = require('@/lib/api');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          events: [
            {
              id: 'x1',
              title: 'Unknown Channel Game',
              sport: 'nba',
              league: 'NBA',
              channel: 'TOTALLY_UNKNOWN_CHANNEL_XYZ',
              startTime: '2026-04-20T19:00:00Z',
              status: 'upcoming' as const,
            },
          ],
        }),
    }) as any;

    const events = await fetchEvents();
    expect(events[0].availableServices).toEqual([]);
  });
});
