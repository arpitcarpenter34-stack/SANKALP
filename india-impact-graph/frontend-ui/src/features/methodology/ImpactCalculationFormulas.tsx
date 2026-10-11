import React, { useState } from 'react';
import { CALCULATION_FORMULAS } from './methodologyData';
import styles from './ImpactCalculationFormulas.module.css';

interface ImpactCalculationFormulasProps {
  onFormulaSelect?: (stageId: string) => void;
}

export const ImpactCalculationFormulas: React.FC<ImpactCalculationFormulasProps> = ({
  onFormulaSelect,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<string>(CALCULATION_FORMULAS[0].id);

  const activeFormula =
    CALCULATION_FORMULAS.find((f) => f.id === selectedStageId) || CALCULATION_FORMULAS[0];

  const handleStageChange = (id: string) => {
    setSelectedStageId(id);
    onFormulaSelect?.(id);
  };

  return (
    <div className={styles.container} id="methodology-impact-calculation">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.iconBadge}>∑</div>
          <div>
            <h2 className={styles.title}>Impact Calculation — Implemented Formulas</h2>
            <p className={styles.subtitle}>
              Mathematical definitions, variable registries, and worked numerical examples.
            </p>
          </div>
        </div>

        <div className={styles.stageSelector} role="tablist" aria-label="Calculation Stages">
          {CALCULATION_FORMULAS.map((stage) => {
            const isActive = stage.id === selectedStageId;
            return (
              <button
                key={stage.id}
                role="tab"
                aria-selected={isActive}
                className={`${styles.stageButton} ${isActive ? styles.stageButtonActive : ''}`}
                onClick={() => handleStageChange(stage.id)}
              >
                {stage.stageName.split(':')[0]}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.formulaCard}>
        <div className={styles.stageMeta}>
          <h3 className={styles.stageHeading}>{activeFormula.stageName}</h3>
          <span className={styles.stageBadge}>Empirical Specification</span>
        </div>

        <div className={styles.formulaDisplay}>
          <div className={styles.formulaCode}>{activeFormula.formulaTex}</div>
          <div className={styles.formulaPlain}>
            <strong>Plain Formula:</strong> {activeFormula.formulaPlain}
          </div>
        </div>

        <p className={styles.stageDesc}>{activeFormula.description}</p>

        <div className={styles.splitSection}>
          <div className={styles.variablesBox}>
            <div className={styles.boxTitle}>
              <span>📋</span> Variable Registry
            </div>
            <table className={styles.variableTable}>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Variable Name</th>
                  <th>Unit</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {activeFormula.variables.map((v) => (
                  <tr key={v.symbol}>
                    <td className={styles.symbolCell}>{v.symbol}</td>
                    <td>{v.name}</td>
                    <td className={styles.unitCell}>{v.unit}</td>
                    <td>{v.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.workedExampleBox}>
            <div className={`${styles.boxTitle} ${styles.exampleTitle}`}>
              <span>🧮</span> Worked Numerical Example
            </div>

            <div className={styles.inputValuesGrid}>
              {Object.entries(activeFormula.workedExample.inputValues).map(([key, val]) => (
                <span key={key} className={styles.inputTag}>
                  {key} = {val}
                </span>
              ))}
            </div>

            <ol className={styles.stepList}>
              {activeFormula.workedExample.calculationSteps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>

            <div className={styles.resultBadge}>
              <span>Calculated Output:</span>
              <span>{activeFormula.workedExample.finalResult}</span>
            </div>
          </div>
        </div>

        <div className={styles.assumptionsBox}>
          <span>💡</span>
          <span>
            <strong>Model Assumptions:</strong> {activeFormula.assumptions.join(' ')}
          </span>
        </div>
      </div>
    </div>
  );
};
