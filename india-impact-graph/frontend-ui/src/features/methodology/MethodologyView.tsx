import React, { useState } from 'react';
import { MethodologyTab } from './types';
import {
  APPROACH_STAGES,
  DATA_SOURCES_REGISTRY,
  ANALYTICAL_MODELS,
  IMPACT_FLOW_STAGES,
} from './methodologyData';
import { MethodologyHeader } from './MethodologyHeader';
import { OurApproachWorkflow } from './OurApproachWorkflow';
import { DataSourcesRegistry } from './DataSourcesRegistry';
import { ModelsTechniquesCard } from './ModelsTechniquesCard';
import { ImpactFlowVisualizer } from './ImpactFlowVisualizer';
import { MethodologyInAction } from './MethodologyInAction';
import { ModelAccuracyValidation } from './ModelAccuracyValidation';
import { ImpactCalculationFormulas } from './ImpactCalculationFormulas';
import { MethodologyLimitations } from './MethodologyLimitations';
import styles from './MethodologyView.module.css';

interface MethodologyViewProps {
  onNavigateSection?: (sectionId: string) => void;
}

export const MethodologyView: React.FC<MethodologyViewProps> = ({ onNavigateSection }) => {
  const [activeTab, setActiveTab] = useState<MethodologyTab>('how_it_works');

  const handleTabChange = (tab: MethodologyTab) => {
    setActiveTab(tab);

    const sectionMap: Record<MethodologyTab, string> = {
      how_it_works: 'methodology-our-approach',
      data_sources: 'methodology-data-sources',
      models_forecasting: 'methodology-models-techniques',
      impact_calculation: 'methodology-impact-calculation',
      validation_accuracy: 'methodology-validation-accuracy',
      limitations: 'methodology-limitations',
    };

    const targetElementId = sectionMap[tab];
    if (targetElementId) {
      const element = document.getElementById(targetElementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className={styles.viewContainer} data-testid="methodology-view">
      {/* 1. Header with Title, Report Download & 6 Tabs */}
      <MethodologyHeader activeTab={activeTab} onTabChange={handleTabChange} />

      {/* 2. Our Approach — Six-Stage Workflow */}
      <div id="methodology-our-approach" className={styles.sectionGap}>
        <OurApproachWorkflow
          stages={APPROACH_STAGES}
          onNavigateToSection={onNavigateSection}
        />
      </div>

      {/* 3. Three-Column Row: Data Sources | Models & Techniques | Impact Flow */}
      <div className={styles.threeColumnRow}>
        <div id="methodology-data-sources">
          <DataSourcesRegistry sources={DATA_SOURCES_REGISTRY} />
        </div>
        <div id="methodology-models-techniques">
          <ModelsTechniquesCard models={ANALYTICAL_MODELS} />
        </div>
        <div id="methodology-impact-flow">
          <ImpactFlowVisualizer stages={IMPACT_FLOW_STAGES} />
        </div>
      </div>

      {/* 4. Two-Column Row: Methodology in Action (Example) | Model Accuracy & Validation */}
      <div className={styles.twoColumnRow}>
        <MethodologyInAction onNavigateSection={onNavigateSection} />
        <ModelAccuracyValidation />
      </div>

      {/* 5. Mathematical Calculation Formulas & Worked Numerical Logic */}
      <div className={styles.sectionGap}>
        <ImpactCalculationFormulas />
      </div>

      {/* 6. System Limitations & Analytical Assumptions */}
      <div className={styles.sectionGap}>
        <MethodologyLimitations />
      </div>
    </div>
  );
};
