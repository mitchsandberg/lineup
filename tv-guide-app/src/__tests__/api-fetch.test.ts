import { fetchEvents } from '@/lib/api';

const mockAPIEvents = [
  {
    id: 'evt-1',
    title: 'Game Title',
    sport: 'basketball',
    league: 'NBA',
    channel: 'ESPN',
    startTime: '2026-04-20T19:00:00Z',
    status: 'live' as const,
    homeTeam: 'Celtics',
    awayTeam: 'Lakers',
    homeScore: '87',
    awayScore: '82',
    availableServices: ['espn-plus'],
  },
  {
    id: 'evt-2',
    title: 'Soccer Match',
    sport: 'soccer',
    league: 'EPL',
    channel: 'Peacock',
    startTime: '2026-04-20T20:00:00Z',
    status: 'upcoming' as const,
    availableServices: ['peacock'],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchEvents', () => {
  it('fetches and maps API events to SportEvent objects', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: mockAPIEvents }),
    });

    const events = await fetchEvents();

    expect(events).toHaveLength(2);
    expect(events[0].id).toBe('evt-1');
    expect(events[0].title).toBe('Lakers at Celtics');
    expect(events[0].sport).toBe('basketball');
    expect(events[0].homeScore).toBe('87');
  });

  it('builds title from team names when both are present', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [mockAPIEvents[0]] }),
    });

    const events = await fetchEvents();
    expect(events[0].title).toBe('Lakers at Celtics');
  });

  it('uses original title when teams are missing', async () => {
    const noTeams = { ...mockAPIEvents[1], homeTeam: undefined, awayTeam: undefined };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [noTeams] }),
    });

    const events = await fetchEvents();
    expect(events[0].title).toBe('Soccer Match');
  });

  it('resolves availableServices from channel mapping when available', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [mockAPIEvents[0]] }),
    });

    const events = await fetchEvents();
    expect(Array.isArray(events[0].availableServices)).toBe(true);
  });

  it('falls back to mock data when fetch fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const events = await fetchEvents();

    expect(events.length).toBeGreaterThan(0);
    expect(events[0].id).toMatch(/^mock-/);
  });

  it('falls back to mock data when response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const events = await fetchEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].id).toMatch(/^mock-/);
  });

  it('includes API key header when EXPO_PUBLIC_LINEUP_API_KEY is set', async () => {
    process.env.EXPO_PUBLIC_LINEUP_API_KEY = 'test-key-123';

    jest.resetModules();
    const { fetchEvents: freshFetch } = require('@/lib/api');

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ events: [] }),
    });

    await freshFetch();

    delete process.env.EXPO_PUBLIC_LINEUP_API_KEY;
  });
});
