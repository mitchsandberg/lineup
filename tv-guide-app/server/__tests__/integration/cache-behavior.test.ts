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

let fetchAllEventsMock: jest.Mock;

jest.mock('../../sports-api', () => {
  fetchAllEventsMock = jest.fn().mockResolvedValue(mockEvents);
  return {
    ...jest.requireActual('../../sports-api'),
    fetchAllEvents: fetchAllEventsMock,
  };
});

import { app, clearCache } from '../../index';

beforeEach(() => {
  clearCache();
  fetchAllEventsMock.mockClear();
});

describe('Cache behavior', () => {
  it('caches first response and serves second from cache', async () => {
    await request(app).get('/api/events');
    expect(fetchAllEventsMock).toHaveBeenCalledTimes(1);

    await request(app).get('/api/events');
    expect(fetchAllEventsMock).toHaveBeenCalledTimes(1);
  });

  it('health endpoint reflects cache status after events fetch', async () => {
    const healthBefore = await request(app).get('/api/health');
    expect(healthBefore.body.cached).toBe(false);

    await request(app).get('/api/events');

    const healthAfter = await request(app).get('/api/health');
    expect(healthAfter.body.cached).toBe(true);
    expect(typeof healthAfter.body.cacheAge).toBe('number');
  });

  it('refetches after cache is cleared', async () => {
    await request(app).get('/api/events');
    expect(fetchAllEventsMock).toHaveBeenCalledTimes(1);

    clearCache();

    await request(app).get('/api/events');
    expect(fetchAllEventsMock).toHaveBeenCalledTimes(2);
  });
});
