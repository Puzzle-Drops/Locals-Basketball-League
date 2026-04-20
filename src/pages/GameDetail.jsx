import { Link, useParams } from 'react-router-dom';
import { findGame, TEAMS, teamLogo, playerPortrait } from '../lib/data.js';
import { splitKey } from '../lib/constants.js';
import { fmt1 } from '../lib/stats.js';

// Convert any YouTube URL to an embed src; otherwise return null.
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
  } catch {
    return null;
  }
  return null;
}

export default function GameDetail() {
  const { season, week, matchup, game } = useParams();
  const found = findGame(season, week, matchup, game);
  if (!found) return <p>Game not found.</p>;
  const { series, game: g } = found;
  const t1 = series.team1_key, t2 = series.team2_key;
  const winnerKey = g.team1_score > g.team2_score ? t1 : g.team2_score > g.team1_score ? t2 : null;
  const embed = ytEmbed(g.vod_url);

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Season {season} · Week {week} · Matchup {matchup} · Game {g.game}
        {g.date && <> · {g.date}</>}
      </p>

      <section className="bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <TeamSide teamKey={t1} score={g.team1_score} highlight={winnerKey === t1} />
          <span className="text-gray-500">vs</span>
          <TeamSide teamKey={t2} score={g.team2_score} highlight={winnerKey === t2} />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Player lines (halved team points)</h2>
        <table className="w-full text-sm border border-gray-200 bg-white">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Player</th>
              <th className="p-2">Team</th>
              <th className="p-2">Pts</th>
              <th className="p-2">Allowed</th>
              <th className="p-2">+/-</th>
            </tr>
          </thead>
          <tbody>
            {[
              ...splitKey(t1).map((p) => ({ p, score: g.team1_score / 2, allowed: g.team2_score / 2, team: t1 })),
              ...splitKey(t2).map((p) => ({ p, score: g.team2_score / 2, allowed: g.team1_score / 2, team: t2 })),
            ].map(({ p, score, allowed, team }) => {
              const pm = score - allowed;
              return (
                <tr key={`${team}-${p}`} className="border-t border-gray-200">
                  <td className="p-2">
                    <Link to={`/players/${p}`} className="flex items-center gap-2 hover:underline">
                      <img src={playerPortrait(p)} alt="" className="h-6 w-6 rounded-full bg-gray-200" />
                      {p}
                    </Link>
                  </td>
                  <td className="p-2">{TEAMS[team]}</td>
                  <td className="p-2">{fmt1(score)}</td>
                  <td className="p-2">{fmt1(allowed)}</td>
                  <td className="p-2">{pm > 0 ? `+${fmt1(pm)}` : fmt1(pm)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">VOD</h2>
        {embed ? (
          <div className="aspect-video w-full max-w-3xl">
            <iframe
              className="w-full h-full"
              src={embed}
              title="VOD"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : g.vod_url ? (
          <a href={g.vod_url} className="text-blue-600 hover:underline" target="_blank" rel="noreferrer">
            {g.vod_url}
          </a>
        ) : (
          <p className="text-sm text-gray-500">No VOD linked.</p>
        )}
      </section>
    </div>
  );
}

function TeamSide({ teamKey, score, highlight }) {
  return (
    <Link to={`/teams/${teamKey}`} className={`flex items-center gap-3 ${highlight ? 'font-semibold' : ''}`}>
      <img src={teamLogo(teamKey)} alt="" className="h-10 w-10" />
      <div>
        <div>{TEAMS[teamKey]}</div>
        <div className="text-2xl">{score}</div>
      </div>
    </Link>
  );
}
