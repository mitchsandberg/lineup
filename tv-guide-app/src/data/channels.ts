import { Channel } from '@/lib/types';

export const CHANNELS: Channel[] = [
  { id: 'espn', name: 'ESPN', serviceIds: ['youtube-tv', 'hulu-live', 'espn-plus'] },
  { id: 'espn2', name: 'ESPN2', serviceIds: ['youtube-tv', 'hulu-live', 'espn-plus'] },
  { id: 'espnu', name: 'ESPNU', serviceIds: ['youtube-tv', 'hulu-live', 'espn-plus'] },
  { id: 'espnews', name: 'ESPNews', serviceIds: ['youtube-tv', 'hulu-live', 'espn-plus'] },
  { id: 'abc', name: 'ABC', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'fox', name: 'FOX', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'fs1', name: 'FS1', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'fs2', name: 'FS2', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'nbc', name: 'NBC', serviceIds: ['youtube-tv', 'hulu-live', 'peacock'] },
  { id: 'nbcsn', name: 'NBC Sports', serviceIds: ['youtube-tv', 'hulu-live', 'peacock'] },
  { id: 'cbs', name: 'CBS', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'tnt', name: 'TNT', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'tbs', name: 'TBS', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'trutv', name: 'truTV', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'nfl-network', name: 'NFL Network', serviceIds: ['youtube-tv', 'hulu-live', 'nfl-plus'] },
  { id: 'mlb-network', name: 'MLB Network', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'nba-tv', name: 'NBA TV', serviceIds: ['youtube-tv', 'hulu-live', 'nba-league-pass'] },
  { id: 'nhl-network', name: 'NHL Network', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'golf-channel', name: 'Golf Channel', serviceIds: ['youtube-tv', 'hulu-live', 'peacock'] },
  { id: 'usa', name: 'USA Network', serviceIds: ['youtube-tv', 'hulu-live', 'peacock'] },
  { id: 'peacock-exclusive', name: 'Peacock', serviceIds: ['peacock'] },
  { id: 'prime-exclusive', name: 'Prime Video', serviceIds: ['prime-video'] },
  { id: 'apple-exclusive', name: 'Apple TV+', serviceIds: ['apple-tv'] },
  { id: 'espn-plus-exclusive', name: 'ESPN+', serviceIds: ['espn-plus'] },
  { id: 'sec-network', name: 'SEC Network', serviceIds: ['youtube-tv', 'hulu-live', 'espn-plus'] },
  { id: 'acc-network', name: 'ACC Network', serviceIds: ['youtube-tv', 'hulu-live', 'espn-plus'] },
  { id: 'big-ten', name: 'Big Ten Network', serviceIds: ['youtube-tv', 'hulu-live'] },
  { id: 'mlb-tv', name: 'MLB.TV', serviceIds: ['mlb-tv'] },
  { id: 'mlb-tv-alt', name: 'MLBTV', serviceIds: ['mlb-tv'] },
  { id: 'nba-league-pass', name: 'NBA League Pass', serviceIds: ['nba-league-pass'] },

  { id: 'nfl-plus', name: 'NFL+', serviceIds: ['nfl-plus'] },

  { id: 'nfl-sunday-ticket', name: 'NFL Sunday Ticket', serviceIds: ['nfl-sunday-ticket'] },
];

export const CHANNEL_MAP = Object.fromEntries(
  CHANNELS.map((c) => [c.name.toLowerCase(), c]),
);

export function findChannelByName(name: string): Channel | undefined {
  const normalized = name.toLowerCase().trim();
  return (
    CHANNEL_MAP[normalized] ??
    CHANNELS.find(
      (c) =>
        normalized.includes(c.name.toLowerCase()) ||
        c.name.toLowerCase().includes(normalized),
    )
  );
}
