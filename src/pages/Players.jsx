import { Link } from 'react-router-dom';
import { PLAYERS } from '../lib/constants.js';
import { playerPortrait } from '../lib/data.js';

export default function Players() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Players</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PLAYERS.map((name) => (
          <Link
            key={name}
            to={`/players/${name}`}
            className="bg-white border border-gray-200 p-3 flex flex-col items-center gap-2 hover:bg-gray-100"
          >
            <img src={playerPortrait(name)} alt="" className="h-20 w-20 rounded-full bg-gray-200" />
            <div className="font-semibold">{name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
