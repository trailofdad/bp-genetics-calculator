import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import {
  DashboardIcon,
  DnaIcon,
  ArrowsLeftRightIcon,
  CodeForkIcon,
  CircleQuestionIcon,
  SunIcon,
  MoonIcon,
  BarsIcon,
  XmarkIcon,
  FaSnakeIcon,
} from './icons/index'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', Icon: DashboardIcon },
  { to: '/animals', label: 'Animals', Icon: FaSnakeIcon },
  { to: '/calculator', label: 'Calculator', Icon: DnaIcon },
  { to: '/pairings', label: 'Pairings', Icon: ArrowsLeftRightIcon },
  { to: '/projects', label: 'Projects', Icon: CodeForkIcon },
  { to: '/help', label: 'Help', Icon: CircleQuestionIcon },
]

export function Layout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Top header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 xl:max-w-7xl 2xl:max-w-screen-2xl 2xl:px-6">
          {/* Logo */}
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <DnaIcon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none tracking-tight text-foreground">
                Ball Python
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Genetics Calculator
              </p>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {theme === 'dark' ? (
                <SunIcon className="h-4 w-4" />
              ) : (
                <MoonIcon className="h-4 w-4" />
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Open navigation menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
            >
              <BarsIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile nav overlay ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute right-0 top-0 flex h-full w-72 flex-col border-l border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">Navigation</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <XmarkIcon className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3">
              {NAV_LINKS.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* ── Page content ───────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 xl:max-w-7xl xl:py-8 2xl:max-w-screen-2xl 2xl:px-6 2xl:py-10">
        {children}
      </main>
    </div>
  )
}

