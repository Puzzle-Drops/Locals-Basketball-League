import { Link, useParams } from 'react-router-dom';
import { DUO_KEYS, splitKey } from '../lib/constants.js';
import { CURRENT_SEASON, SEASONS, TEAMS, teamLogo, playerPortrait } from '../lib/data.js';
import { computeSeason, computeCareer, decorateDuo, fmt1 } from '../lib/stats.js';

export default function TeamDetail() {
  const { key } = useParams();
  if (!DUO_KEYS.includes(key)) {
    return <p>Unknown team.</p>;
  }

  const season = computeSeason(CURRENT_SEASON);
  const career = computeCareer(SEASONS);
  const seasonD = decorateDuo(key, season.duoStats[key]);
  const careerD = decorateDuo(key, career.duoStats[key]);
  const [p1, p2] = splitKey(key);

  const games = season.seriesIndex
    .filter((s) => s.team1_key === key || s.team2_key === key)
    .flatMap((s) =>
      s.games.map((g) => ({
        ...g,
        week: s.week,
        matchup_id: s.matchup_id,
        season: s.season,
        opponentKey: s.team1_key === key ? s.team2_key : s.team1_key,
        teamScore: s.team1_key === key ? g.team1_score : g.team2_score,
        oppScore: s.team1_key === key ? g.team2_score : g.team1_score,
      }))
    );

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <img src={teamLogo(key)} alt="" className="h-16 w-16" />
        <div>
          <h1 className="text-2xl font-bold">{TEAMS[key]}</h1>
          <p className="text-sm text-gray-600">{key}</p>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-2">Roster</h2>
        <div className="flex gap-4">
          {[p1, p2].map((p) => (
            <Link key={p} to={`/players/${p}`} className="flex items-center gap-2 hover:underline">
              <img src={playerPortrait(p)} alt="" className="h-10 w-10 rounded-full bg-gray-200" />
              <span>{p}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatBlock title={`Season ${CURRENT_SEASON.season}`} d={seasonD} />
        <StatBlock title="Career" d={careerD} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Game Log</h2>
        {games.length === 0 ? (
          <p className="text-sm text-gray-600">No games played yet.</p>
        ) : (
          <table className="w-full text-sm border border-gray-200 bg-white">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-2">Week</th>
                <th className="p-2">Opponent</th>
                <th className="p-2">Score</th>
                <th className="p-2">Result</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => {
                const won = g.teamScore > g.oppScore;
                const tied = g.teamScore === g.oppScore;
                return (
                  <tr key={`${g.season}-${g.week}-${g.matchup_id}-${g.game}`} className="border-t border-gray-200">
                    <td className="p-2">W{g.week} G{g.game}</td>
                    <td className="p-2">{TEAMS[g.opponentKey]}</td>
                    <td className="p-2">{g.teamScore}-{g.oppScore}</td>
                    <td className={`p-2 ${won ? 'text-green-700' : tied ? '' : 'text-red-700'}`}>
                      {won ? 'W' : tied ? 'T' : 'L'}
                    </td>
                    <td className="p-2">
                      <Link
                        to={`/game/${g.season}/${g.week}/${g.matchup_id}/${g.game}`}
                        className="text-blue-600 hover:underline"
                      >
                        details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function StatBlock({ title, d }) {
  return (
    <div className="bg-white border border-gray-200 p-3">
      <h3 className="font-semibold mb-2">{title}</h3>
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-gray-500">Series</dt><dd>{d.seriesWon}-{d.seriesLost}</dd>
        <dt className="text-gray-500">Games</dt><dd>{d.gamesWon}-{d.gamesLost}</dd>
        <dt className="text-gray-500">PF / PA</dt><dd>{d.pointsFor} / {d.pointsAgainst}</dd>
        <dt className="text-gray-500">Diff</dt><dd>{d.diff > 0 ? `+${d.diff}` : d.diff}</dd>
        <dt className="text-gray-500">Avg margin</dt><dd>{fmt1(d.avgMargin)}</dd>
        <dt className="text-gray-500">Avg PF</dt><dd>{fmt1(d.avgPF)}</dd>
        <dt className="text-gray-500">Avg PA</dt><dd>{fmt1(d.avgPA)}</dd>
        <dt className="text-gray-500">Game win%</dt><dd>{Math.round(d.gameWinPct * 100)}%</dd>
        <dt className="text-gray-500">Series win%</dt><dd>{Math.round(d.seriesWinPct * 100)}%</dd>
        <dt className="text-gray-500">Blowouts</dt><dd>{d.blowouts}</dd>
      </dl>
    </div>
  );
}
