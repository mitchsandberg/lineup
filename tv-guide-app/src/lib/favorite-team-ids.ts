import type { SportEvent, TeamInfo } from './types';

/**
 * ESPN `team.id` is only unique *within* a sport. We store favorites as
 * `sport:rawEspinId` so the same number (e.g. "9" for Warriors and Twins) never
 * collides across leagues.
 */
export function eventMatchesAnyFavoriteTeam(favIds: string[], e: SportEvent): boolean {
  if (favIds.length === 0) return false;
  for (const fav of favIds) {
    if (fav.includes(':')) {
      const colon = fav.indexOf(':');
      const sport = fav.slice(0, colon);
      const raw = fav.slice(colon + 1);
      if (e.sport === sport && (e.homeTeamId === raw || e.awayTeamId === raw)) {
        return true;
      }
    } else {
      if (e.homeTeamId === fav || e.awayTeamId === fav) {
        return true;
      }
    }
  }
  return false;
}

/** `true` when the two string arrays are the same set (order independent). */
export function sameFavoriteIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(b);
  return a.every((x) => s.has(x));
}

/**
 * Rewrites pre‑namespaced `favoriteTeams` (raw ESPN ids) into `sport:raw` where
 * possible. Drops ambiguous raw ids (same id in multiple sports).
 */
export function normalizeLegacyFavoriteTeamIds(teams: TeamInfo[], current: string[]): string[] {
  if (current.length === 0) return current;

  const byRaw = new Map<string, TeamInfo[]>();
  for (const t of teams) {
    const i = t.teamId.indexOf(':');
    if (i < 0) continue;
    const raw = t.teamId.slice(i + 1);
    const list = byRaw.get(raw) ?? [];
    list.push(t);
    byRaw.set(raw, list);
  }

  const out: string[] = [];
  for (const id of current) {
    if (id.includes(':')) {
      out.push(id);
      continue;
    }
    const matches = byRaw.get(id) ?? [];
    if (matches.length === 1) {
      out.push(matches[0].teamId);
    } else if (matches.length > 1) {
      // Ambiguous legacy id; drop (user re-selects if they still want it)
    } else {
      out.push(id);
    }
  }
  return out;
}
