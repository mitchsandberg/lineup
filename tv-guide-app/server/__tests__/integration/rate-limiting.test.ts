import request from 'supertest';

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

jest.mock('../../sports-api', () => ({
  ...jest.requireActual('../../sports-api'),
  fetchAllEvents: jest.fn().mockResolvedValue(mockEvents),
}));

import { app, clearCache } from '../../index';

beforeEach(() => {
  clearCache();
});

describe('Rate limiting', () => {
  it('allows requests under the limit', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
  });

  it('returns 429 after exceeding 60 requests in a window', async () => {
    const agent = request(app);

    for (let i = 0; i < 60; i++) {
      await agent.get('/api/health');
    }

    const res = await agent.get('/api/health');
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/too many requests/i);
  });
});
