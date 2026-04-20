import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CURRENT_SEASON, SEASONS, TEAMS } from '../lib/data.js';
import { computeSeason, computeCareer, decoratePlayer, fmt1 } from '../lib/stats.js';
import {
  PLAYERS, PLAYER_DUOS, partnerOf, scheduledSeriesForWeek, TOTAL_WEEKS,
} from '../lib/constants.js';
import PlayerAvatar from '../components/PlayerAvatar.jsx';
import TeamLogo from '../components/TeamLogo.jsx';
import Pill from '../components/Pill.jsx';
import Seg from '../components/Seg.jsx';
import Scorecard from '../components/Scorecard.jsx';

function playerOnDuoStats(player, duoKey, duoStats) {
  const d = duoStats[duoKey];
  const pf = d.pointsFor / 2;
  const pa = d.pointsAgainst / 2;
  return {
    duoKey,
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
    winPct: d.gamesPlayed ? d.gamesWon / d.gamesPlayed : 0,
  };
}

// Returns ALL upcoming series the player is in for the next week with any
// unplayed series. Each player is in every series of every week (4 players,
// 2v2 -> they're always one of the 4 on the court), so this typically
// returns the full week of 3 series in play order.
function nextWeekSeriesForPlayer(season, player, computed) {
  const playerDuos = new Set(PLAYER_DUOS[player]);
  const playedMap = new Set(
    computed.seriesIndex.filter((s) => s.played).map((s) => `${s.week}-${s.matchup_id}`)
  );
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const sched = scheduledSeriesForWeek(w);
    const upcoming = sched.filter((s) => {
      if (playedMap.has(`${w}-${s.matchup_id}`)) return false;
      if (!playerDuos.has(s.team1_key) && !playerDuos.has(s.team2_key)) return false;
      const fromData = season.weeks
        ?.find((wk) => wk.week === w)?.series
        ?.find((sx) => sx.matchup_id === s.matchup_id);
      if (fromData?.status === 'dnp') return false;
      return true;
    });
    if (upcoming.length) return { week: w, series: upcoming };
  }
  return null;
}

export default function PlayerDetail() {
  const { name } = useParams();
  const valid = PLAYERS.includes(name);

  const seasonComputed = useMemo(() => computeSeason(CURRENT_SEASON), []);
  const careerComputed = useMemo(() => computeCareer(SEASONS), []);
  const [scope, setScope] = useState('season');

  if (!valid) return <div className="max-w-6xl mx-auto px-5 py-12">Unknown player.</div>;

  const computed = scope === 'season' ? seasonComputed : careerComputed;
  const player = decoratePlayer(name, computed.playerStats[name]);

  // Rank players by +/- to derive Season MVP / #N pills
  const allPlayers = PLAYERS
    .map((p) => decoratePlayer(p, computed.playerStats[p]))
    .sort((a, b) => b.plusMinus - a.plusMinus);
  const rank = allPlayers.findIndex((p) => p.name === name) + 1;
  const isMvp = rank === 1 && player.gamesPlayed > 0;

  // 3 partnerships, sorted: played first by win%, then by +/-, unplayed last
  const partnerships = PLAYER_DUOS[name].map((duoKey) => ({
    ...playerOnDuoStats(name, duoKey, computed.duoStats),
    partner: partnerOf(name, duoKey),
  })).sort((a, b) => {
    const aP = a.gamesPlayed > 0;
    const bP = b.gamesPlayed > 0;
    if (aP !== bP) return Number(bP) - Number(aP);
    if (b.winPct !== a.winPct) return b.winPct - a.winPct;
    return b.plusMinus - a.plusMinus;
  });

  // Player game log: any series where one of this player's duos plays
  const playerDuoSet = new Set(PLAYER_DUOS[name]);
  const playerSeries = computed.seriesIndex
    .filter((s) => playerDuoSet.has(s.team1_key) || playerDuoSet.has(s.team2_key))
    .filter((s) => s.played)
    .sort((a, b) => a.week - b.week || a.matchup_id - b.matchup_id);

  function seriesNumberFor(s) {
    const week = CURRENT_SEASON.weeks.find((w) => w.week === s.week);
    if (!week) return s.matchup_id;
    return week.series.findIndex((x) => x.matchup_id === s.matchup_id) + 1;
  }

  // Up next: every series the player has in the next active week
  const upcoming = nextWeekSeriesForPlayer(CURRENT_SEASON, name, seasonComputed);
  function recordFor(key) {
    const d = seasonComputed.duoStats[key];
    return `${d.gamesWon}-${d.gamesLost}`;
  }

  const playerDuos = PLAYER_DUOS[name];

  return (
    <>
      {/* HERO */}
      <section className="player-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-6 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-40 pointer-events-none" />

          <Link
            to="/players"
            className="relative inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition mb-6"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Players
          </Link>

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
            <PlayerAvatar name={name} xl />

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {isMvp && (
                  <Pill variant="accent">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
                    </svg>
                    Season MVP
                  </Pill>
                )}
                {player.gamesPlayed > 0 && <Pill>#{rank} Player</Pill>}
                <Pill>Season {CURRENT_SEASON.season}</Pill>
              </div>
              <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide">
                {name.toUpperCase()}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-[var(--text-muted)] font-semibold">
                <span>Plays for</span>
                {playerDuos.map((dk, i) => (
                  <span key={dk} className="contents">
                    <Link to={`/teams/${dk}`} className="text-[var(--text)] hover:text-[var(--accent)] transition">
                      {TEAMS[dk]}
                    </Link>
                    {i < playerDuos.length - 1 && <span className="text-[var(--text-dim)]">·</span>}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-2 mt-5">
                <HeroStat value={`${player.seriesWon}-${player.seriesLost}`} label="Series" />
                <HeroStat value={`${player.gamesWon}-${player.gamesLost}`} label="Games" />
                <HeroStat
                  value={player.plusMinus > 0 ? `+${fmt1(player.plusMinus)}` : fmt1(player.plusMinus)}
                  label="Point Diff"
                  valueCls={player.plusMinus > 0 ? 'diff-pos' : player.plusMinus < 0 ? 'diff-neg' : ''}
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
            options={[
              { value: 'season', label: `Season ${CURRENT_SEASON.season}` },
              { value: 'career', label: 'Career' },
            ]}
          />
        </div>
      </section>

      {/* PRIMARY STATS */}
      <section className="max-w-6xl mx-auto px-5 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Points" value={fmt1(player.pointsScored)} sub="Total scored" />
          <StatCard label="PPG" value={fmt1(player.ppg)} sub="Per game" />
          <StatCard label="Points Against" value={fmt1(player.pointsAllowed)} sub="Total allowed" />
          <StatCard label="PAPG" value={fmt1(player.papg)} sub="Per game" />

          <div className="card p-5 col-span-2 lg:col-span-4">
            <div className="stat-label">Point Differential</div>
            <div className="flex items-baseline gap-8 flex-wrap mt-2">
              <div>
                <div className={`stat-value text-4xl tabular ${player.plusMinus > 0 ? 'diff-pos' : player.plusMinus < 0 ? 'diff-neg' : ''}`}>
                  {player.plusMinus > 0 ? `+${fmt1(player.plusMinus)}` : fmt1(player.plusMinus)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-semibold mt-1">Total</div>
              </div>
              <div>
                <div className={`stat-value text-4xl tabular ${player.gamesPlayed && player.plusMinus > 0 ? 'diff-pos' : player.gamesPlayed && player.plusMinus < 0 ? 'diff-neg' : ''}`}>
                  {player.gamesPlayed
                    ? (player.plusMinus / player.gamesPlayed > 0
                        ? `+${fmt1(player.plusMinus / player.gamesPlayed)}`
                        : fmt1(player.plusMinus / player.gamesPlayed))
                    : '0.0'}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-semibold mt-1">Avg margin per game</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MY TEAMS */}
      <section className="max-w-6xl mx-auto px-5 pt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="stat-label mb-1">3 Partnerships</div>
            <h2 className="display font-black text-3xl tracking-wide">MY TEAMS</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {partnerships.map((p) => (
            <PartnershipCard key={p.duoKey} partnership={p} />
          ))}
        </div>
      </section>

      {/* GAME LOG */}
      <section className="max-w-6xl mx-auto px-5 pt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="stat-label mb-1">{playerSeries.length} Series Played</div>
            <h2 className="display font-black text-3xl tracking-wide">GAME LOG</h2>
          </div>
        </div>

        {playerSeries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No games played yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {playerSeries.map((s) => (
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

      {/* UP NEXT */}
      {upcoming && (
        <section className="max-w-6xl mx-auto px-5 pt-12 pb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="stat-label mb-1">Week {upcoming.week}</div>
              <h2 className="display font-black text-3xl tracking-wide">UP NEXT</h2>
            </div>
            <Link
              to="/schedule"
              className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent)] uppercase tracking-[0.12em] transition"
            >
              Full Schedule →
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcoming.series.map((s, idx) => (
              <Scorecard
                key={s.matchup_id}
                series={s}
                weekNumber={s.week}
                seriesNumber={idx + 1}
                records={{ team1: recordFor(s.team1_key), team2: recordFor(s.team2_key) }}
              />
            ))}
          </div>
        </section>
      )}
    </>
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

function PartnershipCard({ partnership }) {
  const { duoKey, partner, gamesPlayed, gamesWon, gamesLost, seriesWon, seriesLost,
          plusMinus, ppg, papg } = partnership;
  const unplayed = gamesPlayed === 0;
  const pmCls = unplayed ? 'text-[var(--text-dim)]' : (plusMinus > 0 ? 'diff-pos' : plusMinus < 0 ? 'diff-neg' : '');
  const valCls = unplayed ? 'text-[var(--text-dim)]' : '';

  return (
    <Link to={`/teams/${duoKey}`} className={`card ${unplayed ? 'dim' : ''} p-5 flex flex-col group`}>
      <div className="flex items-center gap-3 mb-4">
        <TeamLogo duoKey={duoKey} />
        <div className="flex-1 min-w-0">
          <div className="display font-black text-xl leading-none">{TEAMS[duoKey]?.toUpperCase()}</div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate">with {partner}</div>
        </div>
        <svg className="text-[var(--text-dim)] group-hover:text-[var(--accent)] transition" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>

      <div className="flex items-baseline gap-4 mb-3">
        <PartLabel value={`${seriesWon}-${seriesLost}`} label="Series" cls={valCls} />
        <PartLabel value={`${gamesWon}-${gamesLost}`} label="Games" cls={valCls} />
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border)]">
        <PartStat label="+/-" value={unplayed ? '-' : (plusMinus > 0 ? `+${fmt1(plusMinus)}` : fmt1(plusMinus))} cls={pmCls} />
        <PartStat label="PPG" value={unplayed ? '-' : fmt1(ppg)} cls={valCls} />
        <PartStat label="PAPG" value={unplayed ? '-' : fmt1(papg)} cls={valCls} />
      </div>
    </Link>
  );
}

function PartLabel({ value, label, cls = '' }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`display font-bold text-lg tabular ${cls}`}>{value}</span>
      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

function PartStat({ label, value, cls = '' }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value text-lg mt-1 tabular ${cls}`}>{value}</div>
    </div>
  );
}
