import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { Layout } from './components/Layout'

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const AnimalsPage = lazy(() =>
  import('./pages/AnimalsPage').then((m) => ({ default: m.AnimalsPage }))
)
const PairingsPage = lazy(() =>
  import('./pages/PairingsPage').then((m) => ({ default: m.PairingsPage }))
)
const CalculatorPage = lazy(() =>
  import('./pages/CalculatorPage').then((m) => ({ default: m.CalculatorPage }))
)
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
)
const HelpPage = lazy(() =>
  import('./pages/HelpPage').then((m) => ({ default: m.HelpPage }))
)

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AppProvider>
          <Layout>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/animals" element={<AnimalsPage />} />
                <Route path="/pairings" element={<PairingsPage />} />
                <Route path="/calculator" element={<CalculatorPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/help" element={<HelpPage />} />
              </Routes>
            </Suspense>
          </Layout>
        </AppProvider>
      </ThemeProvider>
    </HashRouter>
  )
}
