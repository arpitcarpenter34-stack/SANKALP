import React from 'react';
import { EventScenario } from '../../types';
import { Badge } from '../../components/ui/Badge';
import styles from './ScenarioSelector.module.css';

export interface ScenarioSelectorProps {
  scenarios: EventScenario[];
  selectedId: string;
  onSelect: (scenarioId: string) => void;
  disabled?: boolean;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  scenarios,
  selectedId,
  onSelect,
  disabled = false,
}) => {
  return (
    <div className={styles.container}>
      <label htmlFor="scenario-select" className={styles.label}>
        Select Benchmark Scenario
      </label>

      <div className={styles.selectWrapper}>
        <select
          id="scenario-select"
          className={styles.select}
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
          <option value="custom">-- Custom Financial News Dispatch (Paste Text) --</option>
        </select>
      </div>

      <div className={styles.activeScenarioMeta}>
        {selectedId !== 'custom' ? (
          <>
            <Badge variant="cyan" size="sm">
              Magnitude: {scenarios.find((s) => s.id === selectedId)?.magnitude || 'N/A'}
            </Badge>
            <Badge variant="inferred" size="sm">
              [HYPOTHETICAL DEMO SCENARIO]
            </Badge>
          </>
        ) : (
          <Badge variant="neutral" size="sm">
            [CUSTOM USER INPUT MODE]
          </Badge>
        )}
      </div>
    </div>
  );
};
