import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TEAMS } from '../lib/data.js';
import { splitKey, teamGradient } from '../lib/constants.js';
import TeamLogo from './TeamLogo.jsx';
import Pill from './Pill.jsx';

function teamTotals(games) {
  let t1 = 0, t2 = 0;
  for (const g of games ?? []) { t1 += g.team1_score; t2 += g.team2_score; }
  return [t1, t2];
}

// Mockup-faithful series scorecard. Used on Home, Schedule, Team Detail
// (Game Log + Up Next), and Game Detail (series strip).
//
// `series` shape:
//   { season, week, matchup_id, team1_key, team2_key, status, games,
//     played, decided, winnerKey, t1Games, t2Games }
// For upcoming series (week 2/3 derived from rotation), pass an object with
// `games: []` and either `status: "upcoming"` or no status. The card then
// renders the "0-0" placeholder game strip and 0-0 score lines.
//
// `records` (optional, upcoming only): { team1: "2-1", team2: "1-2" } -- shown
// in parens next to each team name.
export default function Scorecard({
  series,
  weekNumber,
  seriesNumber,
  records,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const {
    season, team1_key, team2_key, status, games = [],
    played, decided, winnerKey, t1Games = 0, t2Games = 0, matchup_id,
  } = series;
  const week = weekNumber ?? series.week;
  const seriesNum = seriesNumber ?? series.seriesNumber ?? series.matchup_id;

  const isDnp = status === 'dnp';
  const isUpcoming = !isDnp && !played;
  const winner1 = decided && winnerKey === team1_key;
  const winner2 = decided && winnerKey === team2_key;
  const [t1Total, t2Total] = teamTotals(games);

  // Expanded summary
  let margin = null, biggest = null, closest = null;
  if (played && games.length) {
    const winSide = decided && winnerKey === team2_key ? 2 : 1;
    margin = winSide === 1 ? t1Total - t2Total : t2Total - t1Total;
    if (!decided) margin = t1Total - t2Total;
    const sorted = [...games].sort(
      (a, b) => Math.abs(b.team1_score - b.team2_score) - Math.abs(a.team1_score - a.team2_score)
    );
    biggest = sorted[0];
    closest = sorted[sorted.length - 1];
  }

  const onCardClick = (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    setExpanded((v) => !v);
  };

  return (
    <article
      className={`scorecard p-5 cursor-pointer ${expanded ? 'expanded' : ''}`}
      onClick={onCardClick}
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pill>Week {week}</Pill>
          <Pill>Series {seriesNum}</Pill>
          {isDnp && <Pill variant="dnp">DNP</Pill>}
        </div>
        <span className="text-[11px] font-bold text-[var(--text-muted)] tracking-wider">3 GAMES</span>
      </header>

      <TeamRow
        duoKey={team1_key}
        score={played ? t1Total : 0}
        wins={t1Games}
        winner={winner1}
        dimmed={played && !winner1 && decided}
        played={played}
        record={records?.team1}
      />
      <div className="mt-3" />
      <TeamRow
        duoKey={team2_key}
        score={played ? t2Total : 0}
        wins={t2Games}
        winner={winner2}
        dimmed={played && !winner2 && decided}
        played={played}
        record={records?.team2}
      />

      <div className="mt-5 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-2">
        {[1, 2, 3].map((n) => {
          const g = games.find((x) => x.game === n);
          return (
            <GameCell
              key={n}
              n={n}
              game={g}
              team1Key={team1_key}
              team2Key={team2_key}
              isDnp={isDnp}
              isUpcoming={isUpcoming}
              gameUrl={g ? `/game/${season}/${week}/${matchup_id}/${n}` : null}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-end">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="text-[var(--accent)] text-[11px] font-bold tracking-widest uppercase flex items-center gap-1"
        >
          Details
          <svg className="chev" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <div className="expandable">
        <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-3 gap-3 text-center">
          <Stat
            label="Margin"
            value={played ? (margin > 0 ? `+${margin}` : `${margin}`) : '0'}
            cls={!played ? 'text-[var(--text-muted)]' : (margin > 0 ? 'diff-pos' : margin < 0 ? 'diff-neg' : '')}
          />
          <Stat
            label="Biggest Game"
            value={biggest ? `${biggest.team1_score}-${biggest.team2_score}` : '0-0'}
            cls={played ? 'tabular' : 'tabular text-[var(--text-muted)]'}
          />
          <Stat
            label="Closest"
            value={closest ? `${closest.team1_score}-${closest.team2_score}` : '0-0'}
            cls={played ? 'tabular' : 'tabular text-[var(--text-muted)]'}
          />
        </div>
      </div>
    </article>
  );
}

function TeamRow({ duoKey, score, wins, winner, dimmed, played, record }) {
  const name = TEAMS[duoKey];
  const players = splitKey(duoKey).join(' & ');
  const winsLabel = wins === 1 ? '1 WIN' : `${wins} WINS`;
  const subColor = dimmed ? 'text-[var(--text-dim)]' : 'text-[var(--text-muted)]';
  const scoreColor = !played ? 'text-[var(--text-muted)]' : (winner ? 'winner' : '');
  const nameColor = winner ? 'winner' : (dimmed ? '' : 'winner');

  return (
    <div className={`flex items-center gap-3 ${dimmed ? 'loser' : ''}`}>
      <div className="team-bar" style={{ background: teamGradient(duoKey, 180) }} />
      <Link
        to={`/teams/${duoKey}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <TeamLogo duoKey={duoKey} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`display font-black text-xl ${nameColor}`}>{name?.toUpperCase()}</span>
            {record && (
              <span className="text-xs text-[var(--text-muted)] font-bold tabular">({record})</span>
            )}
            {winner && <Pill variant="accent">Winner</Pill>}
          </div>
          <div className={`text-xs truncate ${subColor}`}>{players}</div>
        </div>
      </Link>
      <div className="text-right">
        <div className={`display font-black text-4xl tabular leading-none ${scoreColor}`}>
          {score}
        </div>
        <div className={`text-[11px] font-bold tracking-wider mt-1 ${dimmed ? 'text-[var(--text-dim)]' : 'text-[var(--text-muted)]'}`}>
          {played ? winsLabel : '0 WINS'}
        </div>
      </div>
    </div>
  );
}

function GameCell({ n, game, team1Key, team2Key, isDnp, isUpcoming, gameUrl }) {
  return (
    <div className="relative bg-white/[0.02] rounded-lg p-2 border border-[var(--border)]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-muted)] font-bold tracking-wider">G{n}</span>
        {game?.vod_url && (
          <a
            href={game.vod_url}
            className="vod-btn"
            onClick={(e) => e.stopPropagation()}
            title="Watch VOD"
            target="_blank"
            rel="noreferrer"
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </a>
        )}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-1.5" style={{ minHeight: 18 }}>
        {isDnp && (
          <span className="display font-bold text-sm tracking-widest text-[var(--text-dim)] leading-none">DNP</span>
        )}
        {isUpcoming && (
          <>
            <TeamLogo duoKey={team1Key} mini />
            <span className="display font-bold text-base tabular leading-none text-[var(--text-muted)]">0-0</span>
            <TeamLogo duoKey={team2Key} mini />
          </>
        )}
        {!isDnp && !isUpcoming && game && (
          <>
            <TeamLogo duoKey={team1Key} mini />
            <Link
              to={gameUrl}
              onClick={(e) => e.stopPropagation()}
              className="display font-bold text-base tabular leading-none hover:text-[var(--accent)] transition-colors"
            >
              <span className={game.team1_score > game.team2_score ? 'winner' : 'loser'}>{game.team1_score}</span>
              -
              <span className={game.team2_score > game.team1_score ? 'winner' : 'loser'}>{game.team2_score}</span>
            </Link>
            <TeamLogo duoKey={team2Key} mini />
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, cls = '' }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value text-xl mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
