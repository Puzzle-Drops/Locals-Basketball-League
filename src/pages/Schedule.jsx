import { Link } from 'react-router-dom';
import { CURRENT_SEASON, TEAMS, teamLogo } from '../lib/data.js';
import { computeSeason } from '../lib/stats.js';

const STATUS_LABEL = {
  completed: 'Completed',
  partial: 'Partial',
  dnp: 'DNP',
};

export default function Schedule() {
  const computed = computeSeason(CURRENT_SEASON);
  const byWeek = new Map();
  for (const s of computed.seriesIndex) {
    const list = byWeek.get(s.week) ?? [];
    list.push(s);
    byWeek.set(s.week, list);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Schedule — Season {CURRENT_SEASON.season}</h1>
      {[...byWeek.entries()].map(([week, series]) => (
        <section key={week}>
          <h2 className="text-lg font-semibold mb-2">Week {week}</h2>
          <div className="space-y-2">
            {series.map((s) => (
              <div key={s.matchup_id} className="bg-white border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={teamLogo(s.team1_key)} alt="" className="h-6 w-6" />
                    <Link to={`/teams/${s.team1_key}`} className="hover:underline">{TEAMS[s.team1_key]}</Link>
                    <span className="text-gray-500">vs</span>
                    <Link to={`/teams/${s.team2_key}`} className="hover:underline">{TEAMS[s.team2_key]}</Link>
                    <img src={teamLogo(s.team2_key)} alt="" className="h-6 w-6" />
                  </div>
                  <div className="text-sm">
                    {s.played ? (
                      <span>
                        {s.t1Games}-{s.t2Games}{' '}
                        {s.decided && <span className="text-green-700">· {TEAMS[s.winnerKey]}</span>}
                      </span>
                    ) : (
                      <span className="text-gray-500">{STATUS_LABEL[s.status]}</span>
                    )}
                  </div>
                </div>
                {s.games.length > 0 && (
                  <ul className="mt-2 text-sm text-gray-700 flex flex-wrap gap-3">
                    {s.games.map((g) => (
                      <li key={g.game}>
                        <Link
                          to={`/game/${s.season}/${s.week}/${s.matchup_id}/${g.game}`}
                          className="hover:underline"
                        >
                          G{g.game}: {g.team1_score}-{g.team2_score}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
