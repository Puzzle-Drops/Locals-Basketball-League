import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { leagueLogo, CURRENT_SEASON } from '../lib/data.js';
import { playersFor } from '../lib/constants.js';

const ROSTER = playersFor(CURRENT_SEASON).join(' · ');

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
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu on route change.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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
              Season {CURRENT_SEASON.season}
            </span>
            <button
              type="button"
              className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5 transition"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)]">
            <div className="max-w-6xl mx-auto px-5 py-2 flex flex-col">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    `py-3 text-sm font-semibold border-b border-[var(--border)] last:border-b-0 transition ${
                      isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
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
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-dim)]">Est. 2026 · Season {CURRENT_SEASON.season}</div>
            </div>
          </div>
          <div className="text-[11px] text-[var(--text-dim)] uppercase tracking-wider font-semibold">
            {ROSTER}
          </div>
        </div>
      </footer>
    </div>
  );
}
