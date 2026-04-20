import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CURRENT_SEASON } from '../lib/data.js';
import { computeSeason, decoratePlayer, fmt1 } from '../lib/stats.js';
import { PLAYERS } from '../lib/constants.js';
import PlayerAvatar from '../components/PlayerAvatar.jsx';
import Pill from '../components/Pill.jsx';

export default function Players() {
  const computed = useMemo(() => computeSeason(CURRENT_SEASON), []);
  const rows = useMemo(
    () => PLAYERS
      .map((p) => decoratePlayer(p, computed.playerStats[p]))
      .sort((a, b) => b.plusMinus - a.plusMinus),
    [computed]
  );

  return (
    <>
      <section className="player-bg border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 pt-10 pb-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-60 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Pill variant="accent">Four Players</Pill>
              <span className="text-[11px] tracking-[0.16em] uppercase text-[var(--text-muted)] font-semibold">
                Season {CURRENT_SEASON.season}
              </span>
            </div>
            <h1 className="display font-black text-5xl md:text-6xl leading-[0.95] tracking-wide">PLAYERS</h1>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {rows.map((p, i) => (
            <PlayerCard key={p.name} rank={i + 1} player={p} />
          ))}
        </div>
      </section>
    </>
  );
}

function PlayerCard({ rank, player }) {
  const pm = player.plusMinus;
  const pmCls = pm > 0 ? 'diff-pos' : pm < 0 ? 'diff-neg' : 'text-[var(--text-muted)]';
  return (
    <Link to={`/players/${player.name}`} className="card p-5 flex items-center gap-4 group">
      <PlayerAvatar name={player.name} size={64} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`rank text-base ${rank === 1 ? 'top' : ''}`}>#{rank}</span>
          <span className="display font-black text-2xl leading-none">{player.name.toUpperCase()}</span>
        </div>
        <div className="text-[11px] text-[var(--text-muted)]">
          {player.gamesWon}-{player.gamesLost} games · {player.seriesWon}-{player.seriesLost} series
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[var(--border)]">
          <Stat label="+/-" value={pm > 0 ? `+${fmt1(pm)}` : fmt1(pm)} cls={`tabular ${pmCls}`} />
          <Stat label="PPG" value={fmt1(player.ppg)} cls="tabular" />
          <Stat label="PAPG" value={fmt1(player.papg)} cls="tabular" />
        </div>
      </div>
      <svg className="text-[var(--text-dim)] group-hover:text-[var(--accent)] transition shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}

function Stat({ label, value, cls = '' }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value text-lg mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
