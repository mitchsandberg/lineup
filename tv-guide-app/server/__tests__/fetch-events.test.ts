import { NormalizedEvent } from '../sports-api';

const mockESPNResponse = {
  events: [
    {
      id: '401656789',
      name: 'Lakers vs Celtics',
      date: '2026-04-20T23:00Z',
      status: { type: { name: 'STATUS_IN_PROGRESS', state: 'in', completed: false } },
      competitions: [
        {
          competitors: [
            { homeAway: 'home', team: { displayName: 'Boston Celtics', abbreviation: 'BOS' }, score: '87' },
            { homeAway: 'away', team: { displayName: 'Los Angeles Lakers', abbreviation: 'LAL' }, score: '82' },
          ],
          broadcasts: [{ names: ['ESPN'] }],
          geoBroadcasts: [{ media: { shortName: 'ESPN' } }],
        },
      ],
    },
  ],
};

const mockSportsDBResponse = {
  events: [
    {
      idEvent: '999001',
      strEvent: 'McGregor vs Diaz',
      strSport: 'Fighting',
      strLeague: 'UFC',
      strHomeTeam: 'McGregor',
      strAwayTeam: 'Diaz',
      dateEvent: '2026-04-20',
      strTime: '22:00:00',
      strTimestamp: '2026-04-20T22:00:00Z',
      strStatus: 'Not Started',
      intHomeScore: null,
      intAwayScore: null,
      strThumb: null,
      strChannel: 'ESPN+',
    },
  ],
};

let originalFetch: typeof global.fetch;

beforeAll(() => {
  originalFetch = global.fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

beforeEach(() => {
  jest.resetModules();
});

function makeFetchMock(espnData: any = mockESPNResponse, sdbData: any = mockSportsDBResponse): typeof global.fetch {
  return jest.fn(async (url: any) => {
    if (url.includes('espn.com')) {
      return { ok: true, json: async () => espnData } as Response;
    }
    if (url.includes('thesportsdb.com') && url.includes('eventsday')) {
      return { ok: true, json: async () => sdbData } as Response;
    }
    if (url.includes('thesportsdb.com') && url.includes('lookuptv')) {
      return { ok: true, json: async () => ({ tvevent: null }) } as Response;
    }
    return { ok: false, json: async () => ({}) } as Response;
  });
}

describe('fetchESPNEvents', () => {
  it('fetches and normalizes ESPN events', async () => {
    global.fetch = makeFetchMock();
    const { fetchESPNEvents } = require('../sports-api');

    const events: NormalizedEvent[] = await fetchESPNEvents();

    expect(events.length).toBeGreaterThan(0);
    const lakers = events.find((e: NormalizedEvent) => e.id === 'espn-401656789');
    expect(lakers).toBeDefined();
    expect(lakers!.homeTeam).toBe('Boston Celtics');
    expect(lakers!.awayTeam).toBe('Los Angeles Lakers');
    expect(lakers!.channel).toBe('ESPN');
    expect(lakers!.status).toBe('live');
  });

  it('returns empty array when ESPN returns no events', async () => {
    global.fetch = makeFetchMock({ events: [] });
    const { fetchESPNEvents } = require('../sports-api');

    const events = await fetchESPNEvents();
    expect(events).toEqual([]);
  });

  it('handles fetch failures gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false }) as any;
    const { fetchESPNEvents } = require('../sports-api');

    const events = await fetchESPNEvents();
    expect(Array.isArray(events)).toBe(true);
  });
});

describe('fetchSportsDBEvents', () => {
  it('fetches and normalizes SportsDB events', async () => {
    global.fetch = makeFetchMock();
    const { fetchSportsDBEvents } = require('../sports-api');

    const events: NormalizedEvent[] = await fetchSportsDBEvents();

    expect(events.length).toBeGreaterThan(0);
    const ufc = events.find((e: NormalizedEvent) => e.id === 'sdb-999001');
    expect(ufc).toBeDefined();
    expect(ufc!.homeTeam).toBe('McGregor');
    expect(ufc!.awayTeam).toBe('Diaz');
    expect(ufc!.channel).toBe('ESPN+');
    expect(ufc!.status).toBe('upcoming');
  });

  it('returns empty array when SportsDB has no events', async () => {
    global.fetch = makeFetchMock(mockESPNResponse, { events: null });
    const { fetchSportsDBEvents } = require('../sports-api');

    const events = await fetchSportsDBEvents();
    expect(events).toEqual([]);
  });

  it('looks up TV channel when event has no strChannel', async () => {
    const noChannelEvent = {
      ...mockSportsDBResponse.events[0],
      strChannel: '',
    };
    const sdbResponseNoChannel = { events: [noChannelEvent] };

    global.fetch = jest.fn(async (url: any) => {
      if (url.includes('espn.com')) {
        return { ok: true, json: async () => ({ events: [] }) } as Response;
      }
      if (url.includes('eventsday')) {
        return { ok: true, json: async () => sdbResponseNoChannel } as Response;
      }
      if (url.includes('lookuptv')) {
        return {
          ok: true,
          json: async () => ({
            tvevent: [
              { strChannel: 'FOX Sports', strCountry: 'United States' },
              { strChannel: 'Sky Sports', strCountry: 'United Kingdom' },
            ],
          }),
        } as Response;
      }
      return { ok: false } as Response;
    }) as typeof global.fetch;

    const { fetchSportsDBEvents } = require('../sports-api');
    const events: NormalizedEvent[] = await fetchSportsDBEvents();

    const evt = events.find((e: NormalizedEvent) => e.id === 'sdb-999001');
    expect(evt).toBeDefined();
    expect(evt!.channel).toBe('FOX Sports');
  });

  it('falls back to first channel when no US entry in lookupTV', async () => {
    const noChannelEvent = {
      ...mockSportsDBResponse.events[0],
      strChannel: '',
    };

    global.fetch = jest.fn(async (url: any) => {
      if (url.includes('espn.com')) {
        return { ok: true, json: async () => ({ events: [] }) } as Response;
      }
      if (url.includes('eventsday')) {
        return { ok: true, json: async () => ({ events: [noChannelEvent] }) } as Response;
      }
      if (url.includes('lookuptv')) {
        return {
          ok: true,
          json: async () => ({
            tvevent: [{ strChannel: 'Sky Sports', strCountry: 'United Kingdom' }],
          }),
        } as Response;
      }
      return { ok: false } as Response;
    }) as typeof global.fetch;

    const { fetchSportsDBEvents } = require('../sports-api');
    const events: NormalizedEvent[] = await fetchSportsDBEvents();

    const evt = events.find((e: NormalizedEvent) => e.id === 'sdb-999001');
    expect(evt).toBeDefined();
    expect(evt!.channel).toBe('Sky Sports');
  });

  it('returns empty channel when lookupTV has no entries', async () => {
    const noChannelEvent = {
      ...mockSportsDBResponse.events[0],
      strChannel: '',
    };

    global.fetch = jest.fn(async (url: any) => {
      if (url.includes('espn.com')) {
        return { ok: true, json: async () => ({ events: [] }) } as Response;
      }
      if (url.includes('eventsday')) {
        return { ok: true, json: async () => ({ events: [noChannelEvent] }) } as Response;
      }
      if (url.includes('lookuptv')) {
        return { ok: true, json: async () => ({ tvevent: null }) } as Response;
      }
      return { ok: false } as Response;
    }) as typeof global.fetch;

    const { fetchSportsDBEvents } = require('../sports-api');
    const events: NormalizedEvent[] = await fetchSportsDBEvents();

    const evt = events.find((e: NormalizedEvent) => e.id === 'sdb-999001');
    expect(evt).toBeDefined();
    expect(evt!.channel).toBe('');
  });
});

describe('fetchJSON error handling', () => {
  it('returns null when fetch throws (network error / abort)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('AbortError')) as any;
    const { fetchESPNEvents } = require('../sports-api');

    const events = await fetchESPNEvents();
    expect(Array.isArray(events)).toBe(true);
    expect(events).toHaveLength(0);
  });
});

describe('normalizeESPNEvent edge cases', () => {
  it('returns null when event has no competitions', async () => {
    const noCompEvent = {
      id: '999',
      name: 'Bad Event',
      date: '2026-04-20T23:00Z',
      status: { type: { name: 'STATUS_FINAL', state: 'post', completed: true } },
      competitions: [],
    };
    global.fetch = makeFetchMock({ events: [noCompEvent] });
    const { fetchESPNEvents } = require('../sports-api');
    const events = await fetchESPNEvents();
    const bad = events.find((e: NormalizedEvent) => e.id === 'espn-999');
    expect(bad).toBeUndefined();
  });

  it('handles missing broadcasts and geoBroadcasts', async () => {
    const noBroadcast = {
      id: '888',
      name: 'No Broadcast',
      date: '2026-04-20T23:00Z',
      status: { type: { name: 'STATUS_SCHEDULED', state: 'pre', completed: false } },
      competitions: [{ competitors: [] }],
    };
    global.fetch = makeFetchMock({ events: [noBroadcast] });
    const { fetchESPNEvents } = require('../sports-api');
    const events = await fetchESPNEvents();
    const evt = events.find((e: NormalizedEvent) => e.id === 'espn-888');
    expect(evt).toBeDefined();
    expect(evt!.channel).toBe('');
  });

  it('uses geoBroadcast when broadcasts array is empty', async () => {
    const geoOnly = {
      id: '777',
      name: 'Geo Event',
      date: '2026-04-20T23:00Z',
      status: { type: { name: 'STATUS_SCHEDULED', state: 'pre', completed: false } },
      competitions: [{
        competitors: [],
        broadcasts: [],
        geoBroadcasts: [{ media: { shortName: 'FOX' } }],
      }],
    };
    global.fetch = makeFetchMock({ events: [geoOnly] });
    const { fetchESPNEvents } = require('../sports-api');
    const events = await fetchESPNEvents();
    const evt = events.find((e: NormalizedEvent) => e.id === 'espn-777');
    expect(evt).toBeDefined();
    expect(evt!.channel).toBe('FOX');
  });

  it('extracts regionalChannels from geoBroadcasts with market info', async () => {
    const regionalEvent = {
      id: '555',
      name: 'Yankees vs Red Sox',
      date: '2026-04-20T23:00Z',
      status: { type: { name: 'STATUS_IN_PROGRESS', state: 'in', completed: false } },
      competitions: [{
        competitors: [
          { homeAway: 'home', team: { id: '7', displayName: 'Boston Red Sox', abbreviation: 'BOS' }, score: '3' },
          { homeAway: 'away', team: { id: '10', displayName: 'New York Yankees', abbreviation: 'NYY' }, score: '5' },
        ],
        broadcasts: [{ names: ['ESPN'] }],
        geoBroadcasts: [
          { type: { shortName: 'TV' }, market: { type: 'National' }, media: { shortName: 'ESPN' } },
          { type: { shortName: 'TV' }, market: { type: 'Home' }, media: { shortName: 'NESN' } },
          { type: { shortName: 'TV' }, market: { type: 'Away' }, media: { shortName: 'YES' } },
        ],
      }],
    };
    global.fetch = makeFetchMock({ events: [regionalEvent] });
    const { fetchESPNEvents } = require('../sports-api');
    const events = await fetchESPNEvents();
    const evt = events.find((e: NormalizedEvent) => e.id === 'espn-555');
    expect(evt).toBeDefined();
    expect(evt!.channel).toBe('ESPN');
    expect(evt!.regionalChannels).toBeDefined();
    expect(evt!.regionalChannels).toHaveLength(3);
    expect(evt!.regionalChannels).toEqual(expect.arrayContaining([
      { type: 'national', channel: 'ESPN' },
      { type: 'home', channel: 'NESN' },
      { type: 'away', channel: 'YES' },
    ]));
  });

  it('skips radio geoBroadcasts', async () => {
    const radioEvent = {
      id: '444',
      name: 'Radio Game',
      date: '2026-04-20T23:00Z',
      status: { type: { name: 'STATUS_SCHEDULED', state: 'pre', completed: false } },
      competitions: [{
        competitors: [],
        broadcasts: [{ names: ['ESPN'] }],
        geoBroadcasts: [
          { type: { shortName: 'TV' }, market: { type: 'Home' }, media: { shortName: 'YES' } },
          { type: { shortName: 'Radio' }, market: { type: 'Home' }, media: { shortName: 'WFAN' } },
        ],
      }],
    };
    global.fetch = makeFetchMock({ events: [radioEvent] });
    const { fetchESPNEvents } = require('../sports-api');
    const events = await fetchESPNEvents();
    const evt = events.find((e: NormalizedEvent) => e.id === 'espn-444');
    expect(evt).toBeDefined();
    expect(evt!.regionalChannels).toHaveLength(1);
    expect(evt!.regionalChannels![0].channel).toBe('YES');
  });

  it('skips geoBroadcasts with no media shortName', async () => {
    const noMediaEvent = {
      id: '222',
      name: 'Missing Media',
      date: '2026-04-20T23:00Z',
      status: { type: { name: 'STATUS_SCHEDULED', state: 'pre', completed: false } },
      competitions: [{
        competitors: [],
        broadcasts: [{ names: ['ESPN'] }],
        geoBroadcasts: [
          { type: { shortName: 'TV' }, market: { type: 'Home' }, media: { shortName: 'YES' } },
          { type: { shortName: 'TV' }, market: { type: 'Home' }, media: {} },
          { type: { shortName: 'TV' }, market: { type: 'Away' } },
        ],
      }],
    };
    global.fetch = makeFetchMock({ events: [noMediaEvent] });
    const { fetchESPNEvents } = require('../sports-api');
    const events = await fetchESPNEvents();
    const evt = events.find((e: NormalizedEvent) => e.id === 'espn-222');
    expect(evt).toBeDefined();
    expect(evt!.regionalChannels).toHaveLength(1);
    expect(evt!.regionalChannels![0].channel).toBe('YES');
  });

  it('sets regionalChannels to undefined when no geoBroadcasts', async () => {
    const noGeoBroadcasts = {
      id: '333',
      name: 'No Geo',
      date: '2026-04-20T23:00Z',
      status: { type: { name: 'STATUS_SCHEDULED', state: 'pre', completed: false } },
      competitions: [{
        competitors: [],
        broadcasts: [{ names: ['ESPN'] }],
      }],
    };
    global.fetch = makeFetchMock({ events: [noGeoBroadcasts] });
    const { fetchESPNEvents } = require('../sports-api');
    const events = await fetchESPNEvents();
    const evt = events.find((e: NormalizedEvent) => e.id === 'espn-333');
    expect(evt).toBeDefined();
    expect(evt!.regionalChannels).toBeUndefined();
  });
});

describe('SportsDB strChannel null handling', () => {
  it('defaults to empty string when strChannel is null', async () => {
    const nullChannelEvent = {
      idEvent: '666',
      strEvent: 'Test Null Channel',
      strSport: 'Soccer',
      strLeague: 'EPL',
      strHomeTeam: 'Team A',
      strAwayTeam: 'Team B',
      dateEvent: '2026-04-21',
      strTime: '15:00:00',
      strTimestamp: '2026-04-21T15:00:00Z',
      strStatus: 'Not Started',
      intHomeScore: null,
      intAwayScore: null,
      strThumb: null,
      strChannel: null,
    };

    global.fetch = jest.fn(async (url: any) => {
      if (url.includes('espn.com')) return { ok: true, json: async () => ({ events: [] }) } as Response;
      if (url.includes('eventsday')) return { ok: true, json: async () => ({ events: [nullChannelEvent] }) } as Response;
      if (url.includes('lookuptv')) return { ok: true, json: async () => ({ tvevent: null }) } as Response;
      return { ok: false } as Response;
    }) as typeof global.fetch;

    const { fetchSportsDBEvents } = require('../sports-api');
    const events: NormalizedEvent[] = await fetchSportsDBEvents();
    const evt = events.find((e: NormalizedEvent) => e.id === 'sdb-666');
    expect(evt).toBeDefined();
    expect(evt!.channel).toBe('');
  });
});

describe('normalizeSportsDBEvent edge cases', () => {
  it('builds startTime from dateEvent+strTime when strTimestamp is missing', async () => {
    const noTimestamp = {
      idEvent: '555',
      strEvent: 'No Timestamp',
      strSport: 'Soccer',
      strLeague: 'EPL',
      strHomeTeam: 'Arsenal',
      strAwayTeam: 'Chelsea',
      dateEvent: '2026-04-21',
      strTime: '15:00:00',
      strTimestamp: '',
      strStatus: 'Not Started',
      intHomeScore: null,
      intAwayScore: null,
      strThumb: null,
      strChannel: 'NBC',
    };

    global.fetch = jest.fn(async (url: any) => {
      if (url.includes('espn.com')) return { ok: true, json: async () => ({ events: [] }) } as Response;
      if (url.includes('eventsday')) return { ok: true, json: async () => ({ events: [noTimestamp] }) } as Response;
      if (url.includes('lookuptv')) return { ok: true, json: async () => ({ tvevent: null }) } as Response;
      return { ok: false } as Response;
    }) as typeof global.fetch;

    const { fetchSportsDBEvents } = require('../sports-api');
    const events: NormalizedEvent[] = await fetchSportsDBEvents();
    const evt = events.find((e: NormalizedEvent) => e.id === 'sdb-555');
    expect(evt).toBeDefined();
    expect(evt!.startTime).toBe('2026-04-21T15:00:00Z');
  });

  it('builds startTime with default time when strTime is also missing', async () => {
    const noTime = {
      idEvent: '444',
      strEvent: 'No Time',
      strSport: 'Soccer',
      strLeague: 'EPL',
      strHomeTeam: 'Liverpool',
      strAwayTeam: 'Spurs',
      dateEvent: '2026-04-21',
      strTime: '',
      strTimestamp: '',
      strStatus: 'Not Started',
      intHomeScore: null,
      intAwayScore: null,
      strThumb: null,
      strChannel: 'CBS',
    };

    global.fetch = jest.fn(async (url: any) => {
      if (url.includes('espn.com')) return { ok: true, json: async () => ({ events: [] }) } as Response;
      if (url.includes('eventsday')) return { ok: true, json: async () => ({ events: [noTime] }) } as Response;
      if (url.includes('lookuptv')) return { ok: true, json: async () => ({ tvevent: null }) } as Response;
      return { ok: false } as Response;
    }) as typeof global.fetch;

    const { fetchSportsDBEvents } = require('../sports-api');
    const events: NormalizedEvent[] = await fetchSportsDBEvents();
    const evt = events.find((e: NormalizedEvent) => e.id === 'sdb-444');
    expect(evt).toBeDefined();
    expect(evt!.startTime).toBe('2026-04-21T00:00:00Z');
  });
});

describe('fetchAllEvents dedup', () => {
  it('deduplicates events without team names using title-based key', async () => {
    const espnNoTeams = {
      events: [{
        id: '100',
        name: 'UFC 315: Main Card',
        date: '2026-04-21T02:00:00Z',
        status: { type: { name: 'STATUS_SCHEDULED', state: 'pre', completed: false } },
        competitions: [{
          competitors: [],
          broadcasts: [{ names: ['ESPN'] }],
        }],
      }],
    };

    const sdbSameEvent = {
      events: [{
        idEvent: '200',
        strEvent: 'UFC 315: Main Card',
        strSport: 'Fighting',
        strLeague: 'UFC',
        strHomeTeam: null,
        strAwayTeam: null,
        dateEvent: '2026-04-21',
        strTimestamp: '2026-04-21T02:00:00Z',
        strStatus: 'Not Started',
        intHomeScore: null,
        intAwayScore: null,
        strThumb: null,
        strChannel: 'ESPN+',
      }],
    };

    global.fetch = jest.fn(async (url: any) => {
      if (url.includes('espn.com')) return { ok: true, json: async () => espnNoTeams } as Response;
      if (url.includes('eventsday')) return { ok: true, json: async () => sdbSameEvent } as Response;
      if (url.includes('lookuptv')) return { ok: true, json: async () => ({ tvevent: null }) } as Response;
      return { ok: false } as Response;
    }) as typeof global.fetch;

    const { fetchAllEvents } = require('../sports-api');
    const events: NormalizedEvent[] = await fetchAllEvents();

    const ufcEvents = events.filter((e: NormalizedEvent) =>
      e.title.includes('UFC 315'),
    );
    expect(ufcEvents.length).toBeLessThanOrEqual(1);
  });
});

describe('dedupeAndFilter edge cases', () => {
  it('handles events with partial team names (one team null)', async () => {
    const espnPartialTeam = {
      events: [
        {
          id: '333',
          name: 'Solo Home Team',
          date: '2026-04-21T18:00:00Z',
          status: { type: { name: 'STATUS_SCHEDULED', state: 'pre', completed: false } },
          competitions: [{
            competitors: [
              { homeAway: 'home', team: { displayName: 'Home Team', abbreviation: 'HT' }, score: undefined },
            ],
            broadcasts: [{ names: ['ESPN'] }],
          }],
        },
        {
          id: '334',
          name: 'Solo Away Team',
          date: '2026-04-21T19:00:00Z',
          status: { type: { name: 'STATUS_SCHEDULED', state: 'pre', completed: false } },
          competitions: [{
            competitors: [
              { homeAway: 'away', team: { displayName: 'Away Team', abbreviation: 'AT' }, score: undefined },
            ],
            broadcasts: [{ names: ['FOX'] }],
          }],
        },
      ],
    };

    global.fetch = jest.fn(async (url: any) => {
      if (url.includes('espn.com')) return { ok: true, json: async () => espnPartialTeam } as Response;
      if (url.includes('thesportsdb.com') && url.includes('eventsday'))
        return { ok: true, json: async () => ({ events: null }) } as Response;
      if (url.includes('lookuptv')) return { ok: true, json: async () => ({ tvevent: null }) } as Response;
      return { ok: false } as Response;
    }) as typeof global.fetch;

    const { fetchAllEvents } = require('../sports-api');
    const events: NormalizedEvent[] = await fetchAllEvents();

    const evt = events.find((e: NormalizedEvent) => e.id === 'espn-333');
    expect(evt).toBeDefined();
    expect(evt!.homeTeam).toBe('Home Team');
    expect(evt!.awayTeam).toBeUndefined();
  });
});

describe('fetchAllEvents', () => {
  it('merges ESPN and SportsDB events and deduplicates', async () => {
    global.fetch = makeFetchMock();
    const { fetchAllEvents } = require('../sports-api');

    const events: NormalizedEvent[] = await fetchAllEvents();

    expect(Array.isArray(events)).toBe(true);
    const ids = events.map((e: NormalizedEvent) => e.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('returns sorted events by startTime', async () => {
    global.fetch = makeFetchMock();
    const { fetchAllEvents } = require('../sports-api');

    const events: NormalizedEvent[] = await fetchAllEvents();

    for (let i = 1; i < events.length; i++) {
      const prev = new Date(events[i - 1].startTime).getTime();
      const curr = new Date(events[i].startTime).getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });
});
