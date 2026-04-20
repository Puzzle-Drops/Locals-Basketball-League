import { Link, useParams } from 'react-router-dom';
import { findGame, TEAMS } from '../lib/data.js';
import { splitKey, TEAM_COLORS, teamGradient } from '../lib/constants.js';
import { fmt1 } from '../lib/stats.js';
import TeamLogo from '../components/TeamLogo.jsx';
import PlayerAvatar from '../components/PlayerAvatar.jsx';
import Pill from '../components/Pill.jsx';

function ytEmbed(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
  } catch { return null; }
  return null;
}

function hexToRgba(hex, alpha) {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return `rgba(255,107,43,${alpha})`;
  const [r, g, b] = m.map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Series clincher / dead-game label per HANDOFF ripple #3.
//   - G1 / G2: no label
//   - G3 with series 1-1 going in: CLINCHER
//   - G3 with series 2-0 going in: DEAD GAME
function clincherInfo(series, gameNum) {
  if (gameNum !== 3) return null;
  const prior = series.games.filter((g) => g.game < 3);
  let t1 = 0, t2 = 0;
  for (const g of prior) {
    if (g.team1_score > g.team2_score) t1++;
    else if (g.team2_score > g.team1_score) t2++;
  }
  if (t1 === 1 && t2 === 1) return { kind: 'clincher' };
  if (t1 === 2 || t2 === 2) {
    const winnerKey = t1 === 2 ? series.team1_key : series.team2_key;
    return { kind: 'dead', clinchedBy: winnerKey };
  }
  return null;
}

export default function GameDetail() {
  const { season, week, matchup, game } = useParams();
  const found = findGame(season, week, matchup, game);
  if (!found) {
    return <div className="max-w-6xl mx-auto px-5 py-12 text-[var(--text-muted)]">Game not found.</div>;
  }
  const { series, game: g } = found;
  const t1 = series.team1_key, t2 = series.team2_key;
  const winnerKey =
    g.team1_score > g.team2_score ? t1 :
    g.team2_score > g.team1_score ? t2 : null;
  const margin = Math.abs(g.team1_score - g.team2_score);

  const c1 = TEAM_COLORS[t1];
  const c2 = TEAM_COLORS[t2];
  const heroStyle = {
    '--game-c1': c1 ? hexToRgba(c1.primary, 0.25) : undefined,
    '--game-c2': c2 ? hexToRgba(c2.primary, 0.22) : undefined,
  };

  const clincher = clincherInfo(series, g.game);

  // Play-order series number within its week
  const weekSeries = found.week?.series ?? [];
  const seriesNum = weekSeries.findIndex((s) => s.matchup_id === series.matchup_id) + 1;

  const embed = ytEmbed(g.vod_url);

  return (
    <>
      {/* HERO */}
      <section className="game-bg border-b border-[var(--border)]" style={heroStyle}>
        <div className="max-w-6xl mx-auto px-5 pt-6 pb-10 relative overflow-hidden">
          <div className="absolute inset-0 grid-lines opacity-40 pointer-events-none" />

          {/* Breadcrumb */}
          <div className="relative text-[11px] font-bold tracking-[0.12em] uppercase mb-6">
            <Link to="/schedule" className="crumb">Schedule</Link>
            <span className="crumb-sep">›</span>
            <Link to={`/schedule#week-${week}`} className="crumb">Week {week}</Link>
            <span className="crumb-sep">›</span>
            <Link to={`/schedule#series-${week}-${matchup}`} className="crumb">Series {seriesNum || matchup}</Link>
            <span className="crumb-sep">›</span>
            <span className="crumb current">Game {g.game}</span>
          </div>

          {/* Pills */}
          <div className="relative flex flex-wrap items-center gap-2 mb-5">
            <Pill>Week {week}</Pill>
            <Pill>Series {seriesNum || matchup}</Pill>
            <Pill variant="accent">Game {g.game}</Pill>
            <Pill variant="success">Final</Pill>
          </div>

          {/* Teams + scores */}
          <div className="relative grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
            <TeamSide
              duoKey={t1}
              winner={winnerKey === t1}
              align="left"
            />
            <div className="flex items-center gap-3 sm:gap-5 justify-center">
              <div className={`display font-black text-6xl md:text-7xl tabular leading-none ${winnerKey === t1 ? 'winner' : 'loser'}`}>
                {g.team1_score}
              </div>
              <div className="display font-black text-4xl md:text-5xl tabular text-[var(--text-dim)] leading-none">-</div>
              <div className={`display font-black text-6xl md:text-7xl tabular leading-none ${winnerKey === t2 ? 'winner' : 'loser'}`}>
                {g.team2_score}
              </div>
            </div>
            <TeamSide
              duoKey={t2}
              winner={winnerKey === t2}
              align="right"
            />
          </div>

          {/* Game context strip */}
          <div className="relative mt-6 pt-5 border-t border-[var(--border)] flex flex-wrap items-center gap-x-5 gap-y-2">
            <ContextStat
              value={`+${margin}`}
              label="Margin"
              valueCls={margin > 0 ? 'diff-pos' : ''}
            />
            {clincher?.kind === 'clincher' && winnerKey && (
              <>
                <Dot />
                <ContextLabel
                  text="Series clincher"
                  sub={`${TEAMS[winnerKey]} won 2-1`}
                />
              </>
            )}
            {clincher?.kind === 'dead' && (
              <>
                <Dot />
                <ContextLabel
                  text="Dead game"
                  sub={`${TEAMS[clincher.clinchedBy]} clinched 2-0`}
                />
              </>
            )}
            {g.date && (
              <>
                <Dot className="hidden md:inline" />
                <div className="hidden md:flex items-baseline gap-2">
                  <span className="text-sm font-bold tabular">{fmtDate(g.date)}</span>
                  <span className="stat-label">Played</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* VOD */}
      <section className="max-w-6xl mx-auto px-5 pt-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="stat-label mb-1">Watch the Game</div>
            <h2 className="display font-black text-2xl tracking-wide">VOD</h2>
          </div>
          {g.vod_url && (
            <a
              href={g.vod_url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--accent)] uppercase tracking-[0.12em] transition flex items-center gap-1.5"
            >
              Open on YouTube
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>

        {embed ? (
          <iframe
            className="w-full aspect-video rounded-xl border border-[var(--border)]"
            src={embed}
            title={`${TEAMS[t1]} vs ${TEAMS[t2]} G${g.game}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="video-placeholder aspect-video rounded-xl relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 grid-lines opacity-30 pointer-events-none" />
            <div className="relative flex flex-col items-center gap-4 text-center px-6">
              {g.vod_url ? (
                <a
                  href={g.vod_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-20 h-20 rounded-full bg-[var(--accent)] hover:bg-[#ff8552] transition flex items-center justify-center shadow-[0_0_40px_rgba(255,107,43,0.35)]"
                  aria-label="Play"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="ml-1.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </a>
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/5 border border-[var(--border)] flex items-center justify-center text-[var(--text-dim)]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1.5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
              <div>
                <div className="display font-black text-xl tracking-wide">
                  {TEAMS[t1]?.toUpperCase()} vs {TEAMS[t2]?.toUpperCase()} · G{g.game}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] font-semibold uppercase tracking-[0.16em] mt-2">
                  {g.vod_url ? 'YouTube link' : 'No VOD linked'}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* BOX SCORE */}
      <section className="max-w-6xl mx-auto px-5 pt-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="stat-label mb-1">Per-Player Breakdown</div>
            <h2 className="display font-black text-3xl tracking-wide">BOX SCORE</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <BoxScore
            duoKey={t1}
            score={g.team1_score}
            opponentScore={g.team2_score}
            winner={winnerKey === t1}
          />
          <BoxScore
            duoKey={t2}
            score={g.team2_score}
            opponentScore={g.team1_score}
            winner={winnerKey === t2}
          />
        </div>
      </section>

      {/* SERIES GAMES */}
      <section className="max-w-6xl mx-auto px-5 pt-12 pb-12">
        <div className="flex items-end justify-between mb-6 gap-3 flex-wrap">
          <div>
            <div className="stat-label mb-1">{seriesSummary(series)}</div>
            <h2 className="display font-black text-3xl tracking-wide">SERIES GAMES</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => {
            const otherGame = series.games.find((x) => x.game === n);
            return (
              <SeriesCell
                key={n}
                n={n}
                game={otherGame}
                team1Key={t1}
                team2Key={t2}
                isCurrent={Number(g.game) === n}
                gameUrl={otherGame ? `/game/${season}/${week}/${matchup}/${n}` : null}
              />
            );
          })}
        </div>
      </section>
    </>
  );
}

function seriesSummary(series) {
  let t1 = 0, t2 = 0;
  for (const g of series.games) {
    if (g.team1_score > g.team2_score) t1++;
    else if (g.team2_score > g.team1_score) t2++;
  }
  if (t1 + t2 === 0) return 'Series not started';
  if (t1 > t2) return `${TEAMS[series.team1_key]} won ${t1}-${t2}`;
  if (t2 > t1) return `${TEAMS[series.team2_key]} won ${t2}-${t1}`;
  return `Series tied ${t1}-${t2}`;
}

function TeamSide({ duoKey, winner, align }) {
  const players = splitKey(duoKey).join(' & ');
  const isRight = align === 'right';
  return (
    <Link
      to={`/teams/${duoKey}`}
      className={`flex items-center gap-4 ${isRight ? 'flex-row-reverse text-right' : ''}`}
    >
      <TeamLogo duoKey={duoKey} className="logo-lg" size={56} />
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-2 flex-wrap ${isRight ? 'justify-end' : ''}`}>
          <span className={`display font-black text-3xl md:text-4xl leading-none ${winner ? 'winner' : 'loser'}`}>
            {TEAMS[duoKey]?.toUpperCase()}
          </span>
          {winner && <Pill variant="accent">Winner</Pill>}
        </div>
        <div className={`text-[11px] mt-1 truncate ${winner ? 'text-[var(--text-muted)]' : 'text-[var(--text-dim)]'}`}>
          {players}
        </div>
      </div>
    </Link>
  );
}

function ContextStat({ value, label, valueCls = '' }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`display font-black text-xl tabular ${valueCls}`}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function ContextLabel({ text, sub }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-sm font-bold">{text}</span>
      <span className="stat-label">{sub}</span>
    </div>
  );
}

function Dot({ className = '' }) {
  return <span className={`text-[var(--text-dim)] ${className}`}>·</span>;
}

function BoxScore({ duoKey, score, opponentScore, winner }) {
  const players = splitKey(duoKey);
  const playerPts = score / 2;
  const playerPa = opponentScore / 2;
  const playerPm = playerPts - playerPa;
  const colors = TEAM_COLORS[duoKey];
  const headerStyle = colors
    ? { background: `linear-gradient(90deg, ${hexToRgba(colors.primary, 0.12)}, transparent)` }
    : {};

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]" style={headerStyle}>
        <TeamLogo duoKey={duoKey} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="display font-black text-lg leading-none">{TEAMS[duoKey]?.toUpperCase()}</span>
            {winner && <Pill variant="accent">Winner</Pill>}
          </div>
        </div>
        <div className={`display font-black text-3xl tabular leading-none ${winner ? '' : 'text-[var(--text-muted)]'}`}>
          {score}
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] text-[10px] tracking-[0.12em] uppercase font-bold text-[var(--text-muted)]">
        <span className="flex-1">Player</span>
        <span className="w-12 text-right">PTS</span>
        <span className="w-12 text-right">PA</span>
        <span className="w-12 text-right">+/-</span>
      </div>

      {players.map((p, i) => (
        <Link
          key={p}
          to={`/players/${p}`}
          className={`box-row flex items-center gap-2 px-4 py-3 group ${i === 0 ? 'border-b border-[var(--border)]' : ''}`}
        >
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <PlayerAvatar name={p} size={32} />
            <span className="display font-black text-base leading-none group-hover:text-[var(--accent)] transition">
              {p.toUpperCase()}
            </span>
          </div>
          <span className="w-12 text-right display font-bold text-base tabular">{fmt1(playerPts)}</span>
          <span className="w-12 text-right display font-bold text-base tabular text-[var(--text-muted)]">{fmt1(playerPa)}</span>
          <span className={`w-12 text-right display font-bold text-base tabular ${playerPm > 0 ? 'diff-pos' : playerPm < 0 ? 'diff-neg' : ''}`}>
            {playerPm > 0 ? `+${fmt1(playerPm)}` : fmt1(playerPm)}
          </span>
        </Link>
      ))}
    </div>
  );
}

function SeriesCell({ n, game, team1Key, team2Key, isCurrent, gameUrl }) {
  const interactive = !isCurrent && !!game;
  const status = !game ? 'Not played'
    : game.team1_score > game.team2_score ? `${TEAMS[team1Key]} W`
    : game.team2_score > game.team1_score ? `${TEAMS[team2Key]} W`
    : 'Tied';

  const inner = (
    <div className="game-cell-row">
      <span className="game-cell-label">GAME {n}</span>
      <div className="game-cell-score">
        <TeamLogo duoKey={team1Key} size={22} />
        {game ? (
          <span className="score-text">
            <span className={game.team1_score > game.team2_score ? 'winner' : 'loser'}>{game.team1_score}</span>
            -
            <span className={game.team2_score > game.team1_score ? 'winner' : 'loser'}>{game.team2_score}</span>
          </span>
        ) : (
          <span className="score-text text-[var(--text-dim)]">0-0</span>
        )}
        <TeamLogo duoKey={team2Key} size={22} />
      </div>
      <span className="game-cell-status">{status}</span>
    </div>
  );

  const className = `game-cell ${isCurrent ? 'current' : ''}`;
  return interactive
    ? <Link to={gameUrl} className={className}>{inner}</Link>
    : <div className={className}>{inner}</div>;
}
