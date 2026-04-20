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
    <div className="min-h-screen">
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-[var(--bg)]/85 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={leagueLogo()} alt="LBL" className="h-9 w-9 rounded-lg object-contain" />
            <div className="flex flex-col leading-none">
              <span className="display font-black text-[15px] tracking-wider">LBL</span>
              <span className="text-[9.5px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Locals Basketball League
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm font-semibold">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {n.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex pill accent items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              Season 1
            </span>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-[var(--border)] mt-12">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={leagueLogo()} alt="LBL" className="h-8 w-8 rounded-lg object-contain" />
            <div className="leading-tight">
              <div className="display font-black text-sm tracking-wider">LOCALS BASKETBALL LEAGUE</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-dim)]">Est. 2026 · Season 1</div>
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-dim)] uppercase tracking-wider font-semibold">
            Jacob · Daniel · Joseph · Nathan
          </div>
        </div>
      </footer>
    </div>
  );
}
