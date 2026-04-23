import { getDateStrings } from '../sports-api';

describe('getDateStrings', () => {
  const saveTz = process.env.SPORTS_CALENDAR_TZ;

  afterEach(() => {
    if (saveTz === undefined) delete process.env.SPORTS_CALENDAR_TZ;
    else process.env.SPORTS_CALENDAR_TZ = saveTz;
  });

  it('returns exactly 3 date strings (yesterday, today, tomorrow)', () => {
    expect(getDateStrings()).toHaveLength(3);
  });

  it('returns YYYYMMDD format strings', () => {
    const dates = getDateStrings();
    for (const d of dates) {
      expect(d).toMatch(/^\d{8}$/);
    }
  });

  it('returns consecutive dates', () => {
    const [yesterday, today, tomorrow] = getDateStrings();
    const y = parseInt(yesterday, 10);
    const t = parseInt(today, 10);
    const tm = parseInt(tomorrow, 10);
    expect(t).toBeGreaterThan(y);
    expect(tm).toBeGreaterThan(t);
  });

  it('uses sports calendar day, not UTC, so "tonight" in LA is still the right board', () => {
    process.env.SPORTS_CALENDAR_TZ = 'America/Los_Angeles';
    // 2026-04-23T04:00:00.000Z = 4/22/2026 9:00pm PT — still 4/22 in LA, but already 4/23 in UTC
    const fixed = new Date('2026-04-23T04:00:00.000Z');
    const [, today] = getDateStrings(fixed);
    expect(today).toBe('20260422');
  });
});
