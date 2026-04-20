import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON, TEAMS } from '../lib/data.js';
import {
  computeSeason, decorateDuo, decoratePlayer, fmt1, signed,
} from '../lib/stats.js';
import { PLAYERS, DUO_KEYS, splitKey } from '../lib/constants.js';
import Seg from '../components/Seg.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import PlayerAvatar from '../components/PlayerAvatar.jsx';
import Pill from '../components/Pill.jsx';

// Stat rows: array of { key, label, extract, higherIsBetter }
// `extract` reads a raw decorated record and returns { value, numeric } where
// `numeric` is what we use to decide the winner.
const PLAYER_ROWS = [
  { key: 'games',   label: 'Games',         extract: (p) => ({ value: `${p.gamesWon}-${p.gamesLost}`,   numeric: p.gamesWon }) },
  { key: 'series',  label: 'Series',        extract: (p) => ({ value: `${p.seriesWon}-${p.seriesLost}`, numeric: p.seriesWon }) },
  { key: 'pts',     label: 'Points Scored', extract: (p) => ({ value: fmt1(p.pointsScored),             numeric: p.pointsScored }) },
  { key: 'pa',      label: 'Points Allowed',extract: (p) => ({ value: fmt1(p.pointsAllowed),            numeric: p.pointsAllowed }), higherIsBetter: false },
  { key: 'pm',      label: '+/-',           extract: (p) => ({ value: signedDecimal(p.plusMinus),       numeric: p.plusMinus }) },
  { key: 'ppg',     label: 'PPG',           extract: (p) => ({ value: fmt1(p.ppg),                      numeric: p.ppg }) },
  { key: 'papg',    label: 'PAPG',          extract: (p) => ({ value: fmt1(p.papg),                     numeric: p.papg }), higherIsBetter: false },
  { key: 'pps',     label: 'Pts/Series',    extract: (p) => ({ value: fmt1(p.pps),                      numeric: p.pps }) },
  { key: 'winpct',  label: 'Game Win %',    extract: (p) => ({ value: `${Math.round(p.gameWinPct*100)}%`, numeric: p.gameWinPct }) },
  { key: 'streak',  label: 'Longest Streak',extract: (p) => ({ value: String(p.longestWinStreak),       numeric: p.longestWinStreak }) },
  { key: 'blow',    label: 'Blowouts',      extract: (p) => ({ value: String(p.blowouts),               numeric: p.blowouts }) },
];

const TEAM_ROWS = [
  { key: 'games',   label: 'Games',         extract: (d) => ({ value: `${d.gamesWon}-${d.gamesLost}`,   numeric: d.gamesWon }) },
  { key: 'series',  label: 'Series',        extract: (d) => ({ value: `${d.seriesWon}-${d.seriesLost}`, numeric: d.seriesWon }) },
  { key: 'pf',      label: 'Points For',    extract: (d) => ({ value: String(d.pointsFor),              numeric: d.pointsFor }) },
  { key: 'pa',      label: 'Points Against',extract: (d) => ({ value: String(d.pointsAgainst),          numeric: d.pointsAgainst }), higherIsBetter: false },
  { key: 'diff',    label: '+/-',           extract: (d) => ({ value: signed(d.diff),                   numeric: d.diff }) },
  { key: 'ppg',     label: 'PPG',           extract: (d) => ({ value: fmt1(d.ppg),                      numeric: d.ppg }) },
  { key: 'papg',    label: 'PAPG',          extract: (d) => ({ value: fmt1(d.papg),                     numeric: d.papg }), higherIsBetter: false },
  { key: 'avgmar',  label: 'Avg Margin',    extract: (d) => ({ value: signedDecimal(d.avgMarginGame),   numeric: d.avgMarginGame }) },
  { key: 'winpct',  label: 'Game Win %',    extract: (d) => ({ value: `${Math.round(d.gameWinPct*100)}%`, numeric: d.gameWinPct }) },
  { key: 'blow',    label: 'Blowouts',      extract: (d) => ({ value: String(d.blowouts),               numeric: d.blowouts }) },
];

function signedDecimal(n) {
  if (n === 0) return '0.0';
  const f = fmt1(n);
  return n > 0 ? `+${f}` : f;
}

export default function Compare() {
  const computed = useMemo(() => computeSeason(CURRENT_SEASON), []);
  const [type, setType] = useState('players');

  const playerOptions = PLAYERS.map((p) => ({ id: p, label: p }));
  const teamOptions = DUO_KEYS.map((k) => ({ id: k, label: TEAMS[k] }));
  const options = type === 'players' ? playerOptions : teamOptions;

  const [leftId, setLeftId] = useState(playerOptions[0].id);
  const [rightId, setRightId] = useState(playerOptions[1].id);

  // When switching type, reset both selections to the first two of that type.
  function onTypeChange(next) {
    setType(next);
    const opts = next === 'players' ? playerOptions : teamOptions;
    setLeftId(opts[0].id);
    setRightId(opts[1].id);
  }

  const left = entityFor(type, leftId, computed);
  const right = entityFor(type, rightId, computed);
  const rows = type === 'players' ? PLAYER_ROWS : TEAM_ROWS;

  return (
    <>
      {/* HERO */}
      <section className="court-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Pill variant="accent">Head to Head</Pill>
              <span className="text-[11px] tracking-[0.16em] uppercase text-[var(--text-muted)] font-semibold">
                Season {CURRENT_SEASON.season}
              </span>
            </div>
            <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide mb-3">COMPARE</h1>
            <p className="text-[var(--text-muted)] text-base md:text-lg max-w-xl mb-5">
              Pick two and see them side by side. Winner for each stat shows in accent.
            </p>
            <Seg
              value={type}
              onChange={onTypeChange}
              options={[
                { value: 'players', label: 'Players' },
                { value: 'teams', label: 'Teams' },
              ]}
            />
          </div>
        </div>
      </section>

      {/* PICKERS */}
      <section className="max-w-6xl mx-auto px-5 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Picker type={type} options={options} value={leftId} onChange={setLeftId} side="left" />
          <Picker type={type} options={options} value={rightId} onChange={setRightId} side="right" />
        </div>
      </section>

      {/* STATS TABLE */}
      <section className="max-w-6xl mx-auto px-5 pt-6 pb-16">
        <div className="card overflow-hidden">
          {rows.map((row, i) => {
            const L = row.extract(left);
            const R = row.extract(right);
            const higherIsBetter = row.higherIsBetter ?? true;
            let winner = null;
            if (L.numeric !== R.numeric) {
              const leftWins = higherIsBetter ? L.numeric > R.numeric : L.numeric < R.numeric;
              winner = leftWins ? 'left' : 'right';
            }
            return (
              <div
                key={row.key}
                className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 ${i < rows.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
              >
                <div className={`text-right display font-bold text-lg tabular ${winner === 'left' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                  {L.value}
                </div>
                <div className="stat-label text-center min-w-[96px]">{row.label}</div>
                <div className={`text-left display font-bold text-lg tabular ${winner === 'right' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                  {R.value}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 text-[11px] text-[var(--text-dim)]">
          Accent value wins the stat. Equal values show both in muted. Points Allowed and PAPG: lower is better.
        </div>
      </section>
    </>
  );
}

function entityFor(type, id, computed) {
  if (type === 'players') {
    return decoratePlayer(id, computed.playerStats[id]);
  }
  return decorateDuo(id, computed.duoStats[id]);
}

function Picker({ type, options, value, onChange, side }) {
  const selected = options.find((o) => o.id === value);
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-4">
        {type === 'players' ? (
          <PlayerAvatar name={value} size={48} />
        ) : (
          <TeamLogo duoKey={value} size={48} />
        )}
        <div className="flex-1 min-w-0">
          <div className="stat-label mb-1">{side === 'left' ? 'First' : 'Second'}</div>
          <div className="display font-black text-2xl leading-none">{selected?.label?.toUpperCase()}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
            {type === 'players' ? 'Player' : splitKey(value).join(' & ')}
          </div>
        </div>
      </div>
      <label className="block">
        <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-[0.12em] uppercase">Pick</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-md px-3 py-2 text-sm font-semibold text-[var(--text)] focus:outline-none focus:border-[var(--accent-ring)] transition"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </label>
      {type === 'players' ? (
        <Link to={`/players/${value}`} className="inline-block mt-3 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] uppercase tracking-[0.12em] transition">
          View player →
        </Link>
      ) : (
        <Link to={`/teams/${value}`} className="inline-block mt-3 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] uppercase tracking-[0.12em] transition">
          View team →
        </Link>
      )}
    </div>
  );
}
