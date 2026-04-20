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
