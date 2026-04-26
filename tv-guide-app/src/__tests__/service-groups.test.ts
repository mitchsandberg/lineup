import {
  STREAMING_SERVICES,
  MAJOR_SERVICES,
  LEAGUE_SERVICES,
  SERVICE_MAP,
} from '@/data/services';

describe('service grouping', () => {
  it('every service has a group of "major" or "league"', () => {
    for (const service of STREAMING_SERVICES) {
      expect(['major', 'league']).toContain(service.group);
    }
  });

  it('MAJOR_SERVICES contains only major group services', () => {
    for (const service of MAJOR_SERVICES) {
      expect(service.group).toBe('major');
    }
  });

  it('LEAGUE_SERVICES contains only league group services', () => {
    for (const service of LEAGUE_SERVICES) {
      expect(service.group).toBe('league');
    }
  });

  it('MAJOR_SERVICES + LEAGUE_SERVICES equals all services', () => {
    expect(MAJOR_SERVICES.length + LEAGUE_SERVICES.length).toBe(STREAMING_SERVICES.length);
  });

  it('has 7 major services', () => {
    expect(MAJOR_SERVICES).toHaveLength(7);
  });

  it('has 4 league services', () => {
    expect(LEAGUE_SERVICES).toHaveLength(4);
  });

  it('major services include the expected IDs', () => {
    const ids = MAJOR_SERVICES.map((s) => s.id);
    expect(ids).toContain('youtube-tv');
    expect(ids).toContain('espn-plus');
    expect(ids).toContain('peacock');
    expect(ids).toContain('hulu-live');
    expect(ids).toContain('prime-video');
    expect(ids).toContain('paramount-plus');
    expect(ids).toContain('apple-tv');
  });

  it('league services include the expected IDs', () => {
    const ids = LEAGUE_SERVICES.map((s) => s.id);
    expect(ids).toContain('mlb-tv');
    expect(ids).toContain('nba-league-pass');
    expect(ids).toContain('nfl-plus');
    expect(ids).toContain('nfl-sunday-ticket');
  });
});

describe('league service deep links', () => {
  it('MLB.TV has valid deep links', () => {
    const mlb = SERVICE_MAP['mlb-tv'];
    expect(mlb).toBeDefined();
    expect(mlb.deepLinks.tvos).toBe('mlbatbat://');
    expect(mlb.deepLinks.android).toContain('bamnetworks');
    expect(mlb.deepLinks.web).toBe('https://www.mlb.com/tv');
  });

  it('NBA League Pass has valid deep links', () => {
    const nba = SERVICE_MAP['nba-league-pass'];
    expect(nba).toBeDefined();
    expect(nba.deepLinks.tvos).toBe('gametime-nba://');
    expect(nba.deepLinks.android).toContain('nba');
    expect(nba.deepLinks.web).toBe('https://www.nba.com/watch');
  });

  it('NFL+ has valid deep links', () => {
    const nfl = SERVICE_MAP['nfl-plus'];
    expect(nfl).toBeDefined();
    expect(nfl.deepLinks.tvos).toBe('nflgamecenter://');
    expect(nfl.deepLinks.android).toContain('nflgamecenter');
    expect(nfl.deepLinks.web).toBe('https://www.nfl.com/plus/');
  });

  it('Paramount+ has valid deep links', () => {
    const pp = SERVICE_MAP['paramount-plus'];
    expect(pp).toBeDefined();
    expect(pp.deepLinks.tvos).toBe('paramountplus://');
    expect(pp.deepLinks.ios).toBe('https://www.paramountplus.com');
    expect(pp.deepLinks.android).toContain('cbs.ott');
    expect(pp.deepLinks.web).toBe('https://www.paramountplus.com');
  });

  it('Sunday Ticket deep links point to YouTube TV', () => {
    const ticket = SERVICE_MAP['nfl-sunday-ticket'];
    expect(ticket).toBeDefined();
    expect(ticket.deepLinks.tvos).toContain('youtube');
    expect(ticket.deepLinks.android).toContain('youtube.unplugged');
    expect(ticket.deepLinks.web).toContain('tv.youtube.com');
  });
});

describe('service color visibility', () => {
  it('no service uses pure black (#000000)', () => {
    for (const service of STREAMING_SERVICES) {
      expect(service.color.toLowerCase()).not.toBe('#000000');
    }
  });

  it('Peacock uses a visible color (not black)', () => {
    const peacock = SERVICE_MAP['peacock'];
    expect(peacock.color).toBe('#6B3FA0');
  });
});
