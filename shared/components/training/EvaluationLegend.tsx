import React, { useState } from "react";
import { TABLEBASE_LEGEND } from "../../utils/chess/evaluationHelpers";

/**
 *
 */
interface EvaluationLegendProps {
  className?: string;
}

/**
 *
 * @param root0
 * @param root0.className
 */
export /**
 *
 */
const EvaluationLegend: React.FC<EvaluationLegendProps> = ({
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`${className}`}>
      {/* Compact toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 text-xs rounded hover:bg-opacity-80 transition-colors"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          color: "var(--text-secondary)",
        }}
      >
        <span className="flex items-center gap-1">📖 Legende</span>
        <span>{isExpanded ? "▼" : "▶"}</span>
      </button>

      {/* Expandable legend content */}
      {isExpanded && (
        <div
          className="mt-2 p-3 rounded text-xs space-y-3"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border-color)",
          }}
        >
          {/* Tablebase Legend */}
          <div>
            <h4 className="font-medium mb-2 text-green-400">
              🎯 Tablebase (Exakte Ergebnisse)
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(TABLEBASE_LEGEND).map(([symbol, description]) => (
                <div key={symbol} className="flex items-center gap-2">
                  <span className="w-6 text-center">{symbol}</span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Engine Legend */}
          {/* Engine section removed - tablebase-only architecture */}

          {/* Priority note */}
          <div
            className="pt-2 border-t"
            style={{ borderColor: "var(--border-color)" }}
          >
            <p
              className="text-xs italic"
              style={{ color: "var(--text-muted)" }}
            >
              💡 Tablebase-Symbole haben Vorrang, wenn verfügbar
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
