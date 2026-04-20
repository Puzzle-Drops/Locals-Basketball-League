import { NavLink, Outlet, Link } from 'react-router-dom';
import { leagueLogo } from '../lib/data.js';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/standings', label: 'Standings' },
  { to: '/teams', label: 'Teams' },
  { to: '/players', label: 'Players' },
  { to: '/schedule', label: 'Schedule' },
  { to: '/playoffs', label: 'Playoffs' },
  { to: '/rules', label: 'Rules' },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={leagueLogo()} alt="LBL" className="h-8 w-8" />
            <span className="font-semibold">Locals Basketball League</span>
          </Link>
          <nav className="ml-auto flex flex-wrap gap-3 text-sm">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  isActive
                    ? 'font-semibold text-gray-900 underline underline-offset-4'
                    : 'text-gray-600 hover:text-gray-900'
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="mx-auto max-w-5xl px-4 py-6 text-xs text-gray-500">
        Phase 1 scaffold - styling pass comes later.
      </footer>
    </div>
  );
}
