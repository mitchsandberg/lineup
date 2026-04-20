import { Platform } from 'react-native';
import { SportEvent, GroupedEvents, TimeGroup, SportCategory, TeamInfo } from './types';
import { findChannelByName } from '@/data/channels';

const PRODUCTION_API = 'https://lineup-api-31li.onrender.com';
const LOCAL_API_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const LOCAL_API = `http://${LOCAL_API_HOST}:3001`;

const API_BASE = __DEV__ ? LOCAL_API : PRODUCTION_API;

interface APIEvent {
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
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: string;
  awayScore?: string;
  thumbnail?: string;
  availableServices: string[];
}

function toSportEvent(event: APIEvent): SportEvent {
  const channelEntry = findChannelByName(event.channel);

  return {
    id: event.id,
    title: event.homeTeam && event.awayTeam
      ? `${event.awayTeam} at ${event.homeTeam}`
      : event.title,
    subtitle: event.league,
    sport: event.sport as SportEvent['sport'],
    league: event.league,
    channel: event.channel,
    startTime: event.startTime,
    status: event.status,
    homeTeam: event.homeTeam,
    awayTeam: event.awayTeam,
    homeTeamId: event.homeTeamId,
    awayTeamId: event.awayTeamId,
    homeScore: event.homeScore,
    awayScore: event.awayScore,
    thumbnail: event.thumbnail,
    availableServices: channelEntry?.serviceIds ?? event.availableServices ?? [],
  };
}

const API_KEY = process.env.EXPO_PUBLIC_LINEUP_API_KEY ?? '';

export async function fetchEvents(): Promise<SportEvent[]> {
  try {
    const headers: Record<string, string> = {};
    if (API_KEY) headers['x-api-key'] = API_KEY;

    const res = await fetch(`${API_BASE}/api/events`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.events as APIEvent[]).map(toSportEvent);
  } catch (err) {
    console.warn('Failed to fetch from API, using mock data', err);
    return getMockEvents();
  }
}

export async function fetchTeams(): Promise<TeamInfo[]> {
  try {
    const headers: Record<string, string> = {};
    if (API_KEY) headers['x-api-key'] = API_KEY;

    const res = await fetch(`${API_BASE}/api/teams`, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.teams as TeamInfo[];
  } catch (err) {
    console.warn('Failed to fetch teams', err);
    return [];
  }
}

export function groupEventsByTime(events: SportEvent[]): GroupedEvents[] {
  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 90 * 60_000);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const groups: Record<TimeGroup, SportEvent[]> = {
    live: [],
    'starting-soon': [],
    'later-today': [],
    tomorrow: [],
  };

  for (const event of events) {
    if (event.status === 'final') continue;

    const start = new Date(event.startTime);

    if (event.status === 'live') {
      groups.live.push(event);
    } else if (start <= soonThreshold) {
      groups['starting-soon'].push(event);
    } else if (start <= endOfToday) {
      groups['later-today'].push(event);
    } else {
      groups.tomorrow.push(event);
    }
  }

  const labels: Record<TimeGroup, string> = {
    live: 'Live Now',
    'starting-soon': 'Starting Soon',
    'later-today': 'Later Today',
    tomorrow: 'Tomorrow',
  };

  return (Object.entries(groups) as [TimeGroup, SportEvent[]][])
    .filter(([, events]) => events.length > 0)
    .map(([group, events]) => ({
      group,
      label: labels[group],
      events,
    }));
}

const SPORT_DISPLAY_ORDER: SportCategory[] = [
  'nfl', 'nba', 'mlb', 'nhl', 'soccer',
  'college-football', 'college-basketball',
  'golf', 'tennis', 'mma', 'racing', 'other',
];

const SPORT_LABELS: Record<string, string> = {
  nfl: 'NFL',
  nba: 'NBA',
  mlb: 'MLB',
  nhl: 'NHL',
  soccer: 'Soccer',
  'college-football': 'College Football',
  'college-basketball': 'College Basketball',
  golf: 'Golf',
  tennis: 'Tennis',
  mma: 'MMA & Wrestling',
  racing: 'Racing',
  other: 'Other',
};

export function groupEventsBySport(events: SportEvent[]): GroupedEvents[] {
  const nonFinal = events.filter((e) => e.status !== 'final');

  const bySport: Record<string, SportEvent[]> = {};
  for (const event of nonFinal) {
    const sport = event.sport || 'other';
    if (!bySport[sport]) bySport[sport] = [];
    bySport[sport].push(event);
  }

  for (const sportEvents of Object.values(bySport)) {
    sportEvents.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (a.status !== 'live' && b.status === 'live') return 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }

  return SPORT_DISPLAY_ORDER
    .filter((sport) => bySport[sport]?.length)
    .map((sport) => ({
      group: sport,
      label: SPORT_LABELS[sport] ?? sport,
      events: bySport[sport],
    }));
}

export function filterEvents(
  events: SportEvent[],
  selectedSport: SportCategory,
  selectedServices: string[],
  favoriteTeams?: string[],
  favoriteSports?: string[],
): SportEvent[] {
  const hasTeamFilter = favoriteTeams && favoriteTeams.length > 0;
  const hasSportFilter = favoriteSports && favoriteSports.length > 0;
  const hasFavoritesFilter = hasTeamFilter || hasSportFilter;

  return events.filter((e) => {
    const sportMatch = selectedSport === 'all' || e.sport === selectedSport;
    const serviceMatch =
      e.availableServices.length === 0 ||
      e.availableServices.some((s) => selectedServices.includes(s));

    if (!hasFavoritesFilter) {
      return sportMatch && serviceMatch;
    }

    const matchesTeam = hasTeamFilter && (
      favoriteTeams!.includes(e.homeTeamId ?? '') ||
      favoriteTeams!.includes(e.awayTeamId ?? '')
    );
    const matchesSport = hasSportFilter && favoriteSports!.includes(e.sport);

    return sportMatch && serviceMatch && (matchesTeam || matchesSport);
  });
}

function getMockEvents(): SportEvent[] {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60_000);
  const inThreeHours = new Date(now.getTime() + 180 * 60_000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60_000);

  return [
    {
      id: 'mock-1',
      title: 'Lakers at Celtics',
      subtitle: 'NBA',
      sport: 'nba',
      league: 'NBA',
      channel: 'ESPN',
      startTime: now.toISOString(),
      status: 'live',
      homeTeam: 'Boston Celtics',
      awayTeam: 'Los Angeles Lakers',
      homeScore: '87',
      awayScore: '82',
      availableServices: ['youtube-tv', 'hulu-live', 'espn-plus'],
    },
    {
      id: 'mock-2',
      title: 'Yankees at Red Sox',
      subtitle: 'MLB',
      sport: 'mlb',
      league: 'MLB',
      channel: 'TBS',
      startTime: now.toISOString(),
      status: 'live',
      homeTeam: 'Boston Red Sox',
      awayTeam: 'New York Yankees',
      homeScore: '3',
      awayScore: '5',
      availableServices: ['youtube-tv', 'hulu-live'],
    },
    {
      id: 'mock-3',
      title: 'Arsenal vs Chelsea',
      subtitle: 'EPL',
      sport: 'soccer',
      league: 'English Premier League',
      channel: 'Peacock',
      startTime: inOneHour.toISOString(),
      status: 'upcoming',
      homeTeam: 'Arsenal',
      awayTeam: 'Chelsea',
      availableServices: ['peacock'],
    },
    {
      id: 'mock-4',
      title: 'Warriors at Bucks',
      subtitle: 'NBA',
      sport: 'nba',
      league: 'NBA',
      channel: 'TNT',
      startTime: inOneHour.toISOString(),
      status: 'upcoming',
      homeTeam: 'Milwaukee Bucks',
      awayTeam: 'Golden State Warriors',
      availableServices: ['youtube-tv', 'hulu-live'],
    },
    {
      id: 'mock-5',
      title: 'Chiefs at Bills',
      subtitle: 'NFL',
      sport: 'nfl',
      league: 'NFL',
      channel: 'NBC',
      startTime: inThreeHours.toISOString(),
      status: 'upcoming',
      homeTeam: 'Buffalo Bills',
      awayTeam: 'Kansas City Chiefs',
      availableServices: ['youtube-tv', 'hulu-live', 'peacock'],
    },
    {
      id: 'mock-6',
      title: 'Dodgers at Mets',
      subtitle: 'MLB',
      sport: 'mlb',
      league: 'MLB',
      channel: 'FOX',
      startTime: inThreeHours.toISOString(),
      status: 'upcoming',
      homeTeam: 'New York Mets',
      awayTeam: 'Los Angeles Dodgers',
      availableServices: ['youtube-tv', 'hulu-live'],
    },
    {
      id: 'mock-7',
      title: 'UFC 315: Main Card',
      subtitle: 'UFC',
      sport: 'mma',
      league: 'UFC',
      channel: 'ESPN+',
      startTime: tomorrow.toISOString(),
      status: 'upcoming',
      availableServices: ['espn-plus'],
    },
    {
      id: 'mock-8',
      title: 'Thursday Night Football',
      subtitle: 'NFL',
      sport: 'nfl',
      league: 'NFL',
      channel: 'Prime Video',
      startTime: tomorrow.toISOString(),
      status: 'upcoming',
      homeTeam: 'Dallas Cowboys',
      awayTeam: 'Philadelphia Eagles',
      availableServices: ['prime-video'],
    },
  ];
}
