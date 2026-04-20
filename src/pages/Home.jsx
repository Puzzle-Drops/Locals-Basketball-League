import { Link } from 'react-router-dom';
import { CURRENT_SEASON, TEAMS, teamLogo } from '../lib/data.js';
import { computeSeason, standings, fmt1 } from '../lib/stats.js';

export default function Home() {
  const computed = computeSeason(CURRENT_SEASON);
  const table = standings(computed.duoStats, computed.h2h);

  const lastWeek = CURRENT_SEASON.weeks[CURRENT_SEASON.weeks.length - 1];
  const playedSeries = computed.seriesIndex.filter((s) => s.played);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-1">Season {CURRENT_SEASON.season}</h1>
        <p className="text-sm text-gray-600">Currently in Week {lastWeek?.week}.</p>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Standings</h2>
          <Link to="/standings" className="text-sm text-blue-600 hover:underline">View full →</Link>
        </div>
        <table className="w-full text-sm border border-gray-200 bg-white">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Duo</th>
              <th className="p-2">Series</th>
              <th className="p-2">Games</th>
              <th className="p-2">Diff</th>
            </tr>
          </thead>
          <tbody>
            {table.map((d) => (
              <tr key={d.key} className="border-t border-gray-200">
                <td className="p-2">
                  <Link to={`/teams/${d.key}`} className="flex items-center gap-2 hover:underline">
                    <img src={teamLogo(d.key)} alt="" className="h-5 w-5" />
                    {TEAMS[d.key]}{' '}
                    <span className="text-gray-500 text-xs">({d.key})</span>
                  </Link>
                </td>
                <td className="p-2">{d.seriesWon}-{d.seriesLost}</td>
                <td className="p-2">{d.gamesWon}-{d.gamesLost}</td>
                <td className="p-2">{d.diff > 0 ? `+${d.diff}` : d.diff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Latest Results</h2>
        <ul className="space-y-1 text-sm">
          {playedSeries.slice(-5).reverse().map((s) => (
            <li key={`${s.season}-${s.week}-${s.matchup_id}`} className="bg-white border border-gray-200 p-2">
              <span className="text-gray-500 text-xs mr-2">W{s.week}</span>
              <strong>{TEAMS[s.team1_key]}</strong> {s.t1Games}-{s.t2Games}{' '}
              <strong>{TEAMS[s.team2_key]}</strong>
              {s.decided ? (
                <span className="ml-2 text-green-700">
                  → {TEAMS[s.winnerKey]} ({fmt1(((cumPF(s, s.winnerKey)) - cumPA(s, s.winnerKey)))} diff)
                </span>
              ) : (
                <span className="ml-2 text-gray-500">{s.status}</span>
              )}
            </li>
          ))}
          {playedSeries.length === 0 && <li className="text-gray-500">No games played yet.</li>}
        </ul>
      </section>
    </div>
  );
}

// Cumulative PF/PA for a team within a single series (just for the result blurb).
function cumPF(series, teamKey) {
  let pf = 0;
  for (const g of series.games) {
    pf += teamKey === series.team1_key ? g.team1_score : g.team2_score;
  }
  return pf;
}
function cumPA(series, teamKey) {
  let pa = 0;
  for (const g of series.games) {
    pa += teamKey === series.team1_key ? g.team2_score : g.team1_score;
  }
  return pa;
}
