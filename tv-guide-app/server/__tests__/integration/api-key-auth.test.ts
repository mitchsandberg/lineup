import request from 'supertest';
import type { Express } from 'express';

const mockEvents = [
  {
    id: 'espn-1',
    title: 'Test Game',
    sport: 'nba',
    league: 'NBA',
    channel: 'ESPN',
    startTime: '2026-04-20T19:00:00Z',
    status: 'live' as const,
  },
];

function loadApp(): { app: Express; clearCache: () => void } {
  jest.resetModules();
  jest.mock('../../sports-api', () => ({
    ...jest.requireActual('../../sports-api'),
    fetchAllEvents: jest.fn().mockResolvedValue(mockEvents),
  }));
  return require('../../index');
}

describe('API key authentication — key NOT set', () => {
  let app: Express;

  beforeAll(() => {
    delete process.env.LINEUP_API_KEY;
    const mod = loadApp();
    app = mod.app;
    mod.clearCache();
  });

  it('passes requests through when LINEUP_API_KEY is not set', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
  });
});

describe('API key authentication — key SET', () => {
  let app: Express;
  let clearCache: () => void;

  beforeAll(() => {
    process.env.LINEUP_API_KEY = 'test-secret-key';
    const mod = loadApp();
    app = mod.app;
    clearCache = mod.clearCache;
  });

  beforeEach(() => {
    clearCache();
  });

  afterAll(() => {
    delete process.env.LINEUP_API_KEY;
  });

  it('rejects requests without API key', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid or missing api key/i);
  });

  it('rejects requests with wrong API key', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('x-api-key', 'wrong-key');
    expect(res.status).toBe(401);
  });

  it('accepts requests with correct API key', async () => {
    const res = await request(app)
      .get('/api/events')
      .set('x-api-key', 'test-secret-key');
    expect(res.status).toBe(200);
  });
});
