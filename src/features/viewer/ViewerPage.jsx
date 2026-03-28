import { useState, useEffect, useMemo, useCallback } from "react";
import { useAnalyze } from "@/context/AnalyzeContext";
import { useNavigate } from "react-router-dom";
import { Container } from "@/components/layout/Container";
import { RiskSummaryPanel } from "./components/RiskSummaryPanel";
import { lazy, Suspense } from "react";
import { HeaderBar } from "./components/HeaderBar";
import { getClauseColor, getRiskStyle } from "@/utils/clauseStyles";
import Disclaimer from "@/components/Disclaimer";

const ColorLegend = lazy(() => import("./components/ColorLegend"));
const FilterTabs = lazy(() => import("./components/FilterTabs"));

function getBlockBodyText(block) {
  const sectionLabel = String(block?.sectionLabel || "").trim();
  const text = String(block?.text || "").trim();

  if (!sectionLabel || !text) {
    return text;
  }

  if (!text.startsWith(sectionLabel)) {
    return text;
  }

  return text
    .slice(sectionLabel.length)
    .replace(/^[\s.:;,-]+/, "")
    .trim();
}

function getBlockTone(blockState) {
  switch (blockState?.classification) {
    case "clause_no_issue":
      return {
        className:
          "border-emerald-200 bg-emerald-50/70 text-slate-800 dark:border-emerald-900/70 dark:bg-emerald-950/20 dark:text-slate-100",
      };
    case "noise":
      return {
        className:
          "border-dashed border-slate-200 bg-slate-50/70 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
      };
    case "unclassified":
      return {
        className:
          "border-amber-200 bg-amber-50/70 text-slate-800 dark:border-amber-900/70 dark:bg-amber-950/20 dark:text-slate-100",
      };
    default:
      return {
        className:
          "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
      };
  }
}

export default function ViewerPage() {
  const {
    uploadedFile,
    preprocessResult,
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
  const documentBlocks = useMemo(
    () =>
      Array.isArray(preprocessResult?.blocks) ? preprocessResult.blocks : [],
    [preprocessResult]
  );
  const blockMap = useMemo(
    () => new Map(documentBlocks.map((block) => [block.blockId, block])),
    [documentBlocks]
  );
  const viewerClauses = useMemo(() => {
    if (!Array.isArray(clauses)) return [];

    const clausesWithBlocks = clauses.filter(
      (clause) =>
        typeof clause?.blockId === "string" && blockMap.has(clause.blockId)
    );

    return clausesWithBlocks.length ? clausesWithBlocks : clauses;
  }, [blockMap, clauses]);
  const flaggedClauses = useMemo(
    () =>
      viewerClauses.filter(
        (clause) => clause?.classification === "clause_flagged" && clause.type
      ),
    [viewerClauses]
  );

  const clauseTypes = useMemo(() => {
    const unique = Array.from(
      new Set(flaggedClauses.map((clause) => clause.type).filter(Boolean))
    );
    return unique;
  }, [flaggedClauses]);

  const clauseCounts = useMemo(() => {
    const counts = {};
    flaggedClauses.forEach((clause) => {
      counts[clause.type] = (counts[clause.type] || 0) + 1;
    });
    return counts;
  }, [flaggedClauses]);

  const clauseIndexByBlockId = useMemo(() => {
    const map = new Map();
    flaggedClauses.forEach((clause, index) => {
      if (
        typeof clause?.blockId === "string" &&
        activeTypes.has(clause.type) &&
        !map.has(clause.blockId)
      ) {
        map.set(clause.blockId, index);
      }
    });
    return map;
  }, [activeTypes, flaggedClauses]);

  const visibleClauses = useMemo(() => {
    return flaggedClauses
      .map((clause, idx) => ({ clause, idx }))
      .filter(({ clause }) => activeTypes.has(clause.type));
  }, [flaggedClauses, activeTypes]);
  const blockStateById = useMemo(
    () =>
      new Map(
        viewerClauses
          .filter((clause) => typeof clause?.blockId === "string")
          .map((clause) => [clause.blockId, clause])
      ),
    [viewerClauses]
  );

  const selectedClause =
    selectedClauseIndex !== null ? flaggedClauses[selectedClauseIndex] : null;
  const selectedBlockId = selectedClause?.blockId || null;

  const scrollToBlock = useCallback((blockId) => {
    if (!blockId) return;
    const el = document.querySelector(`[data-block-id="${blockId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    window.scrollBy(0, -80);
  }, []);

  const selectClause = useCallback(
    (index) => {
      setSelectedClauseIndex(index);
      const clause = flaggedClauses[index];
      if (clause?.blockId) {
        scrollToBlock(clause.blockId);
      }
    },
    [flaggedClauses, scrollToBlock]
  );

  const selectBlock = useCallback(
    (blockId) => {
      const clauseIndex = clauseIndexByBlockId.get(blockId);
      if (clauseIndex === undefined) return;
      setSelectedClauseIndex(clauseIndex);
    },
    [clauseIndexByBlockId]
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
    if (isHydrated && !documentBlocks.length) {
      navigate("/analyze");
    }
  }, [documentBlocks.length, isHydrated, navigate]);

  useEffect(() => {
    setSelectedClauseIndex(null);
  }, [preprocessResult]);

  useEffect(() => {
    if (selectedClauseIndex === null) return;
    const clause = flaggedClauses[selectedClauseIndex];
    if (!clause || !activeTypes.has(clause.type)) {
      setSelectedClauseIndex(null);
    }
  }, [activeTypes, flaggedClauses, selectedClauseIndex]);

  if (!documentBlocks.length) return null;

  return (
    <main
      className="min-h-screen bg-white border-blue-500  dark:bg-slate-900 text-slate-800 dark:text-slate-100"
      aria-label="Document Viewer Page"
    >
      {!isHydrated ? (
        <div className="flex items-center justify-center h-screen text-slate-500 dark:text-slate-400">
          <p className="animate-pulse">Restoring session…</p>
        </div>
      ) : !documentBlocks.length ? null : (
        <Container className="max-w-[90%] lg:max-w-[85%] xl:max-w-[80%] py-6 space-y-6">
          <HeaderBar
            fileName={uploadedFile?.name}
            resetAnalysis={resetAnalysis}
            navigate={navigate}
            blocks={documentBlocks}
            clauses={flaggedClauses}
            summary={summary}
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
              aria-label="Document Block Viewer"
            >
              <div className="space-y-4 text-left">
                {documentBlocks.map((block) => {
                  const blockState = blockStateById.get(block.blockId) || {
                    blockId: block.blockId,
                    classification: "unclassified",
                    clauseType: "",
                    risk: "none",
                    riskLevel: "none",
                    title: "",
                    explanation:
                      "Could not classify this block. Verify manually.",
                  };
                  const linkedClauseIndex = clauseIndexByBlockId.get(
                    block.blockId
                  );
                  const linkedClause =
                    linkedClauseIndex !== undefined
                      ? viewerClauses[linkedClauseIndex]
                      : null;
                  const isFlagged =
                    blockState.classification === "clause_flagged";
                  const isInteractive = isFlagged && Boolean(linkedClause);
                  const isSelected = selectedBlockId === block.blockId;
                  const colors = isFlagged
                    ? getClauseColor(
                        linkedClause?.type || blockState.type || "Other"
                      )
                    : null;
                  const tone = getBlockTone(blockState);
                  const blockBodyText = getBlockBodyText(block);
                  const statusLabel =
                    blockState.classification === "clause_no_issue"
                      ? "No notable issue detected"
                      : blockState.classification === "noise"
                        ? "No clause detected"
                        : blockState.classification === "unclassified"
                          ? "Could not classify. Verify manually"
                          : "";

                  return (
                    <article
                      key={block.blockId}
                      data-block-id={block.blockId}
                      data-block-classification={blockState.classification}
                      role={isInteractive ? "button" : undefined}
                      tabIndex={isInteractive ? 0 : -1}
                      className={`min-w-0 rounded-2xl border px-5 py-4 transition-all outline-none ${tone.className} ${
                        isInteractive ? "cursor-pointer shadow-sm" : ""
                      } ${
                        isSelected
                          ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-800"
                          : ""
                      }`}
                      style={
                        isFlagged
                          ? {
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderColor: colors.border,
                            }
                          : undefined
                      }
                      onClick={() => selectBlock(block.blockId)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        selectBlock(block.blockId);
                      }}
                    >
                      <div className="space-y-3">
                        {statusLabel ? (
                          <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center rounded-full border border-current/20 bg-white/60 px-2.5 py-1 text-xs font-medium dark:bg-slate-900/40">
                              {statusLabel}
                            </span>
                          </div>
                        ) : null}
                        <h3 className="text-lg font-semibold leading-7">
                          {block.sectionLabel}
                        </h3>
                        {blockBodyText ? (
                          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-base leading-8">
                            {blockBodyText}
                          </p>
                        ) : null}
                      </div>
                    </article>
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
                  Flagged clauses, risks, and linked block analysis.
                </p>
              </div>

              <Suspense fallback={null}>
                {flaggedClauses.length ? (
                  <>
                    <ColorLegend types={clauseTypes} />
                    <FilterTabs
                      types={clauseTypes}
                      counts={clauseCounts}
                      activeTypes={activeTypes}
                      toggleType={toggleType}
                    />
                  </>
                ) : null}
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {flaggedClauses.length
                    ? "No flagged clauses for the selected filters. Review the summary below."
                    : "No flagged clauses found. Review the summary below."}
                </p>
              )}

              {!viewerClauses.length && clauses.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stored analysis data is missing block linkage. Re-run analysis
                  from the upload flow to use the new block-based viewer.
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
