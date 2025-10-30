import { useState, useEffect, useMemo, useCallback } from "react";
import { useAnalyze } from "@/context/AnalyzeContext";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { highlightClauses } from "@/utils/highlightClauses";
import { RiskSummaryPanel } from "./components/RiskSummaryPanel";
import { lazy, Suspense } from "react";
const ColorLegend = lazy(() => import("./components/ColorLegend"));
const FilterTabs = lazy(() => import("./components/FilterTabs"));
import { HeaderBar } from "./components/HeaderBar";
export default function ViewerPage() {
  const {
    uploadedFile,
    parsedText,
    clauses,
    resetAnalysis,
    isHydrated,
    summary,
  } = useAnalyze();
  const [selectedClause, setSelectedClause] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTypes, setActiveTypes] = useState(
    new Set(["Termination", "Penalty", "Confidentiality"])
  );
  const navigate = useNavigate();

  // 🧭 Toast timeout
  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  // 🧭 Navigation guard
  useEffect(() => {
    // 🚫 Don't run until hydration is complete
    if (isHydrated && !parsedText) navigate("/analyze");
  }, [isHydrated, parsedText, navigate]);
  // Reset selection on re-upload
  useEffect(() => setSelectedClause(null), [parsedText]);

  // ✨ Highlight + scroll management
  useEffect(() => {
    document
      .querySelectorAll(".highlight-active")
      .forEach((el) => el.classList.remove("highlight-active"));
    if (selectedClause) {
      const idx = clauses.indexOf(selectedClause);
      const el = document.querySelector(`[data-index="${idx}"]`);
      if (el) {
        console.log("i am selected", el);
        el.classList.add("highlight-active");
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        window.scrollBy(0, -100); // keeps it below top bar
      }
    }
  }, [selectedClause, clauses]);

  //useMemo for highlightClauses call — avoids full re-render string rebuild on each toggle.
  const highlightedHTML = useMemo(
    () => highlightClauses(parsedText, clauses, activeTypes),
    [parsedText, clauses, activeTypes]
  );
  const toggleType = useCallback((type) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }, []);

  if (!parsedText) return null;

  return (
    <main
      className="min-h-screen bg-white border-blue-500  dark:bg-slate-900 text-slate-800 dark:text-slate-100"
      aria-label="Document Viewer Page"
    >
      {!isHydrated ? (
        <div className="flex items-center justify-center h-screen text-slate-500 dark:text-slate-400">
          <p className="animate-pulse">Restoring session…</p>
        </div>
      ) : !parsedText ? null : (
        <Container className="max-w-[90%] lg:max-w-[85%] xl:max-w-[80%] py-6 space-y-6">
          {/* 🔹 Top Bar */}

          <HeaderBar
            fileName={uploadedFile?.name}
            resetAnalysis={resetAnalysis}
            navigate={navigate}
            clauses={clauses}
            summary={summary}
            parsedText={parsedText}
            setToast={setToast}
          />

          {/* 🔹 Dual Panel Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Contract Viewer */}
            <section
              className="lg:col-span-2 p-4 rounded-md dark:border-slate-700 border border-slate-200
             dark:bg-slate-800 overflow-y-auto max-h-[85vh]"
              aria-label="Contract Text Viewer"
              onClick={(e) => {
                const el = e.target.closest("[data-index]");
                if (!el) return;
                const idx = Number(el.dataset.index);
                setSelectedClause(clauses[idx]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  const el = e.target.closest("[data-index]");
                  if (el) setSelectedClause(clauses[Number(el.dataset.index)]);
                }
              }}
            >
              <div
                className="whitespace-pre-wrap text-left leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightedHTML }}
              />
            </section>

            {/* Right Panel: Insights Sidebar */}
            <aside
              className="p-4 rounded-md border border-slate-200 dark:border-slate-700
             bg-slate-50 dark:bg-slate-800 sticky top-4 h-fit"
              aria-label="Insights Sidebar"
            >
              <h2 className="font-semibold text-lg mb-3">Insights</h2>

              <Suspense fallback={null}>
                <ColorLegend />
                <FilterTabs activeTypes={activeTypes} toggleType={toggleType} />
              </Suspense>

              {selectedClause ? (
                <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-700 mt-3 text-sm">
                  <p className="font-semibold mb-1 text-primary-600">
                    {selectedClause.type} Clause
                  </p>
                  <p>{selectedClause.explanation}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Click a clause in the document to view details here.
                </p>
              )}
              <RiskSummaryPanel summary={summary} />
            </aside>
          </div>
        </Container>
      )}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {toast && <span>{toast.msg}</span>}
      </div>
      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 right-6 px-4 z-[9999] py-2 rounded-md shadow-lg text-sm font-medium transition-all duration-300
      ${
        toast.type === "success"
          ? "bg-green-100 text-green-800 border border-green-300"
          : "bg-red-100 text-red-800 border border-red-300"
      }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}
