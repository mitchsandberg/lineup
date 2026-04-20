import cors from 'cors';
import express from 'express';
import { InMemoryCache } from './cache';
import { getServicesForChannel } from './channel-mapping';
import { fetchAllEvents, fetchAllTeams, NormalizedEvent } from './sports-api';

export const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:3000',
  'https://lineup-guide.netlify.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
}));

app.set('trust proxy', 1);

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 60;

app.use('/api/', (req, res, next) => {
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
    return;
  }
  next();
});

const API_KEY = process.env.LINEUP_API_KEY;
if (API_KEY) {
  app.use('/api/', (req, res, next) => {
    const provided = req.headers['x-api-key'];
    if (provided === API_KEY) return next();
    res.status(401).json({ error: 'Invalid or missing API key.' });
  });
}

app.use(express.json());

type EnrichedEvent = NormalizedEvent & { availableServices: string[] };

const eventsCache = new InMemoryCache<EnrichedEvent[]>(60_000);
const CACHE_KEY = 'all-events';

export function clearCache() {
  eventsCache.clear();
}

export async function getEvents(): Promise<EnrichedEvent[]> {
  const cached = eventsCache.get(CACHE_KEY);
  if (cached) return cached;

  console.log('[server] Fetching fresh sports data...');
  const raw = await fetchAllEvents();

  const LEAGUE_SERVICE_MAP: Record<string, string> = {
    mlb: 'mlb-tv',
    nba: 'nba-league-pass',
    nfl: 'nfl-plus',
  };

  const SPORT_SERVICE_MAP: Record<string, string> = {
    mma: 'espn-plus',
    golf: 'espn-plus',
    nhl: 'espn-plus',
  };

  const enriched = raw.map((event) => {
    const services = [...getServicesForChannel(event.channel)];
    const leagueService = LEAGUE_SERVICE_MAP[event.sport];
    if (leagueService && !services.includes(leagueService)) {
      services.push(leagueService);
    }
    const sportService = SPORT_SERVICE_MAP[event.sport];
    if (sportService && !services.includes(sportService)) {
      services.push(sportService);
    }
    return { ...event, availableServices: services };
  });

  eventsCache.set(CACHE_KEY, enriched);
  console.log(`[server] Cached ${enriched.length} events`);
  return enriched;
}

app.get('/api/events', async (_req, res) => {
  try {
    const events = await getEvents();
    res.json({ events, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[server] Error fetching events:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/teams', async (_req, res) => {
  try {
    const teams = await fetchAllTeams();
    res.json({ teams, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[server] Error fetching teams:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    cached: eventsCache.has(CACHE_KEY),
    cacheAge: eventsCache.getAge(CACHE_KEY),
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[server] Lineup API running on http://localhost:${PORT}`);
  });
}
