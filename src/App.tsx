import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { AnimalsPage } from './pages/AnimalsPage';
import { PairingsPage } from './pages/PairingsPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { PlaygroundPage } from './pages/PlaygroundPage';

export default function App() {
  return (
    <HashRouter>
      <AppProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/animals" element={<AnimalsPage />} />
            <Route path="/pairings" element={<PairingsPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
          </Routes>
        </Layout>
      </AppProvider>
    </HashRouter>
  );
}

