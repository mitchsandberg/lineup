import { getDateStrings } from '../sports-api';

describe('getDateStrings', () => {
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
    const y = parseInt(yesterday);
    const t = parseInt(today);
    const tm = parseInt(tomorrow);
    expect(t).toBeGreaterThan(y);
    expect(tm).toBeGreaterThan(t);
  });
});
