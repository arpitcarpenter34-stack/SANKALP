import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { ImpactGraph } from './features/graph/ImpactGraph';
import { EvidenceDrawer } from './features/evidence/EvidenceDrawer';
import { HouseholdImpactPanel } from './features/impact/HouseholdImpactPanel';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App
      customGraphCanvas={ImpactGraph}
      customEvidencePanel={EvidenceDrawer}
      customHouseholdImpact={HouseholdImpactPanel}
    />
  </React.StrictMode>
);
