import React from "react";
import { getClauseColor } from "@/utils/clauseStyles";

const FilterTabs = React.memo(function FilterTabs({
  types,
  activeTypes,
  toggleType,
  counts,
}) {
  if (!types?.length) return null;

  return (
    <nav className="flex flex-wrap gap-2 mb-4" role="tablist">
      {types.map((tab) => {
        const colors = getClauseColor(tab);
        return (
          <button
            key={tab}
            onClick={() => toggleType(tab)}
            className={`px-3 py-1 text-sm rounded-md border transition-colors duration-150
            border-slate-300 dark:border-slate-600
            hover:bg-primary-50 dark:hover:bg-slate-700
            focus:bg-primary-100 dark:focus:bg-slate-700
            focus-visible:ring-2 focus-visible:ring-primary-500
            ${
              activeTypes.has(tab)
                ? "bg-primary-100 dark:bg-slate-700 font-semibold text-primary-700 dark:text-primary-300"
                : "opacity-70"
            }`}
            role="tab"
            aria-pressed={activeTypes.has(tab)}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm mr-2 align-middle"
              style={{ backgroundColor: colors.bg }}
              aria-hidden="true"
            />
            {tab}
            {typeof counts?.[tab] === "number" && (
              <span className="ml-2 text-xs text-slate-500">{counts[tab]}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
});
export default FilterTabs;
