/**
 * @file Evaluation legend component for training interface
 * @module components/training/EvaluationLegend
 *
 * @description
 * Collapsible legend component that explains the symbols and colors used
 * in chess position evaluations. Focuses on tablebase symbols and their
 * meanings to help users understand move quality indicators.
 *
 * @remarks
 * Key features:
 * - Expandable/collapsible design to save screen space
 * - Tablebase symbol explanations with German descriptions
 * - Clean grid layout for easy scanning
 * - Theme-aware styling with CSS custom properties
 * - Responsive design for mobile and desktop
 *
 * The component serves as educational support, helping users understand
 * the evaluation symbols used throughout the training interface.
 */

import React, { useState } from 'react';
import { TABLEBASE_LEGEND } from '../../utils/chess/evaluation';

/**
 * Props for the EvaluationLegend component
 *
 * @interface EvaluationLegendProps
 *
 * @property {string} [className] - Additional CSS classes to apply
 */
interface EvaluationLegendProps {
  className?: string;
}

/**
 * Evaluation legend component
 *
 * @component
 * @description
 * Displays an expandable legend explaining the evaluation symbols used
 * in the chess training interface. Provides context for tablebase symbols
 * and their meanings to improve user understanding.
 *
 * @remarks
 * Component behavior:
 * - Starts collapsed to conserve screen space
 * - Expands on click to show detailed legend
 * - Uses emoji icons for visual appeal and clarity
 * - Organizes symbols in a clean grid layout
 * - Includes explanatory text about symbol priority
 *
 * The legend focuses on tablebase evaluations as the application uses
 * a tablebase-only architecture for move analysis.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <EvaluationLegend />
 *
 * // With custom styling
 * <EvaluationLegend className="mt-4 border rounded" />
 *
 * // In sidebar or panel
 * <div className="sidebar">
 *   <EvaluationLegend className="mb-4" />
 *   <OtherComponents />
 * </div>
 * ```
 *
 * @param {EvaluationLegendProps} props - Component configuration
 * @returns {JSX.Element} Collapsible legend component
 */
export const EvaluationLegend: React.FC<EvaluationLegendProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`${className}`}>
      {/* Compact toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 text-xs rounded hover:bg-opacity-80 transition-colors"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
        }}
      >
        <span className="flex items-center gap-1">📖 Legende</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>

      {/* Expandable legend content */}
      {isExpanded && (
        <div
          className="mt-2 p-3 rounded text-xs space-y-3"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-color)',
          }}
        >
          {/* Tablebase Legend */}
          <div>
            <h4 className="font-medium mb-2 text-green-400">🎯 Tablebase (Exakte Ergebnisse)</h4>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(TABLEBASE_LEGEND).map(([symbol, description]) => (
                <div key={symbol} className="flex items-center gap-2">
                  <span className="w-6 text-center">{symbol}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engine Legend */}
          {/* Engine section removed - tablebase-only architecture */}

          {/* Priority note */}
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
              💡 Tablebase-Symbole haben Vorrang, wenn verfügbar
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
