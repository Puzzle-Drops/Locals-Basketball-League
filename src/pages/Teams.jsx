import { Link } from 'react-router-dom';
import { DUO_KEYS } from '../lib/constants.js';
import { TEAMS, teamLogo } from '../lib/data.js';

export default function Teams() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Teams</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DUO_KEYS.map((key) => (
          <Link
            key={key}
            to={`/teams/${key}`}
            className="bg-white border border-gray-200 p-3 flex items-center gap-3 hover:bg-gray-100"
          >
            <img src={teamLogo(key)} alt="" className="h-12 w-12" />
            <div>
              <div className="font-semibold">{TEAMS[key]}</div>
              <div className="text-sm text-gray-600">{key}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
