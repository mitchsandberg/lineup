describe('ESPN date string generation', () => {
  function getDateStrings(now: Date = new Date()): string[] {
    const today = now.toISOString().split('T')[0].replace(/-/g, '');
    const tomorrow = new Date(now.getTime() + 86_400_000)
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '');
    return [today, tomorrow];
  }

  it('returns exactly 2 date strings', () => {
    expect(getDateStrings()).toHaveLength(2);
  });

  it('returns YYYYMMDD format', () => {
    const [today, tomorrow] = getDateStrings(new Date('2026-04-19T10:00:00Z'));
    expect(today).toBe('20260419');
    expect(tomorrow).toBe('20260420');
  });

  it('handles month boundary', () => {
    const [today, tomorrow] = getDateStrings(new Date('2026-01-31T10:00:00Z'));
    expect(today).toBe('20260131');
    expect(tomorrow).toBe('20260201');
  });

  it('handles year boundary', () => {
    const [today, tomorrow] = getDateStrings(new Date('2026-12-31T10:00:00Z'));
    expect(today).toBe('20261231');
    expect(tomorrow).toBe('20270101');
  });

  it('handles early morning (midnight UTC)', () => {
    const [today] = getDateStrings(new Date('2026-04-19T00:00:00Z'));
    expect(today).toBe('20260419');
  });

  it('handles late night (23:59 UTC)', () => {
    const [today] = getDateStrings(new Date('2026-04-19T23:59:59Z'));
    expect(today).toBe('20260419');
  });

  it('today and tomorrow are consecutive', () => {
    const [today, tomorrow] = getDateStrings();
    const todayNum = parseInt(today);
    const tomorrowNum = parseInt(tomorrow);
    expect(tomorrowNum).toBeGreaterThan(todayNum);
  });
});
