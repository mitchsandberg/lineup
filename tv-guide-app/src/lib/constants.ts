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

const MOBILE_SIZES = {
  cardWidth: 260,
  cardHeight: 170,
  cardGap: 12,
  rowPadding: 16,
  headerHeight: 56,
  filterHeight: 44,
  sectionLabelSize: 20,
  titleSize: 16,
  subtitleSize: 13,
  badgeSize: 11,
  focusBorderWidth: 3,
  focusBorderColor: '#FFFFFF',
  focusScale: 1.03,
} as const;

const TABLET_SIZES = {
  cardWidth: 300,
  cardHeight: 185,
  cardGap: 16,
  rowPadding: 32,
  headerHeight: 64,
  filterHeight: 52,
  sectionLabelSize: 24,
  titleSize: 19,
  subtitleSize: 14,
  badgeSize: 12,
  focusBorderWidth: 3,
  focusBorderColor: '#FFFFFF',
  focusScale: 1.04,
} as const;

export type ResponsiveSizes = typeof TV_SIZES;

export function getSizesForWidth(width: number): ResponsiveSizes {
  if (width < 600) return MOBILE_SIZES;
  if (width < 1024) return TABLET_SIZES;
  return TV_SIZES;
}
