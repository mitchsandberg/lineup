import { CHANNELS, findChannelByName, CHANNEL_MAP } from '@/data/channels';
import { STREAMING_SERVICES, SERVICE_MAP } from '@/data/services';

describe('Channel data integrity', () => {
  it('has no duplicate channel IDs', () => {
    const ids = CHANNELS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has no duplicate channel names', () => {
    const names = CHANNELS.map((c) => c.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('all channel serviceIds reference valid services', () => {
    const validServiceIds = new Set(STREAMING_SERVICES.map((s) => s.id));
    for (const channel of CHANNELS) {
      for (const serviceId of channel.serviceIds) {
        expect(validServiceIds.has(serviceId)).toBe(true);
      }
    }
  });

  it('every channel has at least one service', () => {
    for (const channel of CHANNELS) {
      expect(channel.serviceIds.length).toBeGreaterThan(0);
    }
  });

  it('has a reasonable number of channels', () => {
    expect(CHANNELS.length).toBeGreaterThanOrEqual(20);
  });
});

describe('Service data integrity', () => {
  it('has no duplicate service IDs', () => {
    const ids = STREAMING_SERVICES.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every service has a name', () => {
    for (const service of STREAMING_SERVICES) {
      expect(service.name.length).toBeGreaterThan(0);
    }
  });

  it('every service has a color', () => {
    for (const service of STREAMING_SERVICES) {
      expect(service.color).toMatch(/^#[0-9A-Fa-f]{3,6}$/);
    }
  });

  it('every service has at least one deep link', () => {
    for (const service of STREAMING_SERVICES) {
      const links = Object.values(service.deepLinks).filter(Boolean);
      expect(links.length).toBeGreaterThan(0);
    }
  });

  it('has all expected services', () => {
    const ids = STREAMING_SERVICES.map((s) => s.id);
    expect(ids).toContain('youtube-tv');
    expect(ids).toContain('espn-plus');
    expect(ids).toContain('peacock');
    expect(ids).toContain('hulu-live');
    expect(ids).toContain('prime-video');
    expect(ids).toContain('apple-tv');
    expect(ids).toContain('mlb-tv');
    expect(ids).toContain('nba-league-pass');
    expect(ids).toContain('nfl-plus');
    expect(ids).toContain('nfl-sunday-ticket');
  });
});

describe('SERVICE_MAP', () => {
  it('has an entry for every service', () => {
    for (const service of STREAMING_SERVICES) {
      expect(SERVICE_MAP[service.id]).toBeDefined();
      expect(SERVICE_MAP[service.id].name).toBe(service.name);
    }
  });
});

describe('findChannelByName', () => {
  it('finds exact matches', () => {
    expect(findChannelByName('ESPN')).toBeDefined();
    expect(findChannelByName('ESPN')!.id).toBe('espn');
  });

  it('finds case-insensitive matches', () => {
    expect(findChannelByName('espn')).toBeDefined();
    expect(findChannelByName('Espn')).toBeDefined();
  });

  it('finds partial matches', () => {
    const result = findChannelByName('SEC');
    expect(result).toBeDefined();
  });

  it('returns undefined for unknown channels', () => {
    expect(findChannelByName('nonexistent')).toBeUndefined();
  });

  it('handles empty string', () => {
    const result = findChannelByName('');
    // May or may not match -- just shouldn't crash
    expect(true).toBe(true);
  });
});

describe('CHANNEL_MAP', () => {
  it('has lowercase keys', () => {
    for (const key of Object.keys(CHANNEL_MAP)) {
      expect(key).toBe(key.toLowerCase());
    }
  });

  it('maps to valid channels', () => {
    for (const channel of Object.values(CHANNEL_MAP)) {
      expect(channel.id).toBeDefined();
      expect(channel.name).toBeDefined();
      expect(channel.serviceIds.length).toBeGreaterThan(0);
    }
  });
});

describe('league channel mappings', () => {
  it('MLB.TV channel maps to mlb-tv service', () => {
    const channel = CHANNELS.find((c) => c.id === 'mlb-tv');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toEqual(['mlb-tv']);
  });

  it('MLBTV (alt) channel maps to mlb-tv service', () => {
    const channel = CHANNELS.find((c) => c.id === 'mlb-tv-alt');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toEqual(['mlb-tv']);
  });

  it('NBA League Pass channel maps to nba-league-pass service', () => {
    const channel = CHANNELS.find((c) => c.id === 'nba-league-pass');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toEqual(['nba-league-pass']);
  });

  it('NBA TV also maps to nba-league-pass', () => {
    const channel = CHANNELS.find((c) => c.id === 'nba-tv');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toContain('nba-league-pass');
    expect(channel!.serviceIds).toContain('youtube-tv');
  });

  it('NFL+ channel maps to nfl-plus service', () => {
    const channel = CHANNELS.find((c) => c.id === 'nfl-plus');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toEqual(['nfl-plus']);
  });

  it('NFL Network also maps to nfl-plus', () => {
    const channel = CHANNELS.find((c) => c.id === 'nfl-network');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toContain('nfl-plus');
    expect(channel!.serviceIds).toContain('youtube-tv');
  });

  it('NFL Sunday Ticket maps to nfl-sunday-ticket service', () => {
    const channel = CHANNELS.find((c) => c.id === 'nfl-sunday-ticket');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toEqual(['nfl-sunday-ticket']);
  });

  it('findChannelByName finds MLB.TV', () => {
    const channel = findChannelByName('MLB.TV');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toContain('mlb-tv');
  });

  it('findChannelByName finds NBA League Pass', () => {
    const channel = findChannelByName('NBA League Pass');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toContain('nba-league-pass');
  });

  it('findChannelByName finds NFL Sunday Ticket', () => {
    const channel = findChannelByName('NFL Sunday Ticket');
    expect(channel).toBeDefined();
    expect(channel!.serviceIds).toContain('nfl-sunday-ticket');
  });
});

describe('cross-referencing channels and services', () => {
  it('youtube-tv appears in at least 15 channels', () => {
    const ytChannels = CHANNELS.filter((c) => c.serviceIds.includes('youtube-tv'));
    expect(ytChannels.length).toBeGreaterThanOrEqual(15);
  });

  it('hulu-live appears in at least 15 channels', () => {
    const huluChannels = CHANNELS.filter((c) => c.serviceIds.includes('hulu-live'));
    expect(huluChannels.length).toBeGreaterThanOrEqual(15);
  });

  it('espn-plus appears in ESPN family channels', () => {
    const espnChannels = CHANNELS.filter((c) => c.serviceIds.includes('espn-plus'));
    const espnNames = espnChannels.map((c) => c.name.toLowerCase());
    expect(espnNames.some((n) => n.includes('espn'))).toBe(true);
  });

  it('peacock appears in NBC family channels', () => {
    const peacockChannels = CHANNELS.filter((c) => c.serviceIds.includes('peacock'));
    const names = peacockChannels.map((c) => c.name.toLowerCase());
    expect(names.some((n) => n.includes('nbc') || n.includes('peacock') || n.includes('usa'))).toBe(true);
  });

  it('every service is referenced by at least one channel', () => {
    for (const service of STREAMING_SERVICES) {
      const channels = CHANNELS.filter((c) => c.serviceIds.includes(service.id));
      expect(channels.length).toBeGreaterThan(0);
    }
  });
});
