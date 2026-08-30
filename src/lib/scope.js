// Scope selection shared by the pages that offer a Season / Career toggle.
//
// The roster changed between seasons (Joe replaced Daniel in Season 2), so a
// team or player can exist in one season and not another. `defaultScopeFor`
// picks the most recent season a key actually appears in, which is what keeps
// Season 1's Celtics / Bucks / Heat and Daniel's own page reachable.

import { SEASONS, CURRENT_SEASON } from './data.js';
import { computeSeason, computeCareer } from './stats.js';

export const CAREER = 'career';

export const scopeForSeason = (season) => `s${season.season}`;

export const SCOPE_OPTIONS = [
  ...SEASONS.map((s) => ({ value: scopeForSeason(s), label: `S${s.season}` })),
  { value: CAREER, label: 'Career' },
];

export const DEFAULT_SCOPE = scopeForSeason(CURRENT_SEASON);

export function seasonForScope(scope) {
  if (scope === CAREER) return null;
  return SEASONS.find((s) => scopeForSeason(s) === scope) ?? CURRENT_SEASON;
}

export function scopeLabel(scope) {
  return scope === CAREER ? 'Career' : `Season ${seasonForScope(scope).season}`;
}

// computeSeason / computeCareer are pure over static JSON, so results are
// cached module-wide rather than recomputed per component.
const cache = new Map();

export function computedForScope(scope) {
  if (!cache.has(scope)) {
    cache.set(
      scope,
      scope === CAREER ? computeCareer(SEASONS) : computeSeason(seasonForScope(scope))
    );
  }
  return cache.get(scope);
}

// Most recent scope in which `predicate` holds for the season's computed stats,
// falling back to career when the key appears nowhere (shouldn't happen for a
// valid route, but keeps a bad URL from throwing).
function latestScopeWhere(predicate) {
  for (let i = SEASONS.length - 1; i >= 0; i--) {
    const scope = scopeForSeason(SEASONS[i]);
    if (predicate(computedForScope(scope))) return scope;
  }
  return CAREER;
}

export function defaultScopeForTeam(duoKey) {
  return latestScopeWhere((c) => c.duoKeys.includes(duoKey));
}

export function defaultScopeForPlayer(name) {
  return latestScopeWhere((c) => c.players.includes(name));
}

// Seasons a team / player actually appears in, for "Season 1 only" style notes.
export const seasonsForTeam = (duoKey) =>
  SEASONS.filter((s) => computedForScope(scopeForSeason(s)).duoKeys.includes(duoKey));

export const seasonsForPlayer = (name) =>
  SEASONS.filter((s) => computedForScope(scopeForSeason(s)).players.includes(name));
