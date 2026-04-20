import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON, TEAMS } from '../lib/data.js';
import { computeSeason, standings, fmt1 } from '../lib/stats.js';
import { splitKey } from '../lib/constants.js';
import TeamLogo from '../components/TeamLogo.jsx';
import Pill from '../components/Pill.jsx';

export default function Teams() {
  const computed = useMemo(() => computeSeason(CURRENT_SEASON), []);
  const ranks = useMemo(
    () => standings(computed.duoStats, computed.h2h),
    [computed]
  );

  return (
    <>
      <section className="court-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Pill variant="accent">Six Duos</Pill>
              <span className="text-[11px] tracking-[0.16em] uppercase text-[var(--text-muted)] font-semibold">
                Season {CURRENT_SEASON.season}
              </span>
            </div>
            <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide">TEAMS</h1>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ranks.map((d, i) => (
            <TeamCard key={d.key} rank={i + 1} duo={d} />
          ))}
        </div>
      </section>
    </>
  );
}

function TeamCard({ rank, duo }) {
  const players = splitKey(duo.key).join(' & ');
  const isDnp = duo.gamesPlayed === 0;
  const diff = duo.diff;
  return (
    <Link to={`/teams/${duo.key}`} className="card p-5 flex items-center gap-4 group">
      <TeamLogo duoKey={duo.key} size={56} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`rank text-base ${rank === 1 ? 'top' : ''}`}>#{rank}</span>
          <span className="display font-black text-xl leading-none">{TEAMS[duo.key]?.toUpperCase()}</span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)] truncate">{players}</div>
        <div className="flex items-center gap-3 mt-2 text-[12px]">
          {isDnp ? (
            <span className="text-[var(--text-dim)] font-semibold">No games yet</span>
          ) : (
            <>
              <span className="display font-bold tabular">{duo.gamesWon}-{duo.gamesLost}</span>
              <span className="text-[var(--text-dim)]">·</span>
              <span className={`display font-bold tabular ${diff > 0 ? 'diff-pos' : diff < 0 ? 'diff-neg' : ''}`}>
                {diff > 0 ? `+${diff}` : `${diff}`}
              </span>
            </>
          )}
        </div>
      </div>
      <svg className="text-[var(--text-dim)] group-hover:text-[var(--accent)] transition shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
