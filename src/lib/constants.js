import TEAMS from '@data/teams.json';

// Age order across every season the league has played, oldest -> youngest.
// The roster changes between seasons (Joe replaced Daniel in Season 2), so this
// is the union of everyone who has ever played. Canonical team keys are ordered
// by this list, which is why it has to stay stable once a season is recorded.
export const ALL_PLAYERS = ['Joe', 'Jacob', 'Daniel', 'Joey', 'Nathan'];

const AGE_INDEX = Object.fromEntries(ALL_PLAYERS.map((p, i) => [p, i]));

// Canonical team key: older player first (lower age index).
export function teamKey(a, b) {
  return AGE_INDEX[a] < AGE_INDEX[b] ? `${a}-${b}` : `${b}-${a}`;
}

export function splitKey(key) {
  return key.split('-');
}

export function byAge(names) {
  return [...names].sort((a, b) => AGE_INDEX[a] - AGE_INDEX[b]);
}

// A season's four players in display order (age, oldest first).
// `season.roster` is stored in *slot* order, not age order - see pairingsFor.
export function playersFor(season) {
  return byAge(season.roster);
}

// The six duos a four-player roster can form, in canonical age order.
export function duoKeysFor(season) {
  const ordered = playersFor(season);
  const out = [];
  for (let i = 0; i < ordered.length; i++) {
    for (let j = i + 1; j < ordered.length; j++) {
      out.push(`${ordered[i]}-${ordered[j]}`);
    }
  }
  return out;
}

// The three duos a player belongs to, given that season's duo key list.
export function duosForPlayer(player, duoKeys) {
  return duoKeys.filter((k) => splitKey(k).includes(player));
}

// Partner lookup isn't defined for a duo the player isn't in; returns the other
// member otherwise.
export function partnerOf(player, duoKey) {
  const [a, b] = splitKey(duoKey);
  if (a === player) return b;
  if (b === player) return a;
  return null;
}

// NBA team colors per team name. The pair drives the team-bar gradient and the
// fallback round-logo background when the real PNG isn't loaded.
// `fg` is set when the secondary color is light enough that the placeholder
// letter needs a darker color on it.
const NAME_COLORS = {
  Celtics:   { primary: '#007A33', secondary: '#BA9653', initial: 'C' },
  Lakers:    { primary: '#552583', secondary: '#FDB927', initial: 'L' },
  Warriors:  { primary: '#1D428A', secondary: '#FFC72C', initial: 'W' },
  Heat:      { primary: '#98002E', secondary: '#F9A01B', initial: 'H' },
  Bucks:     { primary: '#00471B', secondary: '#EEE1C6', initial: 'B', fg: '#00471B' },
  Suns:      { primary: '#E56020', secondary: '#1D1160', initial: 'S' },
  Bulls:     { primary: '#CE1141', secondary: '#1D1D1D', initial: 'B' },
  Grizzlies: { primary: '#12173F', secondary: '#5D76A9', initial: 'G' },
  Thunder:   { primary: '#007AC1', secondary: '#EF3B24', initial: 'T' },
};

// Same shape as before, but keyed by duo so callers can go straight from a
// team key to its colors. Covers every duo in every season's roster.
export const TEAM_COLORS = Object.fromEntries(
  Object.entries(TEAMS).map(([duoKey, name]) => [duoKey, NAME_COLORS[name]])
);

export function teamGradient(duoKey, deg = 135, stop = '60%') {
  const c = TEAM_COLORS[duoKey];
  if (!c) return null;
  return `linear-gradient(${deg}deg, ${c.primary} ${stop}, ${c.secondary})`;
}

// Player accent gradients for avatars on pages that show player headshots in
// a colored ring (Leaders strip, Player Detail hero, etc.).
export const PLAYER_COLORS = {
  Joe:    { primary: '#14b8a6', secondary: '#0f766e' },
  Jacob:  { primary: '#4a90e2', secondary: '#2a5a9a' },
  Daniel: { primary: '#ef4444', secondary: '#991b1b' },
  Joey:   { primary: '#ff6b2b', secondary: '#a3471d' },
  Nathan: { primary: '#6b7280', secondary: '#374151' },
};

export function playerGradient(name, deg = 135) {
  const c = PLAYER_COLORS[name];
  if (!c) return null;
  return `linear-gradient(${deg}deg, ${c.primary}, ${c.secondary})`;
}

// Spec-defined weekly play order (rotates so no pairing is always rested or
// always tired). Used to render the Schedule and "Next Week" previews even
// when the season JSON only seeds the weeks played so far.
const ROTATION = {
  1: [1, 2, 3],
  2: [2, 3, 1],
  3: [3, 1, 2],
};

// A matchup_id is a fixed pairing of roster *slots*, not of names, so the same
// three matchups survive a roster change. `season.roster` is stored in slot
// order - [Jacob, <Daniel's slot>, <Joseph's slot>, Nathan] - which is why
// Season 2 lists Joe second even though he's the oldest player.
//
//   matchup_id 1 = slot0 + slot2  vs  slot1 + slot3
//   matchup_id 2 = slot0 + slot1  vs  slot2 + slot3
//   matchup_id 3 = slot0 + slot3  vs  slot1 + slot2
const SLOT_PAIRINGS = {
  1: [[0, 2], [1, 3]],
  2: [[0, 1], [2, 3]],
  3: [[0, 3], [1, 2]],
};

export function pairingsFor(season) {
  const slots = season.roster;
  return Object.fromEntries(
    Object.entries(SLOT_PAIRINGS).map(([id, [left, right]]) => [
      Number(id),
      [
        teamKey(slots[left[0]], slots[left[1]]),
        teamKey(slots[right[0]], slots[right[1]]),
      ],
    ])
  );
}

// Returns scheduled series for a given week in play order. Shape matches the
// data-driven series objects so the Scorecard renders them as upcoming.
export function scheduledSeriesForWeek(season, weekNum) {
  const order = ROTATION[weekNum];
  if (!order) return [];
  const pairing = pairingsFor(season);
  return order.map((matchup_id, idx) => {
    const [team1_key, team2_key] = pairing[matchup_id];
    return {
      season: season.season,
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
