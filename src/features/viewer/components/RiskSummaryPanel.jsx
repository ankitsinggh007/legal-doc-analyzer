import { memo, useState } from "react";
import PropTypes from "prop-types";

export const RiskSummaryPanel = memo(function RiskSummaryPanel({ summary }) {
  const [expanded, setExpanded] = useState(false);

  if (!summary) return null;

  return (
    <div
      className="mt-4 p-3 rounded-md bg-slate-100 dark:bg-slate-700 text-sm cursor-pointer transition-all duration-200"
      onClick={() => setExpanded(!expanded)}
      role="region"
      aria-expanded={expanded}
      aria-labelledby="risk-summary-heading"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
    >
      <p
        id="risk-summary-heading"
        className="font-semibold mb-1 text-primary-600"
      >
        Risk Summary
      </p>
      <div
        className={`transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[250px] overflow-y-auto pr-1" : "line-clamp-3"
        }`}
      >
        {summary}
      </div>
      {!expanded && (
        <p className="text-xs text-slate-500 mt-1 italic">(Click to expand)</p>
      )}
    </div>
  );
});

RiskSummaryPanel.propTypes = {
  summary: PropTypes.string,
};
