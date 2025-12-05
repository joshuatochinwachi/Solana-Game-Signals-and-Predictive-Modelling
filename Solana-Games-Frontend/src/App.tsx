import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { MLPage } from './pages/MLPage';

import { LandingPage } from './pages/LandingPage';

import { WalletContextProvider } from './components/providers/WalletContextProvider';

function App() {
  return (
    <WalletContextProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/analytics" element={<DashboardPage />} />
                <Route path="/predictions" element={<MLPage />} />
                <Route path="*" element={<Navigate to="/analytics" replace />} />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Router>
    </WalletContextProvider>
  );
}

export default App;
