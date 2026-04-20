import { InMemoryCache } from './cache';

interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  strSport: string;
  strLeague: string;
  strHomeTeam: string;
  strAwayTeam: string;
  dateEvent: string;
  strTime: string;
  strTimestamp: string;
  strStatus: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strThumb: string | null;
  strChannel?: string;
}

interface SportsDBTVEntry {
  strChannel: string;
  strCountry: string;
}

interface ESPNEvent {
  id: string;
  name: string;
  date: string;
  status: {
    type: {
      name: string;
      state: string;
      completed: boolean;
    };
    displayClock?: string;
  };
  competitions: Array<{
    competitors: Array<{
      homeAway: string;
      team: { displayName: string; abbreviation: string };
      score?: string;
    }>;
    broadcasts?: Array<{
      names: string[];
    }>;
    geoBroadcasts?: Array<{
      media: { shortName: string };
    }>;
  }>;
}

export interface NormalizedEvent {
  id: string;
  title: string;
  subtitle?: string;
  sport: string;
  league: string;
  channel: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'final';
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: string;
  awayScore?: string;
  thumbnail?: string;
}

// ---------------------------------------------------------------------------
// Sport & status mapping helpers
// ---------------------------------------------------------------------------

export function mapSport(sport: string, league: string): string {
  const s = sport.toLowerCase();
  const l = league.toLowerCase();
  if (l.includes('nfl') || (s.includes('football') && l.includes('american'))) return 'nfl';
  if (l.includes('ncaa') && s.includes('football')) return 'college-football';
  if (l.includes('ncaa') && s.includes('basketball')) return 'college-basketball';
  if (l.includes('nba')) return 'nba';
  if (l.includes('mlb') || s.includes('baseball')) return 'mlb';
  if (l.includes('nhl') || s.includes('hockey')) return 'nhl';
  if (s.includes('soccer') || s.includes('football')) return 'soccer';
  if (s.includes('golf')) return 'golf';
  if (s.includes('tennis')) return 'tennis';
  if (s.includes('mma') || s.includes('fighting')) return 'mma';
  if (s.includes('motorsport') || s.includes('racing')) return 'racing';
  return 'other';
}

export function mapStatus(status: string): 'upcoming' | 'live' | 'final' {
  const s = status?.toLowerCase() ?? '';
  if (s.includes('not started') || s.includes('ns') || s === '' || s.includes('scheduled') || s.includes('pre')) return 'upcoming';
  if (s.includes('halftime') || s.includes('half time') || s === 'ht') return 'live';
  if (/^\d+h$/i.test(s) || s.includes('in progress') || s.includes('in play') || s.includes('live')) return 'live';
  if (s === 'in' || (s.includes('in') && !s.includes('final') && !s.includes('finish'))) return 'live';
  if (/round\s*\d/i.test(s) || s.includes('tee time') || s.includes('rd ')) return 'upcoming';
  if (s.includes('ft') || s.includes('finished') || s.includes('final') || s.includes('aet') || s.includes('completed') || s.includes('post')) return 'final';
  return 'upcoming';
}

// ---------------------------------------------------------------------------
// HTTP helper with timeout
// ---------------------------------------------------------------------------

async function fetchJSON<T>(url: string, timeoutMs: number = 10_000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TVGuideApp/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// ESPN API Client
// ---------------------------------------------------------------------------

const ESPN_SPORTS: Record<string, { slug: string; league: string; sport: string }> = {
  nfl: { slug: 'football/nfl', league: 'NFL', sport: 'nfl' },
  nba: { slug: 'basketball/nba', league: 'NBA', sport: 'nba' },
  mlb: { slug: 'baseball/mlb', league: 'MLB', sport: 'mlb' },
  nhl: { slug: 'hockey/nhl', league: 'NHL', sport: 'nhl' },
  mls: { slug: 'soccer/usa.1', league: 'MLS', sport: 'soccer' },
  epl: { slug: 'soccer/eng.1', league: 'EPL', sport: 'soccer' },
  cfb: { slug: 'football/college-football', league: 'NCAAF', sport: 'college-football' },
  cbb: { slug: 'basketball/mens-college-basketball', league: 'NCAAM', sport: 'college-basketball' },
  ufc: { slug: 'mma/ufc', league: 'UFC', sport: 'mma' },
  pga: { slug: 'golf/pga', league: 'PGA Tour', sport: 'golf' },
  lpga: { slug: 'golf/lpga', league: 'LPGA', sport: 'golf' },
};

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

function normalizeESPNEvent(event: ESPNEvent, config: { league: string; sport: string }): NormalizedEvent | null {
  const comp = event.competitions?.[0];
  if (!comp) return null;

  const broadcasts = comp.broadcasts?.flatMap((b) => b.names) ?? [];
  const geoBroadcasts = comp.geoBroadcasts?.map((b) => b.media.shortName) ?? [];
  const channel = broadcasts[0] ?? geoBroadcasts[0] ?? '';

  const home = comp.competitors?.find((c) => c.homeAway === 'home');
  const away = comp.competitors?.find((c) => c.homeAway === 'away');

  return {
    id: `espn-${event.id}`,
    title: event.name,
    subtitle: config.league,
    sport: config.sport,
    league: config.league,
    channel,
    startTime: event.date,
    status: mapStatus(event.status.type.state),
    homeTeam: home?.team.displayName,
    awayTeam: away?.team.displayName,
    homeScore: home?.score ?? undefined,
    awayScore: away?.score ?? undefined,
  };
}

export function getDateStrings(): string[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 86_400_000)
    .toISOString()
    .split('T')[0]
    .replace(/-/g, '');
  const today = now.toISOString().split('T')[0].replace(/-/g, '');
  const tomorrow = new Date(now.getTime() + 86_400_000)
    .toISOString()
    .split('T')[0]
    .replace(/-/g, '');
  return [yesterday, today, tomorrow];
}

export async function fetchESPNEvents(): Promise<NormalizedEvent[]> {
  const results: NormalizedEvent[] = [];
  const dates = getDateStrings();

  const fetches = Object.entries(ESPN_SPORTS).flatMap(([_key, config]) =>
    dates.map(async (date) => {
      const url = `${ESPN_BASE}/${config.slug}/scoreboard?dates=${date}`;
      const data = await fetchJSON<{ events: ESPNEvent[] }>(url);
      if (!data?.events) return;

      for (const event of data.events) {
        const normalized = normalizeESPNEvent(event, config);
        if (normalized) results.push(normalized);
      }
    }),
  );

  await Promise.all(fetches);
  return results;
}

// ---------------------------------------------------------------------------
// TheSportsDB API Client
// ---------------------------------------------------------------------------

const SPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

const SPORTSDB_SPORT_QUERIES = [
  'Fighting',
  'Motorsport',
  'Golf',
  'Tennis',
  'Soccer',
];

const tvChannelCache = new InMemoryCache<string>(300_000);

async function lookupTVChannel(eventId: string): Promise<string> {
  const cached = tvChannelCache.get(eventId);
  if (cached !== null) return cached;

  const tvData = await fetchJSON<{ tvevent: SportsDBTVEntry[] | null }>(
    `${SPORTSDB_BASE}/lookuptv.php?id=${eventId}`,
  );
  const usEntry = tvData?.tvevent?.find((t) =>
    t.strCountry?.toLowerCase().includes('us'),
  );
  const channel = usEntry?.strChannel ?? tvData?.tvevent?.[0]?.strChannel ?? '';
  tvChannelCache.set(eventId, channel);
  return channel;
}

function normalizeSportsDBEvent(event: SportsDBEvent, channel: string): NormalizedEvent {
  return {
    id: `sdb-${event.idEvent}`,
    title: event.strEvent,
    sport: mapSport(event.strSport, event.strLeague),
    league: event.strLeague,
    channel,
    startTime: event.strTimestamp || `${event.dateEvent}T${event.strTime || '00:00:00'}Z`,
    status: mapStatus(event.strStatus),
    homeTeam: event.strHomeTeam,
    awayTeam: event.strAwayTeam,
    homeScore: event.intHomeScore ?? undefined,
    awayScore: event.intAwayScore ?? undefined,
    thumbnail: event.strThumb ?? undefined,
  };
}

export async function fetchSportsDBEvents(): Promise<NormalizedEvent[]> {
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  const results: NormalizedEvent[] = [];

  for (const sportQuery of SPORTSDB_SPORT_QUERIES) {
    for (const date of [yesterday, today, tomorrow]) {
      const url = `${SPORTSDB_BASE}/eventsday.php?d=${date}&s=${encodeURIComponent(sportQuery)}`;
      const data = await fetchJSON<{ events: SportsDBEvent[] | null }>(url);
      if (!data?.events) continue;

      for (const event of data.events) {
        let channel = event.strChannel ?? '';
        if (!channel) {
          channel = await lookupTVChannel(event.idEvent);
        }
        results.push(normalizeSportsDBEvent(event, channel));
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Dedup, filter, and aggregate
// ---------------------------------------------------------------------------

export function dedupeAndFilter(
  events: NormalizedEvent[],
  now: number = Date.now(),
): NormalizedEvent[] {
  const seen = new Set<string>();
  const deduped: NormalizedEvent[] = [];

  const oneDayAgo = now - 24 * 60 * 60_000;
  const twoDaysFromNow = now + 48 * 60 * 60_000;

  for (const event of events) {
    const eventTime = new Date(event.startTime).getTime();

    if (event.status === 'final' && eventTime < oneDayAgo) continue;
    if (eventTime > twoDaysFromNow) continue;

    const hasTeams = event.homeTeam || event.awayTeam;
    const key = hasTeams
      ? `${event.homeTeam ?? ''}-${event.awayTeam ?? ''}-${event.startTime.split('T')[0]}`.toLowerCase()
      : `${event.title}-${event.startTime.split('T')[0]}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(event);
    }
  }

  deduped.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  return deduped;
}

export async function fetchAllEvents(): Promise<NormalizedEvent[]> {
  const [espnEvents, sdbEvents] = await Promise.all([
    fetchESPNEvents(),
    fetchSportsDBEvents(),
  ]);

  return dedupeAndFilter([...espnEvents, ...sdbEvents]);
}
