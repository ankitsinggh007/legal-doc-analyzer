import React from "react";

const FilterTabs = React.memo(function FilterTabs({ activeTypes, toggleType }) {
  const tabs = ["Termination", "Penalty", "Confidentiality"];

  return (
    <nav className="flex flex-wrap gap-2 mb-4" role="tablist">
      {tabs.map((tab) => (
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
          {tab}
        </button>
      ))}
    </nav>
  );
});
export default FilterTabs;
