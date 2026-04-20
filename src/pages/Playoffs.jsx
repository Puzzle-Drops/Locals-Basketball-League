import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON, TEAMS } from '../lib/data.js';
import { computeSeason, standings as canonicalStandings, signed } from '../lib/stats.js';
import { splitKey, TOTAL_WEEKS } from '../lib/constants.js';
import { resolveCoinflip } from '../lib/coinflip.js';
import TeamLogo from '../components/TeamLogo.jsx';
import Pill from '../components/Pill.jsx';

// Resolve a bracket matchup. Higher +/- advances. If +/- ties, fall back to
// a coinflip: an override from `season.coinflips` if one exists, otherwise a
// seeded hash of the two duo keys + salt. Deterministic so the bracket
// doesn't flicker on refresh; same matchup always produces the same result.
function resolveMatchup(teamA, teamB, { coinflips, salt = '' } = {}) {
  if (teamA.diff !== teamB.diff) {
    if (teamA.diff > teamB.diff) return { winner: teamA, loser: teamB, coinflip: false };
    return { winner: teamB, loser: teamA, coinflip: false };
  }
  const winnerDuo = resolveCoinflip(teamA.duo, teamB.duo, { coinflips, salt });
  const winner = winnerDuo === teamA.duo ? teamA : teamB;
  const loser = winner === teamA ? teamB : teamA;
  return { winner, loser, coinflip: true };
}

function currentWeekFor(season) {
  let max = 1;
  for (const w of season.weeks ?? []) {
    if ((w.series ?? []).some((s) => (s.games ?? []).length > 0)) {
      max = Math.max(max, w.week);
    }
  }
  return max;
}

export default function Playoffs() {
  const computed = useMemo(() => computeSeason(CURRENT_SEASON), []);
  const ranks = useMemo(
    () => canonicalStandings(computed.duoStats, computed.h2h),
    [computed]
  );

  const allSeries = computed.seriesIndex;
  const seasonComplete = allSeries.length > 0 && allSeries.every((s) => s.played);
  const currentWeek = currentWeekFor(CURRENT_SEASON);

  // Decorate each rank with seed, record string, etc.
  const seeds = ranks.map((d, i) => ({
    seed: i + 1,
    key: d.key,
    name: TEAMS[d.key],
    duo: d.key,
    record: `${d.gamesWon}-${d.gamesLost}`,
    diff: d.diff,
    gamesWon: d.gamesWon,
    isDnp: d.gamesPlayed === 0,
  }));

  const top4 = seeds.slice(0, 4);
  const fourthSeedWins = top4[3]?.gamesWon ?? 0;

  const coinflips = CURRENT_SEASON.coinflips ?? {};
  const seasonSalt = `s${CURRENT_SEASON.season}`;

  const semis = top4.length === 4
    ? {
        left: resolveMatchup(top4[0], top4[3], { coinflips, salt: `${seasonSalt}:semifinal-left` }),
        right: resolveMatchup(top4[1], top4[2], { coinflips, salt: `${seasonSalt}:semifinal-right` }),
      }
    : null;

  const finalMatchup = semis
    ? resolveMatchup(semis.left.winner, semis.right.winner, { coinflips, salt: `${seasonSalt}:final` })
    : null;

  return (
    <>
      {/* HERO */}
      <section className="court-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" />
          <div className="relative">
            <div className="stat-label mb-2">
              Season {CURRENT_SEASON.season} · Week {currentWeek} of {TOTAL_WEEKS}
            </div>
            <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide mb-3">PLAYOFFS</h1>
            <p className="text-[var(--text-muted)] text-base md:text-lg max-w-xl mb-5">
              Top 4 teams by regular-season wins earn playoff spots. Once in, bracket matchups resolve on season point differential (+/-). The bracket updates live, then locks after Week {TOTAL_WEEKS}.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {seasonComplete ? (
                <Pill variant="accent">Final</Pill>
              ) : (
                <Pill variant="accent">
                  <span className="live-dot" />
                  Live Projection
                </Pill>
              )}
              <Pill variant="small">
                {seasonComplete ? 'Bracket locked' : 'Based on current standings'}
              </Pill>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <HeroStat value={4} label="Teams in Bracket" />
              <HeroStat value={3} label="Computed Matchups" />
            </div>
          </div>
        </div>
      </section>

      {/* PLAYOFF RACE */}
      <section className="max-w-6xl mx-auto px-5 pt-10 pb-4">
        <div className="flex items-baseline justify-between mb-5 gap-4">
          <div className="min-w-0">
            <h2 className="display font-black text-2xl md:text-3xl leading-none tracking-wide">PLAYOFF RACE</h2>
            <div className="text-[11.5px] text-[var(--text-muted)] mt-1.5 tracking-[0.04em]">
              All 6 teams · Top 4 advance to the bracket
            </div>
          </div>
          <Link
            to="/standings"
            className="stat-label hover:text-[var(--text)] transition hidden sm:inline-flex items-center gap-1 whitespace-nowrap shrink-0"
          >
            Full Standings <span className="text-[var(--accent)]">→</span>
          </Link>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[300px]">
              <div className="flex items-center text-[10px] tracking-[0.12em] uppercase font-bold text-[var(--text-muted)] border-b border-[var(--border)]">
                <span className="w-10 text-center shrink-0 py-3">#</span>
                <span className="flex-1 py-3 pl-2">Team</span>
                <span className="w-16 text-right shrink-0 py-3">+/-</span>
                <span className="w-24 text-right shrink-0 py-3 pr-4">Status</span>
              </div>

              {seeds.map((s, i) => (
                <RaceRow
                  key={s.key}
                  seed={s}
                  fourthSeedWins={fourthSeedWins}
                  isLastIn={s.seed === 4}
                />
              ))}
              {/* Render the playoff line right after seed #4 */}
            </div>
          </div>
        </div>

        <div className="mt-3 text-[11px] text-[var(--text-dim)]">
          The orange number for teams below the line is <span className="text-[var(--text-muted)] font-bold">games behind</span> the #4 seed. Seeding by game wins; tiebreakers: head-to-head series record, then point differential, then coinflip.
        </div>
      </section>

      {/* BRACKET */}
      {semis && finalMatchup && (
        <section className="max-w-6xl mx-auto px-5 pt-10 pb-8">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="display font-black text-2xl md:text-3xl leading-none tracking-wide">THE BRACKET</h2>
            <span className="stat-label hidden sm:inline">Scroll to championship ↓</span>
          </div>

          <div className="bracket">
            <Semifinal label="Left Bracket" matchup={semis.left} side="left" />
            <Semifinal label="Right Bracket" matchup={semis.right} side="right" />
            <Championship final={finalMatchup} seasonComplete={seasonComplete} />
          </div>
        </section>
      )}

      {/* HOW PLAYOFFS WORK */}
      <section className="max-w-6xl mx-auto px-5 pt-6 pb-16">
        <div className="card p-5 md:p-6">
          <div className="flex items-start justify-between mb-4 gap-4">
            <div>
              <div className="stat-label mb-1">Reference</div>
              <h3 className="display font-black text-xl md:text-2xl leading-none tracking-wide">HOW PLAYOFFS WORK</h3>
            </div>
            <Link to="/rules" className="pill small hover:text-[var(--text)] transition">
              Full Rules →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-[14px] text-[var(--text-muted)] leading-relaxed">
            <Step n="01" body={<><strong className="text-[var(--text)]">Top 4 teams</strong> from the standings make the playoffs. #5 and #6 miss out.</>} />
            <Step n="02" body={<><strong className="text-[var(--text)]">Seeding uses game wins</strong> - the same rule as the standings ranking.</>} />
            <Step n="03" body={<><strong className="text-[var(--text)]">#1 vs #4</strong> on the left, <strong className="text-[var(--text)]">#2 vs #3</strong> on the right. Winners meet in the championship.</>} />
            <Step n="04" body={<><strong className="text-[var(--text)]">Matchups resolve on +/-.</strong> Once seeded, bracket matchups compare season point differentials. Higher +/- advances.</>} />
            <Step n="05" body={<><strong className="text-[var(--text)]">Why +/-?</strong> Cross-pairing teams may never have played each other, so W/L head-to-head doesn't exist. +/- always does.</>} />
            <Step n="06" body={<><strong className="text-[var(--text)]">No double counting.</strong> Playoff results don't add to stats - +/- is already tallied. Bracket is a live projection, locks after Week {TOTAL_WEEKS}.</>} />
          </div>
        </div>
      </section>
    </>
  );
}

function HeroStat({ value, label }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="display font-black text-2xl w-8 text-right">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function RaceRow({ seed, fourthSeedWins, isLastIn }) {
  const inPlayoffs = seed.seed <= 4;
  const gb = Math.max(0, fourthSeedWins - seed.gamesWon);
  const players = splitKey(seed.duo).join(' & ');
  const diffCls = seed.isDnp ? 'text-[var(--text-dim)]' : (seed.diff > 0 ? 'diff-pos' : seed.diff < 0 ? 'diff-neg' : '');

  return (
    <>
      <Link
        to={`/teams/${seed.key}`}
        className={`race-row ${inPlayoffs ? 'in' : 'out'} flex items-center ${isLastIn ? '' : 'border-b border-[var(--border)]'}`}
      >
        <span className="w-10 text-center shrink-0 py-3">
          <span className={`rank ${seed.seed === 1 ? 'top' : ''}`}>{seed.seed}</span>
        </span>
        <div className="flex-1 py-3 pl-2 flex items-center gap-3 min-w-0">
          <TeamLogo duoKey={seed.key} size={32} />
          <div className="min-w-0">
            <div className="display font-black text-base leading-none whitespace-nowrap">
              {seed.name?.toUpperCase()} <span className="record">({seed.record})</span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] whitespace-nowrap mt-1">{players}</div>
          </div>
        </div>
        <span className={`w-16 text-right shrink-0 py-3 display font-bold tabular ${diffCls}`}>
          {seed.isDnp ? 0 : (seed.diff > 0 ? `+${seed.diff}` : seed.diff)}
        </span>
        <span className="w-24 text-right shrink-0 py-3 pr-4">
          {inPlayoffs ? (
            <span className="status-pill in">IN</span>
          ) : (
            <span className="display font-bold text-lg tabular text-[var(--accent)]">-{gb}</span>
          )}
        </span>
      </Link>
      {isLastIn && (
        <div className="playoff-line-row">
          <div className="line-seg" />
          <span className="pl-label">PLAYOFF LINE</span>
          <div className="line-seg" />
        </div>
      )}
    </>
  );
}

function Semifinal({ label, matchup, side }) {
  const { winner, loser, coinflip } = matchup;
  const matchupLabel = side === 'left' ? '#1 vs #4' : '#2 vs #3';
  return (
    <div className={`semifinal-${side}`}>
      <div className="semi-header">
        <Pill variant="small">{label}</Pill>
        <span className="text-[10px] text-[var(--text-dim)] font-bold tracking-[0.12em] uppercase">{matchupLabel}</span>
      </div>

      <SemiTeamCard team={winner} winner />
      <div className="vs-divider">VS</div>
      <SemiTeamCard team={loser} />

      <div className="advances-note">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="5 12 19 12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
        {winner.name?.toUpperCase()} advances{' '}
        {coinflip
          ? '(COINFLIP)'
          : `(${signed(winner.diff)} vs ${signed(loser.diff)})`}
      </div>
    </div>
  );
}

function SemiTeamCard({ team, winner = false }) {
  return (
    <Link
      to={`/teams/${team.key}`}
      className={`team-card ${winner ? 'winner' : 'loser'}`}
    >
      <span className="seed-badge">#{team.seed}</span>
      <TeamLogo duoKey={team.key} />
      <div className="min-w-0">
        <div className="team-name">
          {team.name?.toUpperCase()} <span className="record">({team.record})</span>
        </div>
        <div className="team-duo">{splitKey(team.duo).join(' · ')}</div>
      </div>
      <div className="team-score tabular">{signed(team.diff)}</div>
    </Link>
  );
}

function Championship({ final, seasonComplete }) {
  const { winner, loser, coinflip } = final;
  return (
    <div className="championship">
      <div className="championship-card">
        <div className="flex justify-center mb-4">
          <Pill variant="accent">
            <TrophyIcon />
            Championship
          </Pill>
        </div>

        <div className="space-y-1">
          <MiniTeam team={winner} winner />
          <div className="champ-mini-vs">VS</div>
          <MiniTeam team={loser} />
        </div>

        <div className="projected-champion">
          <div className="pc-label">{seasonComplete ? 'Champion' : 'Projected Champion'}</div>
          <div className="pc-name">{winner.name?.toUpperCase()}</div>
          <div className="pc-duo">
            {splitKey(winner.duo).join(' · ')}
            {coinflip && <span className="text-[var(--accent)] font-bold ml-2">· COINFLIP</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniTeam({ team, winner = false }) {
  return (
    <Link
      to={`/teams/${team.key}`}
      className={`mini-team ${winner ? 'winner' : 'loser'}`}
    >
      <span className="seed-badge">#{team.seed}</span>
      <TeamLogo duoKey={team.key} size={32} />
      <div className="min-w-0">
        <div className="name">
          {team.name?.toUpperCase()} <span className="record">({team.record})</span>
        </div>
        <div className="duo">{splitKey(team.duo).join(' · ')}</div>
      </div>
      <div className="score tabular">{signed(team.diff)}</div>
    </Link>
  );
}

function Step({ n, body }) {
  return (
    <div className="flex items-start gap-3">
      <span className="display font-black text-[var(--accent)] text-lg leading-none mt-0.5 w-6 shrink-0">{n}</span>
      <div>{body}</div>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

