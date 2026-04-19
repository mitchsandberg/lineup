import { getServicesForChannel } from '../channel-mapping';

describe('league service channel mappings', () => {
  it('maps MLB.TV to mlb-tv', () => {
    expect(getServicesForChannel('MLB.TV')).toContain('mlb-tv');
  });

  it('maps MLBTV to mlb-tv', () => {
    expect(getServicesForChannel('MLBTV')).toContain('mlb-tv');
  });

  it('maps NBA League Pass to nba-league-pass', () => {
    expect(getServicesForChannel('NBA League Pass')).toContain('nba-league-pass');
  });

  it('maps NFL+ to nfl-plus', () => {
    expect(getServicesForChannel('NFL+')).toContain('nfl-plus');
  });

  it('maps NFL Sunday Ticket to nfl-sunday-ticket', () => {
    expect(getServicesForChannel('NFL Sunday Ticket')).toContain('nfl-sunday-ticket');
  });
});

describe('league auto-enrichment logic', () => {
  const LEAGUE_SERVICE_MAP: Record<string, string> = {
    mlb: 'mlb-tv',
    nba: 'nba-league-pass',
    nfl: 'nfl-plus',
  };

  function enrichServices(sport: string, channelServices: string[]): string[] {
    const services = [...channelServices];
    const leagueService = LEAGUE_SERVICE_MAP[sport];
    if (leagueService && !services.includes(leagueService)) {
      services.push(leagueService);
    }
    return services;
  }

  it('adds mlb-tv to MLB games', () => {
    const result = enrichServices('mlb', ['youtube-tv', 'hulu-live']);
    expect(result).toContain('mlb-tv');
    expect(result).toContain('youtube-tv');
  });

  it('adds nba-league-pass to NBA games', () => {
    const result = enrichServices('nba', ['youtube-tv']);
    expect(result).toContain('nba-league-pass');
  });

  it('adds nfl-plus to NFL games', () => {
    const result = enrichServices('nfl', ['youtube-tv', 'hulu-live']);
    expect(result).toContain('nfl-plus');
  });

  it('does not duplicate league service if already present', () => {
    const result = enrichServices('mlb', ['mlb-tv']);
    const count = result.filter((s) => s === 'mlb-tv').length;
    expect(count).toBe(1);
  });

  it('does not add league services for non-league sports', () => {
    const result = enrichServices('soccer', ['youtube-tv']);
    expect(result).toEqual(['youtube-tv']);
  });

  it('does not add league services for NHL', () => {
    const result = enrichServices('nhl', ['espn-plus']);
    expect(result).toEqual(['espn-plus']);
  });

  it('handles empty channel services', () => {
    const result = enrichServices('nba', []);
    expect(result).toEqual(['nba-league-pass']);
  });

  it('preserves original services order', () => {
    const result = enrichServices('mlb', ['youtube-tv', 'hulu-live', 'espn-plus']);
    expect(result[0]).toBe('youtube-tv');
    expect(result[1]).toBe('hulu-live');
    expect(result[2]).toBe('espn-plus');
    expect(result[3]).toBe('mlb-tv');
  });
});
