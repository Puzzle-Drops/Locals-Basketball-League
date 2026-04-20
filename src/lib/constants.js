// Age order, oldest → youngest. Drives all team-key ordering and display order.
export const PLAYERS = ['Jacob', 'Daniel', 'Joseph', 'Nathan'];

const AGE_INDEX = Object.fromEntries(PLAYERS.map((p, i) => [p, i]));

// Canonical team key: older player first (lower age index).
export function teamKey(a, b) {
  return AGE_INDEX[a] < AGE_INDEX[b] ? `${a}-${b}` : `${b}-${a}`;
}

export function splitKey(key) {
  return key.split('-');
}

// All six duos in canonical age order.
export const DUO_KEYS = [
  'Jacob-Daniel',
  'Jacob-Joseph',
  'Jacob-Nathan',
  'Daniel-Joseph',
  'Daniel-Nathan',
  'Joseph-Nathan',
];

// For each player, the three duos they belong to, in display order.
export const PLAYER_DUOS = Object.fromEntries(
  PLAYERS.map((p) => [p, DUO_KEYS.filter((k) => splitKey(k).includes(p))])
);

// For each duo, the player that is NOT in it (partner lookup isn't defined
// for a duo; partnerOf(player, duo) returns the other member of the duo).
export function partnerOf(player, duoKey) {
  const [a, b] = splitKey(duoKey);
  if (a === player) return b;
  if (b === player) return a;
  return null;
}

// NBA team colors per duo. The pair drives the team-bar gradient and the
// fallback round-logo background when the real PNG isn't loaded.
// `[primary, secondary, fgOnSecondary?]` — `fgOnSecondary` is set when the
// secondary color is light enough that text needs a darker color on it
// (Bucks' cream secondary needs the dark green for the placeholder letter).
export const TEAM_COLORS = {
  'Jacob-Daniel':  { primary: '#007A33', secondary: '#BA9653', initial: 'C' }, // Celtics
  'Jacob-Joseph':  { primary: '#552583', secondary: '#FDB927', initial: 'L' }, // Lakers
  'Jacob-Nathan':  { primary: '#1D428A', secondary: '#FFC72C', initial: 'W' }, // Warriors
  'Daniel-Joseph': { primary: '#98002E', secondary: '#F9A01B', initial: 'H' }, // Heat
  'Daniel-Nathan': { primary: '#00471B', secondary: '#EEE1C6', initial: 'B', fg: '#00471B' }, // Bucks
  'Joseph-Nathan': { primary: '#E56020', secondary: '#1D1160', initial: 'S' }, // Suns
};

// Team name (from teams.json) keyed by duo for places that don't pass the
// full teams map.
export function teamGradient(duoKey, deg = 135, stop = '60%') {
  const c = TEAM_COLORS[duoKey];
  if (!c) return null;
  return `linear-gradient(${deg}deg, ${c.primary} ${stop}, ${c.secondary})`;
}

// Player accent gradients for avatars on pages that show player headshots in
// a colored ring (Leaders strip, Player Detail hero, etc.).
export const PLAYER_COLORS = {
  Jacob:  { primary: '#4a90e2', secondary: '#2a5a9a' },
  Daniel: { primary: '#ef4444', secondary: '#991b1b' },
  Joseph: { primary: '#ff6b2b', secondary: '#a3471d' },
  Nathan: { primary: '#6b7280', secondary: '#374151' },
};

export function playerGradient(name, deg = 135) {
  const c = PLAYER_COLORS[name];
  if (!c) return null;
  return `linear-gradient(${deg}deg, ${c.primary}, ${c.secondary})`;
}

// Spec-defined weekly play order (rotates so no pairing is always rested or
// always tired). Used to render the Schedule and "Next Week" previews even
// when the season JSON only seeds the current week.
//
//   matchup_id 1 = Lakers vs Bucks   (Jacob-Joseph vs Daniel-Nathan)
//   matchup_id 2 = Celtics vs Suns   (Jacob-Daniel vs Joseph-Nathan)
//   matchup_id 3 = Warriors vs Heat  (Jacob-Nathan vs Daniel-Joseph)
const ROTATION = {
  1: [1, 2, 3],
  2: [2, 3, 1],
  3: [3, 1, 2],
};

const PAIRING = {
  1: ['Jacob-Joseph', 'Daniel-Nathan'],
  2: ['Jacob-Daniel', 'Joseph-Nathan'],
  3: ['Jacob-Nathan', 'Daniel-Joseph'],
};

// Returns scheduled series for a given week in play order. Shape matches the
// data-driven series objects so the Scorecard renders them as upcoming.
export function scheduledSeriesForWeek(weekNum) {
  const order = ROTATION[weekNum];
  if (!order) return [];
  return order.map((matchup_id, idx) => {
    const [team1_key, team2_key] = PAIRING[matchup_id];
    return {
      week: weekNum,
      seriesNumber: idx + 1,
      matchup_id,
      team1_key,
      team2_key,
      status: 'upcoming',
      games: [],
      played: false,
      decided: false,
      winnerKey: null,
      t1Games: 0,
      t2Games: 0,
    };
  });
}

export const TOTAL_WEEKS = 3;
export const SERIES_PER_WEEK = 3;
