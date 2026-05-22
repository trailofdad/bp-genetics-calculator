import { type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', emoji: '🏠' },
  { to: '/animals', label: 'Animals', emoji: '🐍' },
  { to: '/calculator', label: 'Calculator', emoji: '🧬' },
  { to: '/pairings', label: 'Pairings', emoji: '⇄' },
  { to: '/help', label: 'Help', emoji: '?' },
]

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const isPlayground = location.pathname.startsWith('/playground')

  if (isPlayground) return <>{children}</>

  return (
    <div className="flex min-h-screen flex-col bg-[#0d1117] text-slate-200">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0d1117]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="text-xl">🐍</span>
            <div>
              <p className="text-sm leading-none font-semibold tracking-tight text-white">
                Ball Python
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Genetics Calculator
              </p>
            </div>
          </NavLink>

          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, emoji }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border border-indigo-500/25 bg-indigo-500/15 text-indigo-300'
                      : 'border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  )
}
