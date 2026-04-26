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
    homeTeamId: '2',
    awayTeamId: '13',
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
    homeTeamId: '7',
    awayTeamId: '10',
  },
  {
    id: 'espn-5',
    title: 'Orioles vs Royals',
    sport: 'mlb',
    league: 'MLB',
    channel: 'FS1',
    startTime: '2026-04-20T23:10:00Z',
    status: 'live' as const,
    homeTeam: 'Kansas City Royals',
    awayTeam: 'Baltimore Orioles',
    regionalChannels: [
      { type: 'national' as const, channel: 'FS1' },
      { type: 'home' as const, channel: 'MASN' },
    ],
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

const mockTeams = [
  { sport: 'mlb', league: 'MLB', teamId: 'mlb:7', teamName: 'Boston Red Sox' },
  { sport: 'mlb', league: 'MLB', teamId: 'mlb:10', teamName: 'New York Yankees' },
  { sport: 'nba', league: 'NBA', teamId: 'nba:2', teamName: 'Boston Celtics' },
  { sport: 'nba', league: 'NBA', teamId: 'nba:13', teamName: 'Los Angeles Lakers' },
];

jest.mock('../sports-api', () => ({
  ...jest.requireActual('../sports-api'),
  fetchAllEvents: jest.fn().mockResolvedValue(mockEvents),
  fetchAllTeams: jest.fn().mockResolvedValue(mockTeams),
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

  it('includes services from regional channels in enrichment', async () => {
    const res = await request(app).get('/api/events');
    const orioles = res.body.events.find((e: any) => e.id === 'espn-5');
    expect(orioles).toBeDefined();
    expect(orioles.availableServices).toContain('youtube-tv');
    expect(orioles.availableServices).toContain('hulu-live');
    expect(orioles.availableServices).toContain('mlb-tv');
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

describe('GET /api/teams', () => {
  it('returns 200 with teams array', async () => {
    const res = await request(app).get('/api/teams');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('teams');
    expect(Array.isArray(res.body.teams)).toBe(true);
  });

  it('returns a timestamp', async () => {
    const res = await request(app).get('/api/teams');
    expect(res.body).toHaveProperty('timestamp');
    expect(new Date(res.body.timestamp).getTime()).not.toBeNaN();
  });

  it('extracts teams from events with team IDs', async () => {
    const res = await request(app).get('/api/teams');
    const teams = res.body.teams;
    for (const team of teams) {
      expect(team).toHaveProperty('sport');
      expect(team).toHaveProperty('league');
      expect(team).toHaveProperty('teamId');
      expect(team).toHaveProperty('teamName');
    }
  });

  it('returns teams sorted by league then name', async () => {
    const res = await request(app).get('/api/teams');
    const teams = res.body.teams;
    for (let i = 1; i < teams.length; i++) {
      const cmp = teams[i - 1].league.localeCompare(teams[i].league)
        || teams[i - 1].teamName.localeCompare(teams[i].teamName);
      expect(cmp).toBeLessThanOrEqual(0);
    }
  });
});

describe('GET /api/teams error handling', () => {
  it('returns 500 when fetchAllTeams throws', async () => {
    const { fetchAllTeams } = require('../sports-api') as { fetchAllTeams: jest.Mock };
    fetchAllTeams.mockRejectedValueOnce(new Error('Teams API down'));

    const res = await request(app).get('/api/teams');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Failed to fetch teams');
  });
});

describe('GET /api/markets', () => {
  it('returns 200 with markets array', async () => {
    const res = await request(app).get('/api/markets');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('markets');
    expect(Array.isArray(res.body.markets)).toBe(true);
  });

  it('returns a timestamp', async () => {
    const res = await request(app).get('/api/markets');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('returns markets with id and label', async () => {
    const res = await request(app).get('/api/markets');
    const markets = res.body.markets;
    expect(markets.length).toBeGreaterThan(0);
    for (const market of markets) {
      expect(market).toHaveProperty('id');
      expect(market).toHaveProperty('label');
      expect(typeof market.id).toBe('string');
      expect(typeof market.label).toBe('string');
    }
  });

  it('includes well-known markets', async () => {
    const res = await request(app).get('/api/markets');
    const ids = res.body.markets.map((m: any) => m.id);
    expect(ids).toContain('new-york');
    expect(ids).toContain('boston');
    expect(ids).toContain('chicago');
    expect(ids).toContain('los-angeles');
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
