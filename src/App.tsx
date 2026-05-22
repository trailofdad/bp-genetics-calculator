import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';

const DashboardPage  = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AnimalsPage    = lazy(() => import('./pages/AnimalsPage').then(m => ({ default: m.AnimalsPage })));
const PairingsPage   = lazy(() => import('./pages/PairingsPage').then(m => ({ default: m.PairingsPage })));
const CalculatorPage = lazy(() => import('./pages/CalculatorPage').then(m => ({ default: m.CalculatorPage })));
const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage').then(m => ({ default: m.PlaygroundPage })));
const HelpPage       = lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Layout>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/animals" element={<AnimalsPage />} />
              <Route path="/pairings" element={<PairingsPage />} />
              <Route path="/calculator" element={<CalculatorPage />} />
              <Route path="/playground" element={<PlaygroundPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </AppProvider>
    </HashRouter>
  );
}

