import { SportCategory } from './types';

export const SPORT_FILTERS: { id: SportCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Sports', icon: '🏟' },
  { id: 'nfl', label: 'NFL', icon: '🏈' },
  { id: 'nba', label: 'NBA', icon: '🏀' },
  { id: 'mlb', label: 'MLB', icon: '⚾' },
  { id: 'nhl', label: 'NHL', icon: '🏒' },
  { id: 'soccer', label: 'Soccer', icon: '⚽' },
  { id: 'college-football', label: 'CFB', icon: '🏈' },
  { id: 'college-basketball', label: 'CBB', icon: '🏀' },
  { id: 'golf', label: 'Golf', icon: '⛳' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'mma', label: 'MMA', icon: '🥊' },
  { id: 'racing', label: 'Racing', icon: '🏎' },
];

export const STATUS_COLORS = {
  live: '#FF3B30',
  upcoming: '#2D3548',
  final: '#4A5568',
} as const;

export const TV_SIZES = {
  cardWidth: 340,
  cardHeight: 200,
  cardGap: 20,
  rowPadding: 60,
  headerHeight: 80,
  filterHeight: 60,
  sectionLabelSize: 28,
  titleSize: 22,
  subtitleSize: 16,
  badgeSize: 14,
  focusBorderWidth: 4,
  focusBorderColor: '#FFFFFF',
  focusScale: 1.05,
} as const;
