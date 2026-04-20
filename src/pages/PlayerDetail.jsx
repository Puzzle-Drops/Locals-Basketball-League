import { Link, useParams } from 'react-router-dom';
import { PLAYERS, PLAYER_DUOS } from '../lib/constants.js';
import { CURRENT_SEASON, SEASONS, TEAMS, playerPortrait, teamLogo } from '../lib/data.js';
import {
  computeSeason,
  computeCareer,
  decoratePlayer,
  partnerBreakdown,
  fmt1,
} from '../lib/stats.js';

export default function PlayerDetail() {
  const { name } = useParams();
  if (!PLAYERS.includes(name)) return <p>Unknown player.</p>;

  const season = computeSeason(CURRENT_SEASON);
  const career = computeCareer(SEASONS);
  const seasonD = decoratePlayer(name, season.playerStats[name]);
  const careerD = decoratePlayer(name, career.playerStats[name]);

  const seasonPartners = partnerBreakdown(name, season.duoStats);
  const careerPartners = partnerBreakdown(name, career.duoStats);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-4">
        <img src={playerPortrait(name)} alt="" className="h-16 w-16 rounded-full bg-gray-200" />
        <h1 className="text-2xl font-bold">{name}</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlayerStatBlock title={`Season ${CURRENT_SEASON.season}`} d={seasonD} />
        <PlayerStatBlock title="Career" d={careerD} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PartnerBlock title={`Season ${CURRENT_SEASON.season} - Partners`} player={name} pb={seasonPartners} />
        <PartnerBlock title="Career - Partners" player={name} pb={careerPartners} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Duos this player is in</h2>
        <ul className="flex flex-wrap gap-2">
          {PLAYER_DUOS[name].map((key) => (
            <li key={key}>
              <Link to={`/teams/${key}`} className="bg-white border border-gray-200 px-2 py-1 inline-flex items-center gap-2 hover:bg-gray-100">
                <img src={teamLogo(key)} alt="" className="h-5 w-5" />
                {TEAMS[key]} <span className="text-gray-500 text-xs">({key})</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PlayerStatBlock({ title, d }) {
  return (
    <div className="bg-white border border-gray-200 p-3">
      <h3 className="font-semibold mb-2">{title}</h3>
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-gray-500">Series</dt><dd>{d.seriesWon}-{d.seriesLost}</dd>
        <dt className="text-gray-500">Games</dt><dd>{d.gamesWon}-{d.gamesLost}</dd>
        <dt className="text-gray-500">Points scored</dt><dd>{fmt1(d.pointsScored)}</dd>
        <dt className="text-gray-500">Points allowed</dt><dd>{fmt1(d.pointsAllowed)}</dd>
        <dt className="text-gray-500">+/-</dt><dd>{d.plusMinus > 0 ? `+${fmt1(d.plusMinus)}` : fmt1(d.plusMinus)}</dd>
        <dt className="text-gray-500">PPG</dt><dd>{fmt1(d.ppg)}</dd>
        <dt className="text-gray-500">PA/G</dt><dd>{fmt1(d.papg)}</dd>
        <dt className="text-gray-500">Pts/Series</dt><dd>{fmt1(d.pps)}</dd>
        <dt className="text-gray-500">Game win%</dt><dd>{Math.round(d.gameWinPct * 100)}%</dd>
        <dt className="text-gray-500">Series win%</dt><dd>{Math.round(d.seriesWinPct * 100)}%</dd>
        <dt className="text-gray-500">Blowouts</dt><dd>{d.blowouts}</dd>
        <dt className="text-gray-500">Longest win streak</dt><dd>{d.longestWinStreak}</dd>
      </dl>
    </div>
  );
}

function PartnerBlock({ title, player, pb }) {
  return (
    <div className="bg-white border border-gray-200 p-3">
      <h3 className="font-semibold mb-2">{title}</h3>
      <table className="w-full text-sm">
        <thead className="text-left text-gray-500">
          <tr>
            <th className="py-1">Partner</th>
            <th className="py-1">Games</th>
            <th className="py-1">Win%</th>
          </tr>
        </thead>
        <tbody>
          {pb.entries.map((e) => (
            <tr key={e.duoKey} className="border-t border-gray-200">
              <td className="py-1">
                <Link to={`/players/${e.partner}`} className="hover:underline">{e.partner}</Link>{' '}
                <span className="text-gray-500 text-xs">({TEAMS[e.duoKey]})</span>
              </td>
              <td className="py-1">{e.gamesWon}-{e.gamesLost}</td>
              <td className="py-1">{e.gamesPlayed ? `${Math.round(e.winPct * 100)}%` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-2">
        Best: {pb.best ? `${pb.best.partner} (${Math.round(pb.best.winPct * 100)}%)` : '-'} ·{' '}
        Worst: {pb.worst ? `${pb.worst.partner} (${Math.round(pb.worst.winPct * 100)}%)` : '-'}
      </p>
    </div>
  );
}
