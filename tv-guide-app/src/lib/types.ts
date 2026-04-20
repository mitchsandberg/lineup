export type SportCategory =
  | 'all'
  | 'nfl'
  | 'nba'
  | 'mlb'
  | 'nhl'
  | 'soccer'
  | 'college-football'
  | 'college-basketball'
  | 'golf'
  | 'tennis'
  | 'mma'
  | 'racing'
  | 'other';

export type ServiceGroup = 'major' | 'league';

export interface StreamingService {
  id: string;
  name: string;
  color: string;
  group: ServiceGroup;
  deepLinks: {
    tvos?: string;
    android?: string;
    web?: string;
  };
}

export interface Channel {
  id: string;
  name: string;
  serviceIds: string[];
}

export interface SportEvent {
  id: string;
  title: string;
  subtitle?: string;
  sport: SportCategory;
  league: string;
  channel: string;
  startTime: string;
  endTime?: string;
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

export type TimeGroup = 'live' | 'starting-soon' | 'later-today' | 'tomorrow';

export interface GroupedEvents {
  group: string;
  label: string;
  events: SportEvent[];
}

export interface UserPreferences {
  selectedServices: string[];
  selectedSport: SportCategory;
  favoriteTeams: string[];
  favoriteSports: string[];
  onboardingComplete: boolean;
}

export interface TeamInfo {
  sport: string;
  league: string;
  teamId: string;
  teamName: string;
}
