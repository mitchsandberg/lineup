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
  /**
   * US App Store numeric id. Used when the native app URL is not openable
   * (e.g. not installed) to send users to the download page.
   */
  appStoreId?: string;
  /**
   * Android / Play app id for the phone/tablet app (package name).
   * Play Store: `?id=…`
   */
  playStorePackage?: string;
  /**
   * Optional Play package for Android TV when it differs (e.g. Prime Video).
   */
  playStorePackageTv?: string;
  deepLinks: {
    /** Apple TV (tvOS). */
    tvos?: string;
    /** iPhone / iPad. Falls back to `tvos` when unset. */
    ios?: string;
    android?: string;
    /** Android TV / Fire TV — never fall back to web on TV */
    androidTv?: string;
    web?: string;
  };
}

export interface Channel {
  id: string;
  name: string;
  serviceIds: string[];
}

export interface RegionalBroadcast {
  type: 'home' | 'away' | 'national';
  channel: string;
}

export interface SportEvent {
  id: string;
  title: string;
  subtitle?: string;
  sport: SportCategory;
  league: string;
  channel: string;
  regionalChannels?: RegionalBroadcast[];
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
  tvMarkets: string[];
  onboardingComplete: boolean;
}

export interface MarketInfo {
  id: string;
  label: string;
}

export interface TeamInfo {
  sport: string;
  league: string;
  /** `sport:espnTeamId` — ESPN ids are not unique across sports */
  teamId: string;
  teamName: string;
}
