import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON, TEAMS, leagueLogo } from '../lib/data.js';
import { computeSeason, standings, decoratePlayer, fmt1, playedGames } from '../lib/stats.js';
import {
  splitKey, teamGradient, scheduledSeriesForWeek, TOTAL_WEEKS,
} from '../lib/constants.js';
import Scorecard from '../components/Scorecard.jsx';
import Seg from '../components/Seg.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import PlayerAvatar from '../components/PlayerAvatar.jsx';
import Pill from '../components/Pill.jsx';

function currentWeekFor(season) {
  let max = 1;
  for (const w of season.weeks ?? []) {
    if ((w.series ?? []).some((s) => (s.games ?? []).length > 0)) {
      max = Math.max(max, w.week);
    }
  }
  return max;
}

function recordFor(duoStats, key) {
  const s = duoStats[key];
  return `${s.gamesWon}-${s.gamesLost}`;
}

export default function Home() {
  const computed = useMemo(() => computeSeason(CURRENT_SEASON), []);
  const [mode, setMode] = useState('games');
  const ranks = useMemo(
    () => standings(computed.duoStats, computed.h2h, { mode }),
    [computed, mode]
  );

  const currentWeek = currentWeekFor(CURRENT_SEASON);
  const totalSeries = TOTAL_WEEKS * 3;
  const decidedSeries = computed.seriesIndex.filter((s) => s.decided).length;
  const progressPct = Math.round((decidedSeries / totalSeries) * 100);

  // Hero stats
  const games = playedGames(computed.seriesIndex);
  const totalPoints = games.reduce((sum, g) => sum + g.team1_score + g.team2_score, 0);
  const avgMargin = games.length
    ? games.reduce((sum, g) => sum + Math.abs(g.team1_score - g.team2_score), 0) / games.length
    : 0;

  // Latest results: all series in current week, in play order.
  const latestSeries = computed.seriesIndex
    .filter((s) => s.week === currentWeek)
    .sort((a, b) => {
      const week = CURRENT_SEASON.weeks.find((w) => w.week === currentWeek);
      const order = (week?.series ?? []).map((s) => s.matchup_id);
      return order.indexOf(a.matchup_id) - order.indexOf(b.matchup_id);
    });

  // Player leaders by +/-
  const playerRows = computed.players
    .map((p) => decoratePlayer(p, computed.playerStats[p]))
    .sort((a, b) => b.plusMinus - a.plusMinus);
  const mvp = playerRows[0];

  // Next week preview
  const nextWeekNum = currentWeek + 1;
  const nextWeekSeries = nextWeekNum <= TOTAL_WEEKS ? scheduledSeriesForWeek(CURRENT_SEASON, nextWeekNum) : [];

  return (
    <>
      {/* HERO */}
      <section className="court-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-8 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Pill variant="accent">Live Season</Pill>
                  <span className="text-[11px] tracking-[0.16em] uppercase text-[var(--text-muted)] font-semibold">
                    Season {CURRENT_SEASON.season} · 2026
                  </span>
                </div>
                <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide">
                  WEEK {currentWeek} <span className="text-[var(--text-muted)] font-bold">OF {TOTAL_WEEKS}</span>
                </h1>
              </div>
              <img src={leagueLogo()} alt="LBL" className="h-24 md:h-32 w-auto object-contain shrink-0" />
            </div>

            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 md:w-80 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="stat-label">Season Progress</span>
                <span className="display font-bold text-sm text-[var(--text-muted)] tabular">
                  {decidedSeries}/{totalSeries} <span className="text-[var(--text-dim)]">series</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${progressPct}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <HeroStat value={games.length} label="Games" />
                <HeroStat value={totalPoints} label="Points" />
                <HeroStat value={fmt1(avgMargin)} label="Avg Margin" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LATEST RESULTS */}
      <section className="max-w-6xl mx-auto px-5 pt-12 pb-8">
        <SectionHeader
          eyebrow={`Week ${currentWeek} · Day 1`}
          title="LATEST RESULTS"
          link={{ to: '/schedule', label: 'All Games' }}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {latestSeries.map((s, idx) => (
            <Scorecard
              key={`${s.week}-${s.matchup_id}`}
              series={s}
              weekNumber={s.week}
              seriesNumber={idx + 1}
            />
          ))}
        </div>
      </section>

      {/* STANDINGS + LEADERS */}
      <section className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
        <div>
          <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
            <div>
              <div className="stat-label mb-1">Season {CURRENT_SEASON.season}</div>
              <h2 className="display font-black text-3xl tracking-wide">STANDINGS</h2>
            </div>
            <Link
              to="/standings"
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent)] uppercase tracking-[0.12em] transition"
            >
              Full Table →
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-[0.12em] uppercase">View</span>
            <Seg
              value={mode}
              onChange={setMode}
              options={[{ value: 'games', label: 'Games' }, { value: 'series', label: 'Series' }]}
            />
          </div>

          <div
            className="standings-table bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden"
            data-mode={mode}
          >
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-[var(--border)] text-[10px] tracking-[0.12em] uppercase font-bold text-[var(--text-muted)]">
              <span className="w-5 sm:w-6" />
              <span className="flex-1 min-w-0">Team</span>
              <span className="w-8 sm:w-10 text-center">W</span>
              <span className="w-8 sm:w-10 text-center">L</span>
              <span className="hidden sm:inline w-14 text-right">PF</span>
              <span className="w-11 sm:w-14 text-right">+/-</span>
            </div>

            {ranks.map((d, i) => (
              <StandingsRow
                key={d.key}
                rank={i + 1}
                row={d}
                isLast={i === ranks.length - 1}
              />
            ))}
          </div>

          <p className="text-[11px] text-[var(--text-dim)] mt-3">
            Tiebreakers: head-to-head series, then point differential.
          </p>
        </div>

        <div>
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="stat-label mb-1">Week {currentWeek}</div>
              <h2 className="display font-black text-3xl tracking-wide">LEADERS</h2>
            </div>
            <Link
              to="/players"
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent)] uppercase tracking-[0.12em] transition"
            >
              All Players →
            </Link>
          </div>

          {mvp && mvp.gamesPlayed > 0 && <MvpCard player={mvp} />}

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <span className="stat-label">Player +/-</span>
              <span className="text-[10px] text-[var(--text-dim)] font-bold uppercase tracking-wider">
                {games.length} Games
              </span>
            </div>
            {playerRows.map((p, i) => (
              <PlayerRow key={p.name} rank={i + 1} player={p} top={i === 0} isLast={i === playerRows.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* NEXT WEEK */}
      {nextWeekSeries.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 py-8">
          <SectionHeader
            eyebrow="Coming up"
            title="NEXT WEEK"
            link={{ to: '/schedule', label: 'Full Schedule' }}
          />
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <div className="mb-5">
              <Pill variant="accent">Week {nextWeekNum}</Pill>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {nextWeekSeries.map((s, idx) => (
                <NextSeriesCard
                  key={s.matchup_id}
                  series={s}
                  position={['First Up', 'Second', 'Closing'][idx]}
                  duoStats={computed.duoStats}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MORE TO EXPLORE */}
      <section className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ExploreLink to="/playoffs" eyebrow="The Bracket" title="PLAYOFFS" />
          <ExploreLink to="/compare" eyebrow="Head to Head" title="COMPARE" />
          <ExploreLink to="/rules" eyebrow="Reference" title="RULES" />
        </div>
      </section>
    </>
  );
}

function ExploreLink({ to, eyebrow, title }) {
  return (
    <Link to={to} className="card p-5 flex items-center justify-between group">
      <div>
        <div className="stat-label mb-1">{eyebrow}</div>
        <div className="display font-black text-2xl tracking-wide group-hover:text-[var(--accent)] transition">{title}</div>
      </div>
      <svg className="text-[var(--text-dim)] group-hover:text-[var(--accent)] transition" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

function HeroStat({ value, label }) {
  return (
    <div>
      <div className="stat-value text-2xl tabular">{value}</div>
      <div className="stat-label mt-0.5">{label}</div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, link }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="stat-label mb-1">{eyebrow}</div>
        <h2 className="display font-black text-3xl tracking-wide">{title}</h2>
      </div>
      {link && (
        <Link
          to={link.to}
          className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent)] uppercase tracking-[0.12em] transition"
        >
          {link.label} →
        </Link>
      )}
    </div>
  );
}

function StandingsRow({ rank, row, isLast }) {
  const { key, gamesWon, gamesLost, seriesWon, seriesLost, pointsFor, diff, gamesPlayed } = row;
  const isDnp = gamesPlayed === 0;
  const players = splitKey(key).join(' & ');

  return (
    <Link
      to={`/teams/${key}`}
      className={`standings-row flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3.5 ${isLast ? '' : 'border-b border-[var(--border)]'} ${isDnp ? 'opacity-80' : ''}`}
    >
      <span className={`rank w-5 sm:w-6 ${rank === 1 ? 'top' : ''}`}>{rank}</span>
      <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
        <TeamLogo duoKey={key} size={32} />
        <div className="min-w-0">
          <div className="display font-black text-base leading-none">{TEAMS[key]?.toUpperCase()}</div>
          <div className="text-[11px] text-[var(--text-muted)] truncate">{players}</div>
        </div>
      </div>
      <span className="w-8 sm:w-10 text-center display font-bold text-lg tabular">
        {isDnp
          ? <span className="text-[var(--text-dim)]">-</span>
          : <><span className="val-games">{gamesWon}</span><span className="val-series">{seriesWon}</span></>}
      </span>
      <span className="w-8 sm:w-10 text-center display font-bold text-lg tabular text-[var(--text-muted)]">
        {isDnp
          ? <span className="text-[var(--text-dim)]">-</span>
          : <><span className="val-games">{gamesLost}</span><span className="val-series">{seriesLost}</span></>}
      </span>
      <span className="hidden sm:inline w-14 text-right display font-bold tabular text-[var(--text-muted)]">
        {isDnp ? <span className="text-[var(--text-dim)]">-</span> : pointsFor}
      </span>
      <span className={`w-11 sm:w-14 text-right display font-bold tabular ${isDnp ? 'text-[var(--text-dim)]' : (diff > 0 ? 'diff-pos' : diff < 0 ? 'diff-neg' : '')}`}>
        {isDnp ? '-' : (diff > 0 ? `+${diff}` : `${diff}`)}
      </span>
    </Link>
  );
}

function MvpCard({ player }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 relative overflow-hidden mb-3">
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full"
           style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 70%)' }} />

      <div className="flex items-center gap-2 mb-4 relative">
        <Pill variant="accent">★ MVP</Pill>
        <span className="text-[10px] text-[var(--text-muted)] tracking-[0.12em] uppercase font-bold">Week 1</span>
      </div>

      <Link to={`/players/${player.name}`} className="flex items-center gap-4 relative">
        <PlayerAvatar name={player.name} lg />
        <div className="flex-1 min-w-0">
          <div className="display font-black text-3xl leading-none">{player.name.toUpperCase()}</div>
          <div className="text-xs text-[var(--text-muted)] mt-1">
            {player.gamesLost === 0 ? 'Undefeated' : `${player.gamesWon}-${player.gamesLost}`} · {player.seriesWon}-{player.seriesLost} in series
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[var(--border)] relative">
        <Stat label="+/-" value={`${player.plusMinus > 0 ? '+' : ''}${fmt1(player.plusMinus)}`} cls="diff-pos tabular" />
        <Stat label="PPG" value={fmt1(player.ppg)} cls="tabular" />
        <Stat label="Record" value={`${player.gamesWon}-${player.gamesLost}`} cls="tabular" />
      </div>
    </div>
  );
}

function Stat({ label, value, cls = '' }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value text-2xl mt-1 ${cls}`}>{value}</div>
    </div>
  );
}

function PlayerRow({ rank, player, top, isLast }) {
  const pm = player.plusMinus;
  const pmCls = pm > 0 ? 'diff-pos' : pm < 0 ? 'diff-neg' : 'text-[var(--text-muted)]';
  return (
    <Link
      to={`/players/${player.name}`}
      className={`standings-row flex items-center gap-3 px-4 py-3 ${isLast ? '' : 'border-t border-[var(--border)]'}`}
    >
      <span className={`rank w-6 ${top ? 'top' : ''}`}>{rank}</span>
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <PlayerAvatar name={player.name} size={32} />
        <div className="min-w-0">
          <div className="display font-black text-sm leading-none">{player.name.toUpperCase()}</div>
          <div className="text-[10px] text-[var(--text-muted)] truncate">
            {player.gamesWon}-{player.gamesLost} · {fmt1(player.ppg)} PPG · {fmt1(player.papg)} PAPG
          </div>
        </div>
      </div>
      <span className={`display font-bold tabular ${pmCls}`}>
        {pm > 0 ? `+${fmt1(pm)}` : fmt1(pm)}
      </span>
    </Link>
  );
}

function NextSeriesCard({ series, position, duoStats }) {
  const r1 = recordFor(duoStats, series.team1_key);
  const r2 = recordFor(duoStats, series.team2_key);
  return (
    <div className="bg-white/[0.02] border border-[var(--border)] rounded-lg p-4">
      <div className="text-[10px] text-[var(--text-muted)] font-bold tracking-wider uppercase mb-3">
        {position} · Series {series.seriesNumber}
      </div>
      <NextSideRow duoKey={series.team1_key} record={r1} />
      <div className="text-[11px] text-[var(--text-muted)] font-bold my-1 ml-2">vs</div>
      <NextSideRow duoKey={series.team2_key} record={r2} />
    </div>
  );
}

function NextSideRow({ duoKey, record }) {
  const players = splitKey(duoKey).join(' & ');
  return (
    <Link to={`/teams/${duoKey}`} className="flex items-center gap-2 hover:text-[var(--accent)] transition-colors">
      <TeamLogo duoKey={duoKey} size={28} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="display font-black text-base">{TEAMS[duoKey]?.toUpperCase()}</span>
          <span className="text-[11px] text-[var(--text-muted)] font-bold tabular">({record})</span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] truncate">{players}</div>
      </div>
    </Link>
  );
}
