import { getServicesForChannel } from '../channel-mapping';

describe('getServicesForChannel', () => {
  describe('exact matches', () => {
    it('maps ESPN to youtube-tv, hulu-live, espn-plus', () => {
      const services = getServicesForChannel('ESPN');
      expect(services).toContain('youtube-tv');
      expect(services).toContain('hulu-live');
      expect(services).toContain('espn-plus');
    });

    it('maps FOX to youtube-tv, hulu-live', () => {
      const services = getServicesForChannel('FOX');
      expect(services).toContain('youtube-tv');
      expect(services).toContain('hulu-live');
      expect(services).toHaveLength(2);
    });

    it('maps NBC to youtube-tv, hulu-live, peacock', () => {
      const services = getServicesForChannel('NBC');
      expect(services).toContain('youtube-tv');
      expect(services).toContain('hulu-live');
      expect(services).toContain('peacock');
    });

    it('maps TNT to youtube-tv, hulu-live', () => {
      const services = getServicesForChannel('TNT');
      expect(services).toContain('youtube-tv');
      expect(services).toContain('hulu-live');
    });

    it('maps Peacock exclusive to peacock only', () => {
      const services = getServicesForChannel('Peacock');
      expect(services).toEqual(['peacock']);
    });

    it('maps Prime Video exclusive', () => {
      const services = getServicesForChannel('Prime Video');
      expect(services).toEqual(['prime-video']);
    });

    it('maps Apple TV+ exclusive', () => {
      const services = getServicesForChannel('Apple TV+');
      expect(services).toEqual(['apple-tv']);
    });

    it('maps ESPN+ exclusive', () => {
      const services = getServicesForChannel('ESPN+');
      expect(services).toEqual(['espn-plus']);
    });
  });

  describe('case insensitivity', () => {
    it('handles lowercase', () => {
      expect(getServicesForChannel('espn')).toContain('youtube-tv');
    });

    it('handles UPPERCASE', () => {
      expect(getServicesForChannel('ESPN')).toContain('youtube-tv');
    });

    it('handles Mixed Case', () => {
      expect(getServicesForChannel('Espn')).toContain('youtube-tv');
    });
  });

  describe('fuzzy matching', () => {
    it('matches partial channel names', () => {
      const services = getServicesForChannel('ESPN HD');
      expect(services.length).toBeGreaterThan(0);
    });

    it('matches USA Net as USA Network', () => {
      const services = getServicesForChannel('USA Net');
      expect(services).toContain('peacock');
    });

    it('picks best match when multiple partial matches exist', () => {
      const services = getServicesForChannel('F');
      expect(Array.isArray(services)).toBe(true);
    });

    it('picks longer match over shorter one', () => {
      const services = getServicesForChannel('NBC Sports HD');
      expect(services).toContain('peacock');
    });
  });

  describe('sports-specific channels', () => {
    it('maps NFL Network', () => {
      const services = getServicesForChannel('NFL Network');
      expect(services).toContain('youtube-tv');
      expect(services).toContain('hulu-live');
    });

    it('maps MLB Network', () => {
      const services = getServicesForChannel('MLB Network');
      expect(services).toContain('youtube-tv');
    });

    it('maps NBA TV', () => {
      const services = getServicesForChannel('NBA TV');
      expect(services).toContain('youtube-tv');
    });

    it('maps Golf Channel', () => {
      const services = getServicesForChannel('Golf Channel');
      expect(services).toContain('peacock');
    });

    it('maps SEC Network', () => {
      const services = getServicesForChannel('SEC Network');
      expect(services).toContain('espn-plus');
    });

    it('maps ACC Network', () => {
      const services = getServicesForChannel('ACC Network');
      expect(services).toContain('espn-plus');
    });

    it('maps Big Ten Network', () => {
      const services = getServicesForChannel('Big Ten Network');
      expect(services).toContain('youtube-tv');
    });
  });

  describe('Paramount+ channels', () => {
    it('maps CBS to paramount-plus', () => {
      const services = getServicesForChannel('CBS');
      expect(services).toContain('paramount-plus');
      expect(services).toContain('youtube-tv');
    });

    it('maps CBS Sports Network to paramount-plus', () => {
      const services = getServicesForChannel('CBS Sports Network');
      expect(services).toContain('paramount-plus');
    });

    it('maps Paramount+ exclusive', () => {
      const services = getServicesForChannel('Paramount+');
      expect(services).toEqual(['paramount-plus']);
    });
  });

  describe('golf and MMA channels', () => {
    it('maps PGA Tour Live to espn-plus', () => {
      const services = getServicesForChannel('PGA Tour Live');
      expect(services).toContain('espn-plus');
    });

    it('maps ESPN PPV to espn-plus', () => {
      const services = getServicesForChannel('ESPN PPV');
      expect(services).toContain('espn-plus');
    });

    it('maps ESPN+ PPV to espn-plus', () => {
      const services = getServicesForChannel('ESPN+ PPV');
      expect(services).toContain('espn-plus');
    });
  });

  describe('league service channels', () => {
    it('maps MLB.TV to mlb-tv', () => {
      const services = getServicesForChannel('MLB.TV');
      expect(services).toContain('mlb-tv');
    });

    it('maps MLBTV (no dot) to mlb-tv', () => {
      const services = getServicesForChannel('MLBTV');
      expect(services).toContain('mlb-tv');
    });

    it('maps NBA League Pass to nba-league-pass', () => {
      const services = getServicesForChannel('NBA League Pass');
      expect(services).toContain('nba-league-pass');
    });

    it('maps NFL+ to nfl-plus', () => {
      const services = getServicesForChannel('NFL+');
      expect(services).toContain('nfl-plus');
    });

    it('maps NFL Sunday Ticket to nfl-sunday-ticket', () => {
      const services = getServicesForChannel('NFL Sunday Ticket');
      expect(services).toContain('nfl-sunday-ticket');
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty string', () => {
      expect(getServicesForChannel('')).toEqual([]);
    });

    it('returns empty array for unknown channel', () => {
      expect(getServicesForChannel('Random Channel 999')).toEqual([]);
    });

    it('handles extra whitespace', () => {
      const services = getServicesForChannel('  ESPN  ');
      expect(services.length).toBeGreaterThan(0);
    });
  });
});
