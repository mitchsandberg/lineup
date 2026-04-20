import request from 'supertest';

const mockEvents = [
  {
    id: 'espn-1',
    title: 'Lakers vs Celtics',
    sport: 'nba',
    league: 'NBA',
    channel: 'ESPN',
    startTime: '2026-04-20T19:00:00Z',
    status: 'live' as const,
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    homeScore: '87',
    awayScore: '82',
  },
  {
    id: 'espn-2',
    title: 'Yankees vs Red Sox',
    sport: 'mlb',
    league: 'MLB',
    channel: 'TBS',
    startTime: '2026-04-20T23:00:00Z',
    status: 'upcoming' as const,
    homeTeam: 'Boston Red Sox',
    awayTeam: 'New York Yankees',
  },
  {
    id: 'espn-3',
    title: 'UFC 315: Main Card',
    sport: 'mma',
    league: 'UFC',
    channel: 'ESPN+',
    startTime: '2026-04-21T02:00:00Z',
    status: 'upcoming' as const,
  },
  {
    id: 'espn-4',
    title: 'PGA Championship Round 3',
    sport: 'golf',
    league: 'PGA Tour',
    channel: 'CBS',
    startTime: '2026-04-21T15:00:00Z',
    status: 'upcoming' as const,
  },
];

jest.mock('../sports-api', () => ({
  ...jest.requireActual('../sports-api'),
  fetchAllEvents: jest.fn().mockResolvedValue(mockEvents),
}));

import { app, clearCache } from '../index';

beforeEach(() => {
  clearCache();
});

describe('GET /api/health', () => {
  it('returns 200 with ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('reports cache status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('cached');
    expect(res.body).toHaveProperty('cacheAge');
  });

  it('shows not cached initially', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.cached).toBe(false);
    expect(res.body.cacheAge).toBeNull();
  });
});

describe('GET /api/events', () => {
  it('returns 200 with events array', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('events');
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('returns a timestamp', async () => {
    const res = await request(app).get('/api/events');
    expect(res.body).toHaveProperty('timestamp');
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });

  it('returns events with required fields', async () => {
    const res = await request(app).get('/api/events');
    if (res.body.events.length > 0) {
      const event = res.body.events[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('sport');
      expect(event).toHaveProperty('league');
      expect(event).toHaveProperty('channel');
      expect(event).toHaveProperty('startTime');
      expect(event).toHaveProperty('status');
      expect(event).toHaveProperty('availableServices');
      expect(['upcoming', 'live', 'final']).toContain(event.status);
      expect(Array.isArray(event.availableServices)).toBe(true);
    }
  });

  it('caches results on second call', async () => {
    await request(app).get('/api/events');
    const healthBefore = await request(app).get('/api/health');
    expect(healthBefore.body.cached).toBe(true);

    const res2 = await request(app).get('/api/events');
    expect(res2.status).toBe(200);
  });

  it('returns events sorted by start time', async () => {
    const res = await request(app).get('/api/events');
    const events = res.body.events;
    for (let i = 1; i < events.length; i++) {
      const prev = new Date(events[i - 1].startTime).getTime();
      const curr = new Date(events[i].startTime).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});

describe('404 handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('CORS handling', () => {
  it('allows requests from allowed origins', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:8081');
    expect(res.status).toBe(200);
  });

  it('allows requests from non-allowed origins (permissive CORS)', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'https://unknown-origin.example.com');
    expect(res.status).toBe(200);
  });
});

describe('Event enrichment', () => {
  it('adds league-specific services to events', async () => {
    const res = await request(app).get('/api/events');
    const nbaEvent = res.body.events.find((e: any) => e.sport === 'nba');
    if (nbaEvent) {
      expect(nbaEvent.availableServices).toContain('nba-league-pass');
    }
  });

  it('adds sport-specific services (ESPN+) for applicable sports', async () => {
    const res = await request(app).get('/api/events');
    const events = res.body.events;
    for (const e of events) {
      if (e.sport === 'mma' || e.sport === 'golf' || e.sport === 'nhl') {
        expect(e.availableServices).toContain('espn-plus');
      }
    }
  });
});
