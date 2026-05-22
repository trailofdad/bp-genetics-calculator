import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', emoji: '🏠' },
  { to: '/animals', label: 'Animals', emoji: '🐍' },
  { to: '/calculator', label: 'Calculator', emoji: '🧬' },
  { to: '/pairings', label: 'Pairings', emoji: '⇄' },
  { to: '/help', label: 'Help', emoji: '?' },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isPlayground = location.pathname.startsWith('/playground');

  if (isPlayground) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200 flex flex-col">
      <header className="border-b border-white/5 px-4 py-3 sticky top-0 z-20 bg-[#0d1117]/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <span className="text-xl">🐍</span>
            <div>
              <p className="text-sm font-semibold text-white tracking-tight leading-none">Ball Python</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Genetics Calculator</p>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, emoji }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
                  }`
                }
              >
                <span>{emoji}</span>
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  );
}
