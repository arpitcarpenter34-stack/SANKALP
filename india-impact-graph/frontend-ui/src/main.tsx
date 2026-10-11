import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { App } from './app/App';
import { ImpactGraph } from './features/graph/ImpactGraph';
import { EvidenceDrawer } from './features/evidence/EvidenceDrawer';
import { HouseholdImpactPanel } from './features/impact/HouseholdImpactPanel';
import './styles/global.css';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const RootApp: React.FC = () => {
  const appElement = (
    <App
      customGraphCanvas={ImpactGraph}
      customEvidencePanel={EvidenceDrawer}
      customHouseholdImpact={HouseholdImpactPanel}
    />
  );

  if (clerkPublishableKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey}>
        {appElement}
      </ClerkProvider>
    );
  }

  return appElement;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);