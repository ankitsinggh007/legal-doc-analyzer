import { useState, useEffect, useMemo, useCallback } from "react";
import { useAnalyze } from "@/context/AnalyzeContext";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { RiskSummaryPanel } from "./components/RiskSummaryPanel";
import { lazy, Suspense } from "react";
import { HeaderBar } from "./components/HeaderBar";
import { segmentText } from "@/utils/segmentText";
import {
  DEFAULT_CLAUSE_TYPES,
  getClauseColor,
  getRiskStyle,
} from "@/utils/clauseStyles";
import Disclaimer from "@/components/Disclaimer";

const ColorLegend = lazy(() => import("./components/ColorLegend"));
const FilterTabs = lazy(() => import("./components/FilterTabs"));

export default function ViewerPage() {
  const {
    uploadedFile,
    parsedText,
    segments,
    clauses,
    resetAnalysis,
    isHydrated,
    summary,
    warning,
  } = useAnalyze();
  const [selectedClauseIndex, setSelectedClauseIndex] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTypes, setActiveTypes] = useState(new Set());
  const navigate = useNavigate();

  const normalizedSegments = useMemo(() => {
    if (segments?.length) return segments;
    return segmentText(parsedText || "");
  }, [segments, parsedText]);

  const clauseTypes = useMemo(() => {
    const unique = Array.from(
      new Set((clauses || []).map((clause) => clause.type).filter(Boolean))
    );
    return unique.length ? unique : DEFAULT_CLAUSE_TYPES;
  }, [clauses]);

  const clauseCounts = useMemo(() => {
    const counts = {};
    (clauses || []).forEach((clause) => {
      counts[clause.type] = (counts[clause.type] || 0) + 1;
    });
    return counts;
  }, [clauses]);

  const citationsMap = useMemo(() => {
    const map = new Map();
    (clauses || []).forEach((clause, index) => {
      const ids = Array.isArray(clause?.citations) ? clause.citations : [];
      ids.forEach((id) => {
        if (!map.has(id)) map.set(id, []);
        map.get(id).push(index);
      });
    });
    return map;
  }, [clauses]);

  const visibleClauses = useMemo(() => {
    return (clauses || [])
      .map((clause, idx) => ({ clause, idx }))
      .filter(({ clause }) => activeTypes.has(clause.type));
  }, [clauses, activeTypes]);

  const selectedClause =
    selectedClauseIndex !== null ? clauses[selectedClauseIndex] : null;
  const selectedCitations = useMemo(() => {
    if (!selectedClause?.citations?.length) return new Set();
    return new Set(selectedClause.citations);
  }, [selectedClause]);

  const scrollToSegment = useCallback((id) => {
    const el = document.querySelector(`[data-seg-id="${id}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    window.scrollBy(0, -80);
  }, []);

  const selectClause = useCallback(
    (index) => {
      setSelectedClauseIndex(index);
      const clause = clauses[index];
      if (clause?.citations?.length) {
        scrollToSegment(clause.citations[0]);
      }
    },
    [clauses, scrollToSegment]
  );

  const toggleType = useCallback((type) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!clauseTypes.length) return;
    setActiveTypes((prev) => {
      if (prev.size === 0) return new Set(clauseTypes);
      const next = new Set(prev);
      clauseTypes.forEach((type) => next.add(type));
      return next;
    });
  }, [clauseTypes]);

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  useEffect(() => {
    if (isHydrated && !parsedText) navigate("/analyze");
  }, [isHydrated, parsedText, navigate]);

  useEffect(() => {
    setSelectedClauseIndex(null);
  }, [parsedText]);

  useEffect(() => {
    if (selectedClauseIndex === null) return;
    const clause = clauses[selectedClauseIndex];
    if (!clause || !activeTypes.has(clause.type)) {
      setSelectedClauseIndex(null);
    }
  }, [activeTypes, clauses, selectedClauseIndex]);

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
          <HeaderBar
            fileName={uploadedFile?.name}
            resetAnalysis={resetAnalysis}
            navigate={navigate}
            clauses={clauses}
            summary={summary}
            parsedText={parsedText}
            segments={normalizedSegments}
            setToast={setToast}
          />

          {warning && (
            <p className="text-amber-600 text-sm" role="status">
              {warning}
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section
              className="lg:col-span-2 p-4 rounded-md dark:border-slate-700 border border-slate-200
             dark:bg-slate-800 overflow-y-auto max-h-[85vh]"
              aria-label="Contract Text Viewer"
            >
              <div className="space-y-3 text-left leading-relaxed">
                {normalizedSegments.map((segment) => {
                  const clauseIndexes = citationsMap.get(segment.id) || [];
                  const activeIndexes = clauseIndexes.filter((idx) =>
                    activeTypes.has(clauses[idx]?.type)
                  );
                  const highlightIndex = activeIndexes[0];
                  const highlightClause =
                    highlightIndex !== undefined
                      ? clauses[highlightIndex]
                      : null;
                  const isHighlighted = Boolean(highlightClause);
                  const colors = isHighlighted
                    ? getClauseColor(highlightClause.type)
                    : null;
                  const isSelected = selectedCitations.has(segment.id);

                  return (
                    <p
                      key={segment.id}
                      data-seg-id={segment.id}
                      role={isHighlighted ? "button" : undefined}
                      tabIndex={isHighlighted ? 0 : -1}
                      className={`rounded-md border-l-4 px-3 py-2 transition-shadow outline-none
                        ${
                          isHighlighted
                            ? "cursor-pointer"
                            : "border-transparent"
                        }
                        ${
                          isSelected
                            ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-800"
                            : ""
                        }`}
                      style={
                        isHighlighted
                          ? {
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderColor: colors.border,
                            }
                          : undefined
                      }
                      onClick={() => {
                        if (!clauseIndexes.length) return;
                        const match = activeIndexes[0] ?? clauseIndexes[0];
                        if (match !== undefined) selectClause(match);
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        if (!clauseIndexes.length) return;
                        event.preventDefault();
                        const match = activeIndexes[0] ?? clauseIndexes[0];
                        if (match !== undefined) selectClause(match);
                      }}
                    >
                      <span className="text-xs text-slate-500 mr-2 select-none">
                        [{segment.id}]
                      </span>
                      {segment.text}
                    </p>
                  );
                })}
              </div>
            </section>

            <aside
              className="p-4 rounded-md border border-slate-200 dark:border-slate-700
             bg-slate-50 dark:bg-slate-800 sticky top-4 h-fit space-y-4"
              aria-label="Insights Sidebar"
            >
              <div>
                <h2 className="font-semibold text-lg">Insights</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Clause types, risks, and citations.
                </p>
              </div>

              <Suspense fallback={null}>
                <ColorLegend types={clauseTypes} />
                <FilterTabs
                  types={clauseTypes}
                  counts={clauseCounts}
                  activeTypes={activeTypes}
                  toggleType={toggleType}
                />
              </Suspense>

              {visibleClauses.length ? (
                <div className="space-y-3">
                  {visibleClauses.map(({ clause, idx }) => {
                    const riskStyle = getRiskStyle(clause.risk);
                    const isActive = selectedClauseIndex === idx;
                    return (
                      <div
                        key={`${clause.type}-${idx}`}
                        role="button"
                        tabIndex={0}
                        className={`rounded-md border p-3 text-sm transition-shadow outline-none
                          ${
                            isActive
                              ? "border-primary-500 shadow-sm"
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        onClick={() => selectClause(idx)}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" && event.key !== " ")
                            return;
                          event.preventDefault();
                          selectClause(idx);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-primary-700 dark:text-primary-300">
                            {clause.type}
                          </span>
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: riskStyle.bg,
                              color: riskStyle.text,
                              borderColor: riskStyle.border,
                            }}
                          >
                            {clause.risk || "medium"}
                          </span>
                        </div>
                        <p className="mt-2 text-slate-600 dark:text-slate-300">
                          {clause.explanation || "No explanation provided."}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {clause.citations?.length ? (
                            clause.citations.map((id) => (
                              <button
                                key={`${clause.type}-${idx}-${id}`}
                                className="text-xs px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  scrollToSegment(id);
                                }}
                              >
                                Line {id}
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500">
                              No citations
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {(clauses || []).length
                    ? "No clauses for the selected filters. Review the summary below."
                    : "No clauses found. Review the summary below."}
                </p>
              )}

              <RiskSummaryPanel summary={summary} />
              <Disclaimer />
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
