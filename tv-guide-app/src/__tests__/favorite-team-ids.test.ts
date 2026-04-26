import type { SportEvent, TeamInfo } from '@/lib/types';
import {
  eventMatchesAnyFavoriteTeam,
  normalizeLegacyFavoriteTeamIds,
  sameFavoriteIdSet,
} from '@/lib/favorite-team-ids';

describe('eventMatchesAnyFavoriteTeam', () => {
  const e: SportEvent = {
    id: 'x',
    title: 'A at B',
    sport: 'nba',
    league: 'NBA',
    channel: 'ESPN',
    startTime: '2026-01-01T20:00:00Z',
    status: 'live',
    homeTeamId: '9',
    awayTeamId: '1',
    availableServices: ['youtube-tv'],
  };

  it('matches namespaced id only in that sport', () => {
    expect(eventMatchesAnyFavoriteTeam(['mlb:9', 'nba:1'], e)).toBe(true);
  });

  it('does not match other sport for same raw ESPN id', () => {
    expect(eventMatchesAnyFavoriteTeam(['mlb:9'], e)).toBe(false);
  });

  it('supports legacy raw id (matches any league that uses that id)', () => {
    expect(eventMatchesAnyFavoriteTeam(['9'], e)).toBe(true);
  });

  it('returns false when no favorite ids are selected', () => {
    expect(eventMatchesAnyFavoriteTeam([], e)).toBe(false);
  });
});

describe('normalizeLegacyFavoriteTeamIds', () => {
  const teams: TeamInfo[] = [
    { sport: 'nba', league: 'NBA', teamId: 'nba:9', teamName: 'Warriors' },
    { sport: 'mlb', league: 'MLB', teamId: 'mlb:9', teamName: 'Twins' },
    { sport: 'nba', league: 'NBA', teamId: 'nba:1', teamName: 'Celtics' },
  ];

  it('replaces unique raw id with namespaced id', () => {
    const out = normalizeLegacyFavoriteTeamIds(teams, ['1']);
    expect(out).toEqual(['nba:1']);
  });

  it('drops ambiguous raw id (same id in multiple sports)', () => {
    const out = normalizeLegacyFavoriteTeamIds(teams, ['9']);
    expect(out).toEqual([]);
  });

  it('passes through already namespaced ids', () => {
    const out = normalizeLegacyFavoriteTeamIds(teams, ['nba:1', 'mlb:9']);
    expect(out).toEqual(['nba:1', 'mlb:9']);
  });

  it('keeps unmatched legacy raw ids', () => {
    const out = normalizeLegacyFavoriteTeamIds(teams, ['99']);
    expect(out).toEqual(['99']);
  });

  it('returns the same empty array when there is nothing to normalize', () => {
    const current: string[] = [];
    expect(normalizeLegacyFavoriteTeamIds(teams, current)).toBe(current);
  });

  it('ignores malformed namespaced team definitions when building raw lookup', () => {
    const out = normalizeLegacyFavoriteTeamIds(
      [{ sport: 'nba', league: 'NBA', teamId: 'malformed', teamName: 'Unknown' }],
      ['1'],
    );
    expect(out).toEqual(['1']);
  });
});

describe('sameFavoriteIdSet', () => {
  it('ignores order', () => {
    expect(sameFavoriteIdSet(['a', 'b'], ['b', 'a'])).toBe(true);
  });

  it('returns false when lengths differ', () => {
    expect(sameFavoriteIdSet(['a'], ['a', 'b'])).toBe(false);
  });
});
