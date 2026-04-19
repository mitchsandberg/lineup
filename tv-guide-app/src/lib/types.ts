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

export interface StreamingService {
  id: string;
  name: string;
  color: string;
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
  onboardingComplete: boolean;
}
