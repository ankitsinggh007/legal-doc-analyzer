import { memo, useState } from "react";
import PropTypes from "prop-types";

export const RiskSummaryPanel = memo(function RiskSummaryPanel({ summary }) {
  const [expanded, setExpanded] = useState(false);

  const hasSummary = Boolean(summary);

  return (
    <div
      className={`mt-4 p-3 rounded-md bg-slate-100 dark:bg-slate-700 text-sm transition-all duration-200 ${
        hasSummary ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={() => hasSummary && setExpanded(!expanded)}
      role="region"
      aria-expanded={expanded}
      aria-labelledby="risk-summary-heading"
      tabIndex={0}
      onKeyDown={(e) =>
        hasSummary && e.key === "Enter" && setExpanded(!expanded)
      }
    >
      <p
        id="risk-summary-heading"
        className="font-semibold mb-1 text-primary-600"
      >
        Risk Summary
      </p>
      <div
        className={`transition-all duration-300 ease-in-out ${
          expanded && hasSummary
            ? "max-h-[250px] overflow-y-auto pr-1"
            : "line-clamp-3"
        }`}
      >
        {hasSummary ? summary : "No summary available."}
      </div>
      {!expanded && hasSummary && (
        <p className="text-xs text-slate-500 mt-1 italic">(Click to expand)</p>
      )}
    </div>
  );
});

RiskSummaryPanel.propTypes = {
  summary: PropTypes.string,
};
