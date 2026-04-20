import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON, SEASONS, TEAMS } from '../lib/data.js';
import {
  computeSeason, computeCareer, decorateDuo, standings as canonicalStandings,
  fmt1, playedGames,
} from '../lib/stats.js';
import { splitKey } from '../lib/constants.js';
import TeamLogo from '../components/TeamLogo.jsx';
import Seg from '../components/Seg.jsx';

const DEFAULT_SORT = { key: 'rank', dir: 'asc' };

// Columns whose displayed value depends on the Games / Series view toggle.
const VIEW_DEPENDENT = new Set(['w', 'l', 'pp', 'pap', 'avg', 'winpct']);

function rowFor(d, rank) {
  return {
    key: d.key,
    rank,
    team: TEAMS[d.key] ?? d.key,
    duoKey: d.key,
    isDnp: d.gamesPlayed === 0,
    w_games: d.gamesWon,
    w_series: d.seriesWon,
    l_games: d.gamesLost,
    l_series: d.seriesLost,
    pf: d.pointsFor,
    pp_games: d.ppg,
    pp_series: d.pps,
    pa: d.pointsAgainst,
    pap_games: d.papg,
    pap_series: d.paps,
    diff: d.diff,
    avg_games: d.avgMarginGame,
    avg_series: d.avgMarginSeries,
    winpct_games: d.gameWinPct * 100,
    winpct_series: d.seriesWinPct * 100,
  };
}

function attrForKey(key, view) {
  return VIEW_DEPENDENT.has(key) ? `${key}_${view}` : key;
}

function compareRows(a, b, key, dir, view) {
  let cmp;
  if (key === 'team') {
    cmp = a.team.localeCompare(b.team);
  } else {
    cmp = (a[attrForKey(key, view)] ?? 0) - (b[attrForKey(key, view)] ?? 0);
  }
  if (cmp === 0) cmp = a.rank - b.rank; // stable tiebreak
  return dir === 'asc' ? cmp : -cmp;
}

export default function Standings() {
  const seasonComputed = useMemo(() => computeSeason(CURRENT_SEASON), []);
  const careerComputed = useMemo(() => computeCareer(SEASONS), []);

  const [scope, setScope] = useState('season');
  const [view, setView] = useState('games');
  const [sort, setSort] = useState(DEFAULT_SORT);

  const computed = scope === 'season' ? seasonComputed : careerComputed;

  // Canonical ranking (game wins -> h2h series -> point diff)
  const canonicalRows = useMemo(
    () => canonicalStandings(computed.duoStats, computed.h2h),
    [computed]
  );
  const baseRows = useMemo(
    () => canonicalRows.map((d, i) => rowFor(d, i + 1)),
    [canonicalRows]
  );

  // Apply ad-hoc sort on top of the canonical rows.
  const sortedRows = useMemo(() => {
    const arr = [...baseRows];
    arr.sort((a, b) => compareRows(a, b, sort.key, sort.dir, view));
    return arr;
  }, [baseRows, sort, view]);

  function clickHeader(key) {
    setSort((s) => {
      if (s.key === key) {
        if (s.dir === 'asc') return { key, dir: 'desc' };
        return { ...DEFAULT_SORT };
      }
      return { key, dir: 'asc' };
    });
  }

  const totalGames = playedGames(computed.seriesIndex).length;
  const seriesComplete = computed.seriesIndex.filter((s) => s.decided).length;

  return (
    <>
      {/* HERO */}
      <section className="court-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" />
          <div className="relative">
            <div className="stat-label mb-2">Season {CURRENT_SEASON.season} · 2026</div>
            <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide mb-5">STANDINGS</h1>

            <div className="flex flex-col gap-2">
              <HeroStat value={6} label="Teams" />
              <HeroStat value={totalGames} label="Games Played" />
              <HeroStat value={seriesComplete} label="Series Complete" />
            </div>
          </div>
        </div>
      </section>

      {/* CONTROLS */}
      <section className="max-w-6xl mx-auto px-5 pt-8">
        <div className="flex flex-wrap gap-4">
          <ControlGroup label="Scope">
            <Seg
              value={scope}
              onChange={setScope}
              options={[
                { value: 'season', label: `Season ${CURRENT_SEASON.season}` },
                { value: 'career', label: 'Career' },
              ]}
              className="w-48"
            />
          </ControlGroup>
          <ControlGroup label="View">
            <Seg
              value={view}
              onChange={setView}
              options={[
                { value: 'games', label: 'Games' },
                { value: 'series', label: 'Series' },
              ]}
              className="w-48"
            />
          </ControlGroup>
        </div>
      </section>

      {/* TABLE */}
      <section className="max-w-6xl mx-auto px-5 pt-6 pb-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="standings-table min-w-[760px]" data-mode={view}>
              {/* Header row */}
              <div className="standings-header flex items-center border-b border-[var(--border)] text-[10px] tracking-[0.12em] uppercase font-bold text-[var(--text-muted)]">
                <div className="frozen-col flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
                  <SortHeader sort={sort} onClick={clickHeader} sortKey="rank" className="w-6 text-center">#</SortHeader>
                  <SortHeader sort={sort} onClick={clickHeader} sortKey="team" className="w-[140px] sm:w-[180px]">Team</SortHeader>
                </div>
                <SortHeader sort={sort} onClick={clickHeader} sortKey="w" className="w-10 text-center shrink-0 py-3">W</SortHeader>
                <SortHeader sort={sort} onClick={clickHeader} sortKey="l" className="w-10 text-center shrink-0 py-3">L</SortHeader>
                <SortHeader sort={sort} onClick={clickHeader} sortKey="pf" className="w-14 text-right shrink-0 py-3">PF</SortHeader>
                <SortHeader sort={sort} onClick={clickHeader} sortKey="pp" className="w-14 text-right shrink-0 py-3">
                  <span className="val-games">PPG</span><span className="val-series">PPS</span>
                </SortHeader>
                <SortHeader sort={sort} onClick={clickHeader} sortKey="pa" className="w-14 text-right shrink-0 py-3">PA</SortHeader>
                <SortHeader sort={sort} onClick={clickHeader} sortKey="pap" className="w-14 text-right shrink-0 py-3">
                  <span className="val-games">PAPG</span><span className="val-series">PAPS</span>
                </SortHeader>
                <SortHeader sort={sort} onClick={clickHeader} sortKey="diff" className="w-14 text-right shrink-0 py-3">+/-</SortHeader>
                <SortHeader sort={sort} onClick={clickHeader} sortKey="avg" className="w-14 text-right shrink-0 py-3">
                  <span className="val-games">AVG/G</span><span className="val-series">AVG/S</span>
                </SortHeader>
                <SortHeader sort={sort} onClick={clickHeader} sortKey="winpct" className="w-16 text-right shrink-0 py-3 pr-3 sm:pr-4">Win%</SortHeader>
              </div>

              {sortedRows.map((row) => (
                <Row key={row.key} row={row} />
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-col gap-2 text-[11px] text-[var(--text-dim)]">
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Legend label="W/L">Wins / Losses</Legend>
            <Legend label="PF">Points For</Legend>
            <Legend label="PPG/PPS">Points per Game/Series</Legend>
            <Legend label="PA">Points Against</Legend>
            <Legend label="PAPG/PAPS">Points Against per Game/Series</Legend>
            <Legend label="+/-">Point Differential</Legend>
            <Legend label="AVG/G, AVG/S">Avg Point Diff per Game/Series</Legend>
            <Legend label="Win%">Win Percentage</Legend>
          </div>
          <div>
            <span className="text-[var(--text-muted)] font-bold">Ranked by games won.</span> Ties broken by head-to-head series record, then point differential.{' '}
            <span className="text-[var(--accent)] font-bold">Top 4 advance to the playoffs.</span>{' '}
            Click any column header to sort (asc → desc → default).
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStat({ value, label }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="display font-black text-2xl tabular w-7 text-right">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function ControlGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-[0.12em] uppercase">{label}</span>
      {children}
    </div>
  );
}

function SortHeader({ sort, onClick, sortKey, className = '', children }) {
  const sortedClass = sort.key === sortKey ? `sorted-${sort.dir}` : '';
  return (
    <button
      type="button"
      className={`sortable ${className} ${sortedClass}`.trim()}
      onClick={() => onClick(sortKey)}
      data-sort={sortKey}
    >
      {children}
    </button>
  );
}

function Row({ row }) {
  const players = splitKey(row.duoKey).join(' & ');
  const dimCls = row.isDnp ? 'text-[var(--text-dim)]' : '';
  const diffCls = row.isDnp ? 'text-[var(--text-dim)]' : (row.diff > 0 ? 'diff-pos' : row.diff < 0 ? 'diff-neg' : '');

  return (
    <Link
      to={`/teams/${row.duoKey}`}
      className={`standings-row flex items-center group ${row.isDnp ? 'opacity-80' : ''}`}
    >
      <div className="frozen-col flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3.5">
        <span className={`rank w-6 ${row.rank === 1 ? 'top' : ''}`}>{row.rank}</span>
        <div className="w-[140px] sm:w-[180px] min-w-0 flex items-center gap-2 sm:gap-3">
          <TeamLogo duoKey={row.duoKey} size={32} />
          <div className="min-w-0">
            <div className="leading-none flex items-baseline gap-1.5">
              <span className="display font-black text-base group-hover:text-[var(--accent)] transition">
                {row.team.toUpperCase()}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-bold tabular">
                (<span className="val-games">{row.w_games}-{row.l_games}</span><span className="val-series">{row.w_series}-{row.l_series}</span>)
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] truncate mt-1">{players}</div>
          </div>
        </div>
      </div>

      <Cell className="w-10 text-center" cls={dimCls}>
        <span className="val-games">{row.w_games}</span><span className="val-series">{row.w_series}</span>
      </Cell>
      <Cell className="w-10 text-center" cls={`text-[var(--text-muted)] ${dimCls}`}>
        <span className="val-games">{row.l_games}</span><span className="val-series">{row.l_series}</span>
      </Cell>
      <Cell className="w-14 text-right" cls={dimCls}>{row.pf}</Cell>
      <Cell className="w-14 text-right" cls={dimCls}>
        <span className="val-games">{fmt1(row.pp_games)}</span><span className="val-series">{fmt1(row.pp_series)}</span>
      </Cell>
      <Cell className="w-14 text-right" cls={`text-[var(--text-muted)] ${dimCls}`}>{row.pa}</Cell>
      <Cell className="w-14 text-right" cls={`text-[var(--text-muted)] ${dimCls}`}>
        <span className="val-games">{fmt1(row.pap_games)}</span><span className="val-series">{fmt1(row.pap_series)}</span>
      </Cell>
      <Cell className="w-14 text-right" cls={diffCls}>
        {row.isDnp ? 0 : (row.diff > 0 ? `+${row.diff}` : row.diff)}
      </Cell>
      <Cell className="w-14 text-right" cls={diffCls}>
        <span className="val-games">{signedAvg(row.avg_games, row.isDnp)}</span>
        <span className="val-series">{signedAvg(row.avg_series, row.isDnp)}</span>
      </Cell>
      <Cell className="w-16 text-right pr-3 sm:pr-4" cls={dimCls}>
        <span className="val-games">{Math.round(row.winpct_games)}%</span>
        <span className="val-series">{Math.round(row.winpct_series)}%</span>
      </Cell>
    </Link>
  );
}

// Local helper -- formats a per-N average with explicit sign and fmt1 decimal,
// special-casing DNP / zero to render as "0.0".
function signedAvg(n, isDnp) {
  if (isDnp || n === 0) return '0.0';
  const f = fmt1(n);
  return n > 0 ? `+${f}` : f;
}

function Cell({ children, className = '', cls = '' }) {
  return (
    <span className={`shrink-0 py-3.5 display font-bold tabular ${className} ${cls}`.trim()}>
      {children}
    </span>
  );
}

function Legend({ label, children }) {
  return (
    <span>
      <span className="text-[var(--text-muted)] font-bold">{label}</span> {children}
    </span>
  );
}
