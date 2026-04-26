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
      team: { id?: string; displayName: string; abbreviation: string };
      score?: string;
    }>;
    broadcasts?: Array<{
      names: string[];
    }>;
    geoBroadcasts?: Array<{
      type?: { shortName: string };
      market?: { type: string };
      media: { shortName: string };
    }>;
  }>;
}

export interface RegionalBroadcast {
  type: 'home' | 'away' | 'national';
  channel: string;
}

export interface NormalizedEvent {
  id: string;
  title: string;
  subtitle?: string;
  sport: string;
  league: string;
  channel: string;
  regionalChannels?: RegionalBroadcast[];
  startTime: string;
  status: 'upcoming' | 'live' | 'final';
  homeTeam?: string;
  awayTeam?: string;
  homeTeamId?: string;
  awayTeamId?: string;
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
// "Sports day" for API queries — never use raw UTC (Render runs in UTC and would
// ask ESPN for the wrong YYYYMMDD board vs when fans mean "tonight" in the US).
// Default follows common US TV sports calendar; override with SPORTS_CALENDAR_TZ
// (IANA, e.g. America/Los_Angeles).
// ---------------------------------------------------------------------------

function ymdInTimeZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(d)
    .replace(/-/g, '');
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
  const geoBroadcasts = comp.geoBroadcasts?.map((b) => b.media?.shortName).filter(Boolean) ?? [];
  const allChannels = [...broadcasts, ...geoBroadcasts];
  const STREAMING_ONLY = new Set([
    'espn+', 'espn unlmtd', 'espn unlimited', 'espn+ ppv', 'espn ppv',
    'mlb.tv', 'mlbtv', 'nba league pass', 'nfl+', 'nfl sunday ticket',
    'peacock', 'paramount+', 'prime video', 'apple tv+', 'apple tv',
  ]);
  const tvChannel = allChannels.find((c) => !STREAMING_ONLY.has(c.toLowerCase()));
  const channel = tvChannel ?? allChannels[0] ?? '';

  const regionalChannels: RegionalBroadcast[] = [];
  if (comp.geoBroadcasts) {
    for (const gb of comp.geoBroadcasts) {
      if (gb.type?.shortName?.toLowerCase() === 'radio') continue;
      const marketType = gb.market?.type?.toLowerCase() ?? '';
      const type: RegionalBroadcast['type'] =
        marketType === 'home' ? 'home' :
        marketType === 'away' ? 'away' : 'national';
      if (gb.media?.shortName) {
        regionalChannels.push({ type, channel: gb.media.shortName });
      }
    }
  }

  const home = comp.competitors?.find((c) => c.homeAway === 'home');
  const away = comp.competitors?.find((c) => c.homeAway === 'away');

  return {
    id: `espn-${event.id}`,
    title: event.name,
    subtitle: config.league,
    sport: config.sport,
    league: config.league,
    channel,
    regionalChannels: regionalChannels.length > 0 ? regionalChannels : undefined,
    startTime: event.date,
    status: mapStatus(event.status.type.state),
    homeTeam: home?.team.displayName,
    awayTeam: away?.team.displayName,
    homeTeamId: home?.team.id,
    awayTeamId: away?.team.id,
    homeScore: home?.score ?? undefined,
    awayScore: away?.score ?? undefined,
  };
}

function sportsCalendarTimeZone(): string {
  return process.env.SPORTS_CALENDAR_TZ?.trim() || 'America/Los_Angeles';
}

/**
 * YYYYMDD (no separators) for yesterday / today / tomorrow in the sports calendar
 * zone — not in UTC. Uses civil-day offsets; safe for our scoreboard lookback.
 */
export function getDateStrings(now: Date = new Date()): string[] {
  const timeZone = sportsCalendarTimeZone();
  const oneDay = 86_400_000;
  return [
    ymdInTimeZone(new Date(now.getTime() - oneDay), timeZone),
    ymdInTimeZone(new Date(now.getTime()), timeZone),
    ymdInTimeZone(new Date(now.getTime() + oneDay), timeZone),
  ];
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

  // Same event often appears on overlapping `dates=` requests; keep one by stable id.
  const byId = new Map<string, NormalizedEvent>();
  for (const e of results) {
    if (!byId.has(e.id)) byId.set(e.id, e);
  }
  return [...byId.values()];
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
  const ymd8 = getDateStrings();
  const sportsDbDates = ymd8.map(
    (c) => `${c.slice(0, 4)}-${c.slice(4, 6)}-${c.slice(6, 8)}`,
  );

  const results: NormalizedEvent[] = [];

  for (const sportQuery of SPORTSDB_SPORT_QUERIES) {
    for (const date of sportsDbDates) {
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
    // Use full startTime, not just the calendar date: primetime in US (e.g. 4/22) can
    // share the same UTC date as the next afternoon's rematch, and MLB series often
    // have two real games the same "day" in Zulu.
    const key = hasTeams
      ? `${event.homeTeam ?? ''}-${event.awayTeam ?? ''}-${event.startTime}`.toLowerCase()
      : `${event.title}-${event.startTime}`.toLowerCase();
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

// ---------------------------------------------------------------------------
// ESPN Teams API -- fetches full rosters of teams per league
// ---------------------------------------------------------------------------

export interface TeamEntry {
  sport: string;
  league: string;
  teamId: string;
  teamName: string;
}

interface ESPNTeamResponse {
  sports?: Array<{
    leagues?: Array<{
      teams?: Array<{
        team: { id: string; displayName: string };
      }>;
    }>;
  }>;
}

const TEAM_SPORT_CONFIGS = Object.entries(ESPN_SPORTS)
  .filter(([_key, cfg]) => !['mma', 'golf'].includes(cfg.sport))
  .map(([key, cfg]) => ({ key, ...cfg }));

const teamsCache = new InMemoryCache<TeamEntry[]>(600_000);
const TEAMS_CACHE_KEY = 'all-teams';

export async function fetchAllTeams(): Promise<TeamEntry[]> {
  const cached = teamsCache.get(TEAMS_CACHE_KEY);
  if (cached) return cached;

  const results: TeamEntry[] = [];

  const fetches = TEAM_SPORT_CONFIGS.map(async (config) => {
    const url = `${ESPN_BASE}/${config.slug}/teams?limit=200`;
    const data = await fetchJSON<ESPNTeamResponse>(url);
    const league = data?.sports?.[0]?.leagues?.[0];
    if (!league?.teams) return;

    for (const entry of league.teams) {
      results.push({
        sport: config.sport,
        league: config.league,
        // Namespace ESPN ids: they repeat across sports (e.g. NBA vs MLB "9")
        teamId: `${config.sport}:${entry.team.id}`,
        teamName: entry.team.displayName,
      });
    }
  });

  await Promise.all(fetches);

  results.sort((a, b) =>
    a.league.localeCompare(b.league) || a.teamName.localeCompare(b.teamName),
  );

  teamsCache.set(TEAMS_CACHE_KEY, results);
  return results;
}
