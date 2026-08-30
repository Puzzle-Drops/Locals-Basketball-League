import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSeason, TEAMS } from '../lib/data.js';
import { decorateDuo, standings, fmt1 } from '../lib/stats.js';
import {
  splitKey, partnerOf, scheduledSeriesForWeek, TOTAL_WEEKS,
  TEAM_COLORS, teamGradient,
} from '../lib/constants.js';
import {
  SCOPE_OPTIONS, CAREER, computedForScope, defaultScopeForTeam, scopeLabel,
  seasonForScope,
} from '../lib/scope.js';
import TeamLogo from '../components/TeamLogo.jsx';
import PlayerAvatar from '../components/PlayerAvatar.jsx';
import Pill from '../components/Pill.jsx';
import Seg from '../components/Seg.jsx';
import Scorecard from '../components/Scorecard.jsx';

function hexToRgba(hex, alpha) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return `rgba(255,107,43,${alpha})`;
  const [r, g, b] = m.map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

// Player stats restricted to a single duo (their "On Team" view). For a
// player on duo X, the per-duo team stats already aggregate every game played
// by the duo, and player points are halved team points -- so we derive
// straight from the duo's totals.
function playerOnDuoStats(player, duoKey, duoStats) {
  const d = duoStats[duoKey];
  const pf = d.pointsFor / 2;
  const pa = d.pointsAgainst / 2;
  return {
    gamesPlayed: d.gamesPlayed,
    gamesWon: d.gamesWon,
    gamesLost: d.gamesLost,
    seriesPlayed: d.seriesPlayed,
    seriesWon: d.seriesWon,
    seriesLost: d.seriesLost,
    pointsScored: pf,
    pointsAllowed: pa,
    plusMinus: pf - pa,
    ppg: d.gamesPlayed ? pf / d.gamesPlayed : 0,
    papg: d.gamesPlayed ? pa / d.gamesPlayed : 0,
  };
}

function nextSeriesForTeam(season, teamKey, computed) {
  // Find the next scheduled series in any future week (or current week's
  // remaining series) that involves this team. Returns null if none.
  const playedMap = new Set(
    computed.seriesIndex
      .filter((s) => s.played)
      .map((s) => `${s.week}-${s.matchup_id}`)
  );
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const sched = scheduledSeriesForWeek(season, w);
    for (const s of sched) {
      if (playedMap.has(`${w}-${s.matchup_id}`)) continue;
      if (s.team1_key !== teamKey && s.team2_key !== teamKey) continue;
      // Skip explicit DNP from data
      const fromData = season.weeks
        ?.find((wk) => wk.week === w)?.series
        ?.find((sx) => sx.matchup_id === s.matchup_id);
      if (fromData?.status === 'dnp') continue;
      return s;
    }
  }
  return null;
}

export default function TeamDetail() {
  const { key } = useParams();
  const validKey = Boolean(TEAMS[key]);

  // Three franchises are Season 1 only (Celtics, Heat, Bucks) and three are
  // Season 2 only (Bulls, Grizzlies, Thunder), so open on a season this duo
  // actually played in rather than always the current one.
  const [scope, setScope] = useState(() =>
    validKey ? defaultScopeForTeam(key) : CAREER
  );
  const [rosterMode, setRosterMode] = useState('on-team');

  const computed = useMemo(() => computedForScope(scope), [scope]);
  const scopeSeason = seasonForScope(scope);
  // Career scope has no schedule of its own; "Up Next" falls back to the most
  // recent season this duo appears in.
  const activeSeason = scopeSeason ?? seasonForScope(defaultScopeForTeam(key));
  const activeComputed = useMemo(
    () => computedForScope(`s${activeSeason?.season}`),
    [activeSeason]
  );

  if (!validKey) return <div className="max-w-6xl mx-auto px-5 py-12">Unknown team.</div>;

  const colors = TEAM_COLORS[key];
  const teamName = TEAMS[key];
  const players = splitKey(key);

  const rawDuo = computed.duoStats[key];
  if (!rawDuo) {
    return (
      <div className="max-w-6xl mx-auto px-5 py-12 text-[var(--text-muted)]">
        {teamName} didn't play in {scopeLabel(scope)}.
      </div>
    );
  }

  const duo = decorateDuo(key, rawDuo);
  // Rank pill follows the active scope so career mode pulls career standings.
  const scopedStandings = standings(computed.duoStats, computed.h2h);
  const scopedRank = scopedStandings.findIndex((d) => d.key === key) + 1;

  // Game log: all series involving this team
  const teamSeries = computed.seriesIndex.filter(
    (s) => s.team1_key === key || s.team2_key === key
  );
  const playedTeamSeries = teamSeries.filter((s) => s.played);

  // Group series by week to derive Series N play-order labels
  function seriesNumberFor(s) {
    const week = getSeason(s.season)?.weeks.find((w) => w.week === s.week);
    if (!week) return s.matchup_id;
    const idx = week.series.findIndex((x) => x.matchup_id === s.matchup_id);
    return idx + 1;
  }

  // H2H rows: 5 opponents (everyone except this team)
  const h2hRows = computed.duoKeys.filter((k) => k !== key).map((opponentKey) => {
    const rec = computed.h2h[key][opponentKey];
    return {
      key: opponentKey,
      ...rec,
      diff: rec.pf - rec.pa,
      played: rec.gamesW + rec.gamesL > 0,
    };
  }).sort((a, b) => Number(b.played) - Number(a.played) || a.key.localeCompare(b.key));

  // Up Next
  const upcoming = activeSeason
    ? nextSeriesForTeam(activeSeason, key, activeComputed)
    : null;
  const record = (k) => {
    const d = activeComputed.duoStats[k];
    return d ? `${d.gamesWon}-${d.gamesLost}` : '0-0';
  };
  const upcomingRecords = upcoming
    ? { team1: record(upcoming.team1_key), team2: record(upcoming.team2_key) }
    : null;

  // Team-color CSS vars + pill ring/soft tints
  const teamStyle = colors ? {
    '--team-primary': colors.primary,
    '--team-secondary': colors.secondary,
    '--team-ring': hexToRgba(colors.secondary, 0.35),
    '--team-soft': hexToRgba(colors.secondary, 0.10),
    '--team-glow': hexToRgba(colors.primary, 0.5),
    '--team-bg-primary': hexToRgba(colors.primary, 0.30),
    '--team-bg-secondary': hexToRgba(colors.secondary, 0.15),
  } : {};

  return (
    <div style={teamStyle}>
      {/* HERO */}
      <section className="team-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-6 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-40 pointer-events-none" />

          <Link
            to="/teams"
            className="relative inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition mb-6"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Teams
          </Link>

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            <TeamLogo duoKey={key} size={112} className="logo-xl" />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {scopedRank > 0 && (
                  <Pill variant="team">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                    #{scopedRank} Rank
                  </Pill>
                )}
                <Pill>{scopeLabel(scope)}</Pill>
              </div>
              <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide">
                {teamName?.toUpperCase()}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[var(--text-muted)] font-semibold">
                {players.map((p, i) => (
                  <span key={p} className="contents">
                    <Link to={`/players/${p}`} className="hover:text-[var(--text)] transition">{p}</Link>
                    {i < players.length - 1 && <span className="text-[var(--text-dim)]">&amp;</span>}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-2 mt-5">
                <HeroStat value={`${duo.seriesWon}-${duo.seriesLost}`} label="Series" />
                <HeroStat value={`${duo.gamesWon}-${duo.gamesLost}`} label="Games" />
                <HeroStat
                  value={duo.diff > 0 ? `+${duo.diff}` : `${duo.diff}`}
                  label="Point Diff"
                  valueCls={duo.diff > 0 ? 'diff-pos' : duo.diff < 0 ? 'diff-neg' : ''}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCOPE */}
      <section className="max-w-6xl mx-auto px-5 pt-8">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-[0.12em] uppercase">Scope</span>
          <Seg
            value={scope}
            onChange={setScope}
            options={SCOPE_OPTIONS}
          />
        </div>
      </section>

      {/* PRIMARY STATS */}
      <section className="max-w-6xl mx-auto px-5 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Points" value={duo.pointsFor} sub="Total scored" />
          <StatCard label="PPG" value={fmt1(duo.ppg)} sub="Per game" />
          <StatCard label="Points Against" value={duo.pointsAgainst} sub="Total allowed" />
          <StatCard label="PAPG" value={fmt1(duo.papg)} sub="Per game" />

          <div className="card p-5 col-span-2 lg:col-span-4">
            <div className="stat-label">Point Differential</div>
            <div className="flex items-baseline gap-8 flex-wrap mt-2">
              <div>
                <div className={`stat-value text-4xl tabular ${duo.diff > 0 ? 'diff-pos' : duo.diff < 0 ? 'diff-neg' : ''}`}>
                  {duo.diff > 0 ? `+${duo.diff}` : `${duo.diff}`}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-semibold mt-1">Total</div>
              </div>
              <div>
                <div className={`stat-value text-4xl tabular ${duo.avgMarginGame > 0 ? 'diff-pos' : duo.avgMarginGame < 0 ? 'diff-neg' : ''}`}>
                  {duo.avgMarginGame > 0 ? `+${fmt1(duo.avgMarginGame)}` : fmt1(duo.avgMarginGame)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-semibold mt-1">Avg margin per game</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROSTER */}
      <section className="max-w-6xl mx-auto px-5 pt-10">
        <div className="flex items-end justify-between mb-4 gap-3 flex-wrap">
          <div>
            <div className="stat-label mb-1">The Duo</div>
            <h2 className="display font-black text-3xl tracking-wide">ROSTER</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-[0.12em] uppercase">Stats</span>
            <Seg
              value={rosterMode}
              onChange={setRosterMode}
              options={[
                { value: 'on-team', label: 'On Team' },
                { value: 'overall', label: 'Overall' },
              ]}
            />
          </div>
        </div>

        <div className="roster grid grid-cols-1 md:grid-cols-2 gap-3" data-mode={rosterMode}>
          {players.map((p) => {
            const onTeam = playerOnDuoStats(p, key, computed.duoStats);
            const overallRaw = computed.playerStats[p];
            const overall = {
              ...overallRaw,
              plusMinus: overallRaw.pointsScored - overallRaw.pointsAllowed,
              ppg: overallRaw.gamesPlayed ? overallRaw.pointsScored / overallRaw.gamesPlayed : 0,
              papg: overallRaw.gamesPlayed ? overallRaw.pointsAllowed / overallRaw.gamesPlayed : 0,
            };
            return <RosterCard key={p} name={p} teamName={teamName} onTeam={onTeam} overall={overall} />;
          })}
        </div>
      </section>

      {/* GAME LOG */}
      <section className="max-w-6xl mx-auto px-5 pt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="stat-label mb-1">
              {playedTeamSeries.length} Series Played
            </div>
            <h2 className="display font-black text-3xl tracking-wide">GAME LOG</h2>
          </div>
        </div>

        {playedTeamSeries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No games played yet.</p>
        ) : (
          <div className="space-y-3">
            {playedTeamSeries.map((s) => (
              <Scorecard
                key={`${s.week}-${s.matchup_id}`}
                series={s}
                weekNumber={s.week}
                seriesNumber={seriesNumberFor(s)}
              />
            ))}
          </div>
        )}
      </section>

      {/* HEAD TO HEAD */}
      <section className="max-w-6xl mx-auto px-5 pt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="stat-label mb-1">{teamName} vs Everyone</div>
            <h2 className="display font-black text-3xl tracking-wide">HEAD TO HEAD</h2>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-[var(--border)] text-[10px] tracking-[0.12em] uppercase font-bold text-[var(--text-muted)]">
            <span className="flex-1 min-w-0">Opponent</span>
            <span className="w-12 sm:w-16 text-center">Series</span>
            <span className="w-12 sm:w-16 text-center">Games</span>
            <span className="w-11 sm:w-14 text-right">+/-</span>
          </div>
          {h2hRows.map((row, i) => (
            <H2HRow key={row.key} row={row} isLast={i === h2hRows.length - 1} />
          ))}
        </div>
      </section>

      {/* UP NEXT */}
      {upcoming && (
        <section className="max-w-6xl mx-auto px-5 pt-12 pb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="stat-label mb-1">Next Series</div>
              <h2 className="display font-black text-3xl tracking-wide">UP NEXT</h2>
            </div>
          </div>
          <Scorecard
            series={upcoming}
            weekNumber={upcoming.week}
            seriesNumber={upcoming.seriesNumber}
            records={upcomingRecords}
          />
        </section>
      )}
    </div>
  );
}

function HeroStat({ value, label, valueCls = '' }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`display font-black text-2xl tabular ${valueCls}`}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="card p-5">
      <div className="stat-label">{label}</div>
      <div className="stat-value text-4xl mt-2 tabular">{value}</div>
      <div className="text-[11px] text-[var(--text-muted)] font-semibold mt-1">{sub}</div>
    </div>
  );
}

function RosterCard({ name, teamName, onTeam, overall }) {
  function pmCls(v) { return v > 0 ? 'diff-pos' : v < 0 ? 'diff-neg' : ''; }
  function fmtPM(v) { return v > 0 ? `+${fmt1(v)}` : fmt1(v); }
  return (
    <Link to={`/players/${name}`} className="card p-5 flex items-center gap-4 group">
      <PlayerAvatar name={name} size={64} className="avatar-lg" />
      <div className="flex-1 min-w-0">
        <div className="display font-black text-2xl leading-none">{name.toUpperCase()}</div>
        <div className="text-[11px] text-[var(--text-muted)] mt-1">
          <span className="val-on-team">
            On {teamName} · {onTeam.gamesPlayed} games · {onTeam.gamesWon}-{onTeam.gamesLost}
          </span>
          <span className="val-overall">
            All teams · {overall.gamesPlayed} games · {overall.gamesWon}-{overall.gamesLost}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-[var(--border)]">
          <RosterStat label="+/-" onTeam={fmtPM(onTeam.plusMinus)} overall={fmtPM(overall.plusMinus)}
            cls={`tabular ${pmCls(onTeam.plusMinus)}`} clsOverall={`tabular ${pmCls(overall.plusMinus)}`} />
          <RosterStat label="PPG" onTeam={fmt1(onTeam.ppg)} overall={fmt1(overall.ppg)} cls="tabular" clsOverall="tabular" />
          <RosterStat label="PAPG" onTeam={fmt1(onTeam.papg)} overall={fmt1(overall.papg)} cls="tabular" clsOverall="tabular" />
        </div>
      </div>
      <svg className="text-[var(--text-dim)] group-hover:text-[var(--accent)] transition" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

function RosterStat({ label, onTeam, overall, cls = '', clsOverall = '' }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value text-lg mt-1">
        <span className={`val-on-team ${cls}`}>{onTeam}</span>
        <span className={`val-overall ${clsOverall}`}>{overall}</span>
      </div>
    </div>
  );
}

function H2HRow({ row, isLast }) {
  const { key, seriesW, seriesL, gamesW, gamesL, diff, played } = row;
  const players = splitKey(key).join(' & ');
  return (
    <Link
      to={`/teams/${key}`}
      className={`row flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3.5 ${isLast ? '' : 'border-b border-[var(--border)]'} ${played ? '' : 'opacity-70'}`}
    >
      <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
        <TeamLogo duoKey={key} size={32} />
        <div className="min-w-0">
          <div className="display font-black text-base leading-none">{TEAMS[key]?.toUpperCase()}</div>
          <div className="text-[11px] text-[var(--text-muted)] truncate">{players}</div>
        </div>
      </div>
      <span className={`w-12 sm:w-16 text-center display font-bold text-lg tabular ${played ? '' : 'text-[var(--text-dim)]'}`}>
        {played ? `${seriesW}-${seriesL}` : '-'}
      </span>
      <span className={`w-12 sm:w-16 text-center display font-bold text-lg tabular ${played ? '' : 'text-[var(--text-dim)]'}`}>
        {played ? `${gamesW}-${gamesL}` : '-'}
      </span>
      <span className={`w-11 sm:w-14 text-right display font-bold tabular ${!played ? 'text-[var(--text-dim)]' : (diff > 0 ? 'diff-pos' : diff < 0 ? 'diff-neg' : '')}`}>
        {!played ? '-' : (diff > 0 ? `+${diff}` : `${diff}`)}
      </span>
    </Link>
  );
}
