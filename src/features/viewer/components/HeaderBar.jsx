import { memo } from "react";
import { exportPDF } from "@/utils/exportPDF";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const HeaderBar = memo(function HeaderBar({
  fileName,
  resetAnalysis,
  navigate,
  clauses,
  summary,
  parsedText,
  setToast,
}) {
  return (
    <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4">
      <div className="flex items-center gap-3">
        <h1
          className="font-semibold text-sm sm:text-lg max-w-[150px] sm:max-w-[300px] truncate"
          title={fileName || "Untitled Document"}
        >
          {fileName || "Untitled Document"}
        </h1>
        <button
          onClick={() => {
            resetAnalysis();
            navigate("/analyze");
          }}
          className="text-primary-600 hover:underline text-sm"
        >
          Re-upload
        </button>
        <button
          onClick={resetAnalysis}
          className="text-red-600 hover:underline text-sm ml-3"
        >
          Clear All Data
        </button>
        <button
          onClick={() =>
            exportPDF({ fileName, clauses, summary, parsedText, setToast })
          }
          className="text-green-600 hover:underline text-sm ml-3"
        >
          Export PDF
        </button>
      </div>

      <ThemeToggle />
    </header>
  );
});
export { HeaderBar };
