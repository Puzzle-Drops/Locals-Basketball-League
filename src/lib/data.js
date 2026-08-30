// Static data wiring. Add future seasons by importing season3.json, etc.,
// and pushing into SEASONS in chronological order.

import season1 from '@data/season1.json';
import season2 from '@data/season2.json';
import teamsMap from '@data/teams.json';

export const SEASONS = [season1, season2];
export const TEAMS = teamsMap;

export const CURRENT_SEASON = SEASONS[SEASONS.length - 1];

export function getSeason(num) {
  return SEASONS.find((s) => s.season === Number(num));
}

// Locate a single game across all seasons.
// Returns { season, week, series, game } or null.
export function findGame(seasonNum, weekNum, matchupId, gameNum) {
  const season = getSeason(seasonNum);
  if (!season) return null;
  const week = season.weeks.find((w) => w.week === Number(weekNum));
  if (!week) return null;
  const series = week.series.find((s) => s.matchup_id === Number(matchupId));
  if (!series) return null;
  const game = series.games.find((g) => g.game === Number(gameNum));
  if (!game) return null;
  return { season, week, series, game };
}

// Resolve the public asset URL for a logo, respecting Vite's BASE_URL.
export function assetUrl(path) {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}

export function teamLogo(duoKey) {
  const name = TEAMS[duoKey];
  return name ? assetUrl(`teams/${name}.png`) : null;
}

export function playerPortrait(name) {
  return assetUrl(`players/${name}.png`);
}

export function leagueLogo() {
  return assetUrl('league/LBL.png');
}
