import request from 'supertest';

jest.mock('../../sports-api', () => ({
  ...jest.requireActual('../../sports-api'),
  fetchAllEvents: jest.fn().mockRejectedValue(new Error('Upstream API failure')),
}));

import { app, clearCache } from '../../index';

beforeEach(() => {
  clearCache();
});

describe('Server error handling', () => {
  it('returns 500 when fetchAllEvents throws', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch events');
  });

  it('still serves health endpoint when events fail', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/foo/bar');
    expect(res.status).toBe(404);
  });
});
