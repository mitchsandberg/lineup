import { resolveRSN, enrichEventWithRSN } from '@/lib/rsn';
import { SportEvent } from '@/lib/types';

function makeEvent(overrides: Partial<SportEvent> = {}): SportEvent {
  return {
    id: 'test-1',
    title: 'Yankees at Red Sox',
    sport: 'mlb',
    league: 'MLB',
    channel: 'ESPN',
    startTime: '2026-04-20T19:00:00Z',
    status: 'live',
    homeTeam: 'Boston Red Sox',
    awayTeam: 'New York Yankees',
    availableServices: ['youtube-tv', 'espn-plus'],
    ...overrides,
  };
}

describe('resolveRSN', () => {
  it('returns null when markets are empty', () => {
    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'NESN' }],
    });
    expect(resolveRSN(event, [])).toBeNull();
  });

  it('returns null when event has no regionalChannels', () => {
    const event = makeEvent();
    expect(resolveRSN(event, ['boston'])).toBeNull();
  });

  it('returns null when event has empty regionalChannels', () => {
    const event = makeEvent({ regionalChannels: [] });
    expect(resolveRSN(event, ['boston'])).toBeNull();
  });

  it('returns null when market does not match any regional channel', () => {
    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'NESN' }],
    });
    expect(resolveRSN(event, ['chicago'])).toBeNull();
  });

  it('matches home RSN for Boston market', () => {
    const event = makeEvent({
      regionalChannels: [
        { type: 'national', channel: 'ESPN' },
        { type: 'home', channel: 'NESN' },
        { type: 'away', channel: 'YES' },
      ],
    });
    const result = resolveRSN(event, ['boston']);
    expect(result).not.toBeNull();
    expect(result!.channel).toBe('NESN');
    expect(result!.extraServices).toContain('youtube-tv');
    expect(result!.extraServices).toContain('hulu-live');
  });

  it('matches away RSN for New York market', () => {
    const event = makeEvent({
      regionalChannels: [
        { type: 'national', channel: 'ESPN' },
        { type: 'home', channel: 'NESN' },
        { type: 'away', channel: 'YES' },
      ],
    });
    const result = resolveRSN(event, ['new-york']);
    expect(result).not.toBeNull();
    expect(result!.channel).toBe('YES');
  });

  it('skips national-only broadcasts', () => {
    const event = makeEvent({
      regionalChannels: [
        { type: 'national', channel: 'ESPN' },
      ],
    });
    expect(resolveRSN(event, ['new-york'])).toBeNull();
  });

  it('is case-insensitive on channel names', () => {
    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'nesn' }],
    });
    const result = resolveRSN(event, ['boston']);
    expect(result).not.toBeNull();
    expect(result!.channel).toBe('nesn');
  });

  it('returns empty services for Bally Sports markets', () => {
    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'Bally Sports Detroit' }],
    });
    const result = resolveRSN(event, ['detroit']);
    expect(result).not.toBeNull();
    expect(result!.extraServices).toEqual([]);
  });

  it('returns null for unknown market id', () => {
    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'NESN' }],
    });
    expect(resolveRSN(event, ['unknown-market'])).toBeNull();
  });

  it('matches any selected market', () => {
    const event = makeEvent({
      regionalChannels: [
        { type: 'national', channel: 'ESPN' },
        { type: 'home', channel: 'NESN' },
        { type: 'away', channel: 'YES' },
      ],
    });
    const result = resolveRSN(event, ['chicago', 'new-york']);
    expect(result).not.toBeNull();
    expect(result!.channel).toBe('YES');
  });
});

describe('enrichEventWithRSN', () => {
  it('returns event unchanged when no market', () => {
    const event = makeEvent();
    const result = enrichEventWithRSN(event, []);
    expect(result).toBe(event);
  });

  it('returns event unchanged when no RSN match', () => {
    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'NESN' }],
    });
    const result = enrichEventWithRSN(event, ['chicago']);
    expect(result).toBe(event);
  });

  it('updates channel and merges services for matched RSN', () => {
    const event = makeEvent({
      regionalChannels: [
        { type: 'national', channel: 'ESPN' },
        { type: 'home', channel: 'NESN' },
      ],
      availableServices: ['espn-plus'],
    });
    const result = enrichEventWithRSN(event, ['boston']);
    expect(result.channel).toBe('NESN');
    expect(result.availableServices).toContain('espn-plus');
    expect(result.availableServices).toContain('youtube-tv');
    expect(result.availableServices).toContain('hulu-live');
  });

  it('does not duplicate existing services', () => {
    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'NESN' }],
      availableServices: ['youtube-tv', 'hulu-live'],
    });
    const result = enrichEventWithRSN(event, ['boston']);
    const ytCount = result.availableServices.filter((s) => s === 'youtube-tv').length;
    expect(ytCount).toBe(1);
  });

  it('does not mutate original event', () => {
    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'NESN' }],
      availableServices: ['espn-plus'],
    });
    const original = { ...event, availableServices: [...event.availableServices] };
    enrichEventWithRSN(event, ['boston']);
    expect(event.availableServices).toEqual(original.availableServices);
    expect(event.channel).toBe(original.channel);
  });

  it('merges services from channel mapping when they differ from RSN services', () => {
    jest.spyOn(require('@/data/channels'), 'findChannelByName').mockReturnValueOnce({
      id: 'test-rsn',
      name: 'NESN',
      serviceIds: ['special-service'],
    });

    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'NESN' }],
      availableServices: ['espn-plus'],
    });
    const result = enrichEventWithRSN(event, ['boston']);
    expect(result.availableServices).toContain('special-service');
    expect(result.availableServices).toContain('espn-plus');
    expect(result.availableServices).toContain('youtube-tv');
  });

  it('still updates the channel when channel mapping has no entry', () => {
    jest.spyOn(require('@/data/channels'), 'findChannelByName').mockReturnValueOnce(null);

    const event = makeEvent({
      regionalChannels: [{ type: 'home', channel: 'NESN' }],
      availableServices: ['espn-plus'],
    });

    const result = enrichEventWithRSN(event, ['boston']);

    expect(result.channel).toBe('NESN');
    expect(result.availableServices).toContain('espn-plus');
    expect(result.availableServices).toContain('youtube-tv');
  });
});
