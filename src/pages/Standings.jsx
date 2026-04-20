import { Link } from 'react-router-dom';
import { CURRENT_SEASON, SEASONS, TEAMS, teamLogo } from '../lib/data.js';
import { computeSeason, computeCareer, standings, fmt1 } from '../lib/stats.js';

function Table({ rows }) {
  return (
    <table className="w-full text-sm border border-gray-200 bg-white">
      <thead className="bg-gray-100 text-left">
        <tr>
          <th className="p-2">#</th>
          <th className="p-2">Duo</th>
          <th className="p-2">Series</th>
          <th className="p-2">Games</th>
          <th className="p-2">PF</th>
          <th className="p-2">PA</th>
          <th className="p-2">Diff</th>
          <th className="p-2">Avg Margin</th>
          <th className="p-2">Win %</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d, i) => (
          <tr key={d.key} className="border-t border-gray-200">
            <td className="p-2 text-gray-500">{i + 1}</td>
            <td className="p-2">
              <Link to={`/teams/${d.key}`} className="flex items-center gap-2 hover:underline">
                <img src={teamLogo(d.key)} alt="" className="h-5 w-5" />
                {TEAMS[d.key]}{' '}
                <span className="text-gray-500 text-xs">({d.key})</span>
              </Link>
            </td>
            <td className="p-2">{d.seriesWon}-{d.seriesLost}</td>
            <td className="p-2">{d.gamesWon}-{d.gamesLost}</td>
            <td className="p-2">{d.pointsFor}</td>
            <td className="p-2">{d.pointsAgainst}</td>
            <td className="p-2">{d.diff > 0 ? `+${d.diff}` : d.diff}</td>
            <td className="p-2">{fmt1(d.avgMargin)}</td>
            <td className="p-2">{Math.round(d.gameWinPct * 100)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Standings() {
  const season = computeSeason(CURRENT_SEASON);
  const seasonRows = standings(season.duoStats, season.h2h);
  const career = computeCareer(SEASONS);
  const careerRows = standings(career.duoStats, career.h2h);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold mb-2">Standings - Season {CURRENT_SEASON.season}</h1>
        <Table rows={seasonRows} />
        <p className="text-xs text-gray-500 mt-2">
          Tiebreakers: head-to-head series record, then point differential.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Career</h2>
        <Table rows={careerRows} />
      </section>
    </div>
  );
}
