// Deterministic coinflip helper for tiebreakers.
//
// When two duos are truly identical on every quantitative criterion
// (e.g. seeding ties on game wins / h2h / +/-, or a playoff bracket
// matchup with identical +/-), we need a tiebreaker. Per the spec the
// final fallback is a coinflip.
//
// Two layers:
//   1. Optional override: if the season's `coinflips` map has a recorded
//      result for this pairing, that wins. Use this when the league
//      actually flips a coin in real life and wants to record it.
//   2. Seeded fallback: if no override, hash the two duo keys (sorted)
//      plus a context salt and use the result. Same input always returns
//      the same output, so the page never flickers on refresh.

const HASH_SEED = 5381;

function hash(str) {
  let h = HASH_SEED;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) + str.charCodeAt(i);
    h = h | 0; // force int32
  }
  return h >>> 0; // unsigned
}

// `salt` should encode the context (season, round, etc.) so unrelated
// matchups don't share an outcome. e.g. `s1:semifinal` vs `s1:final`.
export function seededWinner(duoA, duoB, salt = '') {
  const sorted = [duoA, duoB].slice().sort();
  const h = hash(`${sorted[0]}__${sorted[1]}__${salt}`);
  return sorted[h & 1];
}

// Returns the recorded winner from `season.coinflips` if there is one
// for this pairing, otherwise null. The map is keyed by the two duo
// keys joined by `__` in sorted order.
export function overrideWinner(coinflips, duoA, duoB) {
  if (!coinflips) return null;
  const sorted = [duoA, duoB].slice().sort();
  return coinflips[`${sorted[0]}__${sorted[1]}`] ?? null;
}

// One-stop helper: returns the winner duo key, preferring an explicit
// override over the seeded fallback.
export function resolveCoinflip(duoA, duoB, { coinflips, salt = '' } = {}) {
  return overrideWinner(coinflips, duoA, duoB) ?? seededWinner(duoA, duoB, salt);
}
