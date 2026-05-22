import React, { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import RiskPage from './pages/RiskPage';
import CreditsPage from './pages/CreditsPage';
import PredictionsPage from './pages/PredictionsPage';
import CuotasRiesgoPage from './pages/CuotasRiesgoPage';
import ConcentracionPage from './pages/ConcentracionPage';
import RetencionPage from './pages/RetencionPage';
import RecuperabilidadPage from './pages/RecuperabilidadPage';

function App() {
  const [activeTab, setActiveTab] = useState('risk');

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        {activeTab === 'risk'          && <RiskPage />}
        {activeTab === 'credits'       && <CreditsPage />}
        {activeTab === 'predictions'   && <PredictionsPage />}
        {activeTab === 'cuotas'          && <CuotasRiesgoPage />}
        {activeTab === 'concentracion'   && <ConcentracionPage />}
        {activeTab === 'retencion'       && <RetencionPage />}
        {activeTab === 'recuperabilidad' && <RecuperabilidadPage />}
      </main>
    </div>
  );
}

export default App;
