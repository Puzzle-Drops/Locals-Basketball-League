// Pure stat engine for the Locals Basketball League.
//
// All functions take plain data (season JSON shapes + the teams map) and
// return plain objects. No I/O, no DOM, no React.
//
// Scoring convention (from spec):
//   - Team points are authoritative per game.
//   - Player points scored  = team points / 2
//   - Player points allowed = opponent points / 2
//   - DNP series award no wins, no points, and don't count toward averages.
//   - Partial series count played games; a series winner is only awarded if
//     the BO3 was mathematically decided (one team already has 2 game wins).

import { DUO_KEYS, PLAYERS, PLAYER_DUOS, partnerOf, splitKey } from './constants.js';

// ---------- helpers ----------

function blankDuoStats() {
  return {
    seriesWon: 0,
    seriesLost: 0,
    seriesPlayed: 0, // completed + decided-partial, excludes DNP
    gamesWon: 0,
    gamesLost: 0,
    gamesPlayed: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    blowouts: 0, // 20+ margin game wins
  };
}

function blankPlayerStats() {
  return {
    seriesWon: 0,
    seriesLost: 0,
    seriesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    gamesPlayed: 0,
    pointsScored: 0,
    pointsAllowed: 0,
    blowouts: 0,
    longestWinStreak: 0,
  };
}

function emptyH2H() {
  // For each duo, a map of opponentKey -> { seriesW, seriesL, gamesW, gamesL, pf, pa }
  const out = {};
  for (const k of DUO_KEYS) {
    out[k] = {};
    for (const other of DUO_KEYS) {
      if (other === k) continue;
      out[k][other] = { seriesW: 0, seriesL: 0, gamesW: 0, gamesL: 0, pf: 0, pa: 0 };
    }
  }
  return out;
}

// Count game wins within a series for each side, ignoring ties (shouldn't
// happen in a win-by-2 format but defensive).
function countGameWins(games) {
  let t1 = 0, t2 = 0;
  for (const g of games) {
    if (g.team1_score > g.team2_score) t1++;
    else if (g.team2_score > g.team1_score) t2++;
  }
  return [t1, t2];
}

// Given a series, return:
//   { played: bool, decided: bool, winnerKey: string|null, loserKey: string|null,
//     t1Games, t2Games, games: [...] }
function classifySeries(series) {
  if (series.status === 'dnp' || !series.games?.length) {
    return { played: false, decided: false, winnerKey: null, loserKey: null, t1Games: 0, t2Games: 0 };
  }
  const [t1, t2] = countGameWins(series.games);
  const decided = t1 >= 2 || t2 >= 2; // BO3 mathematically clinched
  let winnerKey = null, loserKey = null;
  if (decided) {
    winnerKey = t1 > t2 ? series.team1_key : series.team2_key;
    loserKey = t1 > t2 ? series.team2_key : series.team1_key;
  }
  return { played: true, decided, winnerKey, loserKey, t1Games: t1, t2Games: t2 };
}

// ---------- core aggregation ----------

// Given a season JSON, produce:
//   duoStats: { [key]: DuoStats }
//   h2h:      { [key]: { [opponentKey]: H2HRecord } }
//   playerStats: { [name]: PlayerStats }
//   seriesIndex: flat list of series with metadata for logs
export function computeSeason(season) {
  const duoStats = Object.fromEntries(DUO_KEYS.map((k) => [k, blankDuoStats()]));
  const h2h = emptyH2H();
  const playerStats = Object.fromEntries(PLAYERS.map((p) => [p, blankPlayerStats()]));
  const seriesIndex = [];

  // Per-player streak tracking: iterate games in order.
  const playerStreak = Object.fromEntries(PLAYERS.map((p) => [p, 0]));

  for (const week of season.weeks ?? []) {
    for (const series of week.series ?? []) {
      const { team1_key, team2_key } = series;
      const cls = classifySeries(series);
      seriesIndex.push({
        season: season.season,
        week: week.week,
        matchup_id: series.matchup_id,
        team1_key,
        team2_key,
        status: series.status,
        games: series.games,
        ...cls,
      });

      if (!cls.played) continue;

      const t1 = duoStats[team1_key];
      const t2 = duoStats[team2_key];
      const h1 = h2h[team1_key][team2_key];
      const h2 = h2h[team2_key][team1_key];

      // Per-game aggregation.
      for (const g of series.games) {
        const s1 = g.team1_score;
        const s2 = g.team2_score;
        const margin = Math.abs(s1 - s2);
        const t1Won = s1 > s2;
        const t2Won = s2 > s1;

        t1.gamesPlayed++; t2.gamesPlayed++;
        t1.pointsFor += s1; t1.pointsAgainst += s2;
        t2.pointsFor += s2; t2.pointsAgainst += s1;
        if (t1Won) { t1.gamesWon++; t2.gamesLost++; if (margin >= 20) t1.blowouts++; }
        if (t2Won) { t2.gamesWon++; t1.gamesLost++; if (margin >= 20) t2.blowouts++; }

        h1.gamesW += t1Won ? 1 : 0; h1.gamesL += t2Won ? 1 : 0;
        h1.pf += s1; h1.pa += s2;
        h2.gamesW += t2Won ? 1 : 0; h2.gamesL += t1Won ? 1 : 0;
        h2.pf += s2; h2.pa += s1;

        // Per-player: each game touches 4 players (2 per duo).
        for (const p of splitKey(team1_key)) {
          const ps = playerStats[p];
          ps.gamesPlayed++;
          ps.pointsScored += s1 / 2;
          ps.pointsAllowed += s2 / 2;
          if (t1Won) {
            ps.gamesWon++;
            if (margin >= 20) ps.blowouts++;
            playerStreak[p]++;
            ps.longestWinStreak = Math.max(ps.longestWinStreak, playerStreak[p]);
          } else if (t2Won) {
            ps.gamesLost++;
            playerStreak[p] = 0;
          }
        }
        for (const p of splitKey(team2_key)) {
          const ps = playerStats[p];
          ps.gamesPlayed++;
          ps.pointsScored += s2 / 2;
          ps.pointsAllowed += s1 / 2;
          if (t2Won) {
            ps.gamesWon++;
            if (margin >= 20) ps.blowouts++;
            playerStreak[p]++;
            ps.longestWinStreak = Math.max(ps.longestWinStreak, playerStreak[p]);
          } else if (t1Won) {
            ps.gamesLost++;
            playerStreak[p] = 0;
          }
        }
      }

      // Series-level: only award if decided.
      if (cls.decided) {
        t1.seriesPlayed++; t2.seriesPlayed++;
        if (cls.winnerKey === team1_key) {
          t1.seriesWon++; t2.seriesLost++;
          h1.seriesW++; h2.seriesL++;
        } else {
          t2.seriesWon++; t1.seriesLost++;
          h2.seriesW++; h1.seriesL++;
        }
        // Per-player series tally.
        for (const p of splitKey(cls.winnerKey)) playerStats[p].seriesWon++;
        for (const p of splitKey(cls.loserKey)) playerStats[p].seriesLost++;
        for (const p of splitKey(team1_key)) playerStats[p].seriesPlayed++;
        for (const p of splitKey(team2_key)) playerStats[p].seriesPlayed++;
      }
    }
  }

  return { duoStats, h2h, playerStats, seriesIndex };
}

// Merge per-season duoStats dicts into a single career totals dict.
function mergeDuoStats(listOfDicts) {
  const out = Object.fromEntries(DUO_KEYS.map((k) => [k, blankDuoStats()]));
  for (const dict of listOfDicts) {
    for (const k of DUO_KEYS) {
      const s = out[k]; const a = dict[k];
      if (!a) continue;
      for (const f of Object.keys(s)) s[f] += a[f];
    }
  }
  return out;
}

function mergePlayerStats(listOfDicts) {
  const out = Object.fromEntries(PLAYERS.map((p) => [p, blankPlayerStats()]));
  for (const dict of listOfDicts) {
    for (const p of PLAYERS) {
      const s = out[p]; const a = dict[p];
      if (!a) continue;
      s.seriesWon += a.seriesWon;
      s.seriesLost += a.seriesLost;
      s.seriesPlayed += a.seriesPlayed;
      s.gamesWon += a.gamesWon;
      s.gamesLost += a.gamesLost;
      s.gamesPlayed += a.gamesPlayed;
      s.pointsScored += a.pointsScored;
      s.pointsAllowed += a.pointsAllowed;
      s.blowouts += a.blowouts;
      // Longest win streak needs game-by-game recomputation to be exact
      // across seasons; for now keep the max per-season streak as an
      // approximation. (Accurate enough once real season boundaries
      // reflect real time, which they currently don't.)
      s.longestWinStreak = Math.max(s.longestWinStreak, a.longestWinStreak);
    }
  }
  return out;
}

function mergeH2H(listOfDicts) {
  const out = emptyH2H();
  for (const dict of listOfDicts) {
    for (const k of DUO_KEYS) {
      for (const other of DUO_KEYS) {
        if (other === k) continue;
        const dst = out[k][other]; const src = dict[k]?.[other];
        if (!src) continue;
        dst.seriesW += src.seriesW;
        dst.seriesL += src.seriesL;
        dst.gamesW += src.gamesW;
        dst.gamesL += src.gamesL;
        dst.pf += src.pf;
        dst.pa += src.pa;
      }
    }
  }
  return out;
}

// Given one or more seasons, return career-level aggregates + per-season breakdown.
export function computeCareer(seasons) {
  const perSeason = seasons.map((s) => ({ season: s.season, ...computeSeason(s) }));
  const duoStats = mergeDuoStats(perSeason.map((p) => p.duoStats));
  const playerStats = mergePlayerStats(perSeason.map((p) => p.playerStats));
  const h2h = mergeH2H(perSeason.map((p) => p.h2h));
  const seriesIndex = perSeason.flatMap((p) => p.seriesIndex);
  return { duoStats, playerStats, h2h, seriesIndex, perSeason };
}

// ---------- derived views ----------

// Decorate raw duoStats with computed rates + diff for display.
export function decorateDuo(key, raw) {
  const diff = raw.pointsFor - raw.pointsAgainst;
  const seriesWinPct = raw.seriesPlayed ? raw.seriesWon / raw.seriesPlayed : 0;
  const gameWinPct = raw.gamesPlayed ? raw.gamesWon / raw.gamesPlayed : 0;
  const avgMargin = raw.gamesPlayed ? diff / raw.gamesPlayed : 0;
  const avgPF = raw.gamesPlayed ? raw.pointsFor / raw.gamesPlayed : 0;
  const avgPA = raw.gamesPlayed ? raw.pointsAgainst / raw.gamesPlayed : 0;
  return { key, ...raw, diff, seriesWinPct, gameWinPct, avgMargin, avgPF, avgPA };
}

export function decoratePlayer(name, raw) {
  const plusMinus = raw.pointsScored - raw.pointsAllowed;
  const seriesWinPct = raw.seriesPlayed ? raw.seriesWon / raw.seriesPlayed : 0;
  const gameWinPct = raw.gamesPlayed ? raw.gamesWon / raw.gamesPlayed : 0;
  const ppg = raw.gamesPlayed ? raw.pointsScored / raw.gamesPlayed : 0;
  const papg = raw.gamesPlayed ? raw.pointsAllowed / raw.gamesPlayed : 0;
  const pps = raw.seriesPlayed ? raw.pointsScored / raw.seriesPlayed : 0;
  return { name, ...raw, plusMinus, seriesWinPct, gameWinPct, ppg, papg, pps };
}

// Sort a list of decorated duos applying LBL tiebreakers:
//   1) series wins
//   2) head-to-head series record (within the tied subset)
//   3) point differential
// `h2h` is the merged head-to-head dict.
export function sortDuosWithTiebreakers(decoratedDuos, h2h) {
  // Primary sort by series wins desc, then point diff desc as fallback.
  const byGroup = new Map();
  for (const d of decoratedDuos) {
    const g = byGroup.get(d.seriesWon) ?? [];
    g.push(d);
    byGroup.set(d.seriesWon, g);
  }
  const groups = [...byGroup.entries()].sort((a, b) => b[0] - a[0]);

  const out = [];
  for (const [, group] of groups) {
    if (group.length === 1) { out.push(group[0]); continue; }
    // Within the tied group, sort by head-to-head series record (wins within
    // the group minus losses within the group), then by overall point diff.
    const h2hScore = (d) => {
      let s = 0;
      for (const other of group) {
        if (other.key === d.key) continue;
        const rec = h2h[d.key]?.[other.key];
        if (rec) s += rec.seriesW - rec.seriesL;
      }
      return s;
    };
    group.sort((a, b) => {
      const hs = h2hScore(b) - h2hScore(a);
      if (hs !== 0) return hs;
      return b.diff - a.diff;
    });
    out.push(...group);
  }
  return out;
}

// Best/worst partner per player (by game win%). Returns { best, worst } or nulls
// if the player has no decided games yet.
export function partnerBreakdown(player, perSeasonOrCareerDuoStats) {
  const entries = PLAYER_DUOS[player].map((duoKey) => {
    const s = perSeasonOrCareerDuoStats[duoKey];
    const partner = partnerOf(player, duoKey);
    const wp = s.gamesPlayed ? s.gamesWon / s.gamesPlayed : null;
    return { duoKey, partner, ...s, winPct: wp };
  });
  const played = entries.filter((e) => e.gamesPlayed > 0);
  if (played.length === 0) return { entries, best: null, worst: null };
  const sorted = [...played].sort((a, b) => b.winPct - a.winPct);
  return {
    entries,
    best: sorted[0],
    worst: sorted[sorted.length - 1],
  };
}

// Convenience: full decorated standings for a duoStats dict.
export function standings(duoStats, h2h) {
  const decorated = DUO_KEYS.map((k) => decorateDuo(k, duoStats[k]));
  return sortDuosWithTiebreakers(decorated, h2h);
}

// Round helper for display.
export function fmt1(n) {
  return (Math.round(n * 10) / 10).toFixed(1);
}
