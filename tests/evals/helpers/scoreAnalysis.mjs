export const ANALYSIS_CLASSIFICATIONS = Object.freeze([
  "clause_flagged",
  "clause_no_issue",
  "noise",
  "unclassified",
]);

export const ANALYSIS_RISK_LEVELS = Object.freeze([
  "none",
  "low",
  "medium",
  "high",
]);

export const DEFAULT_EVAL_THRESHOLDS = Object.freeze({
  minCoveragePct: 80,
  maxUnclassifiedPct: 20,
  requireSummary: true,
  allowDuplicateBlockIds: false,
  allowUnknownBlockIds: false,
});

export function createEmptyDocumentScore(documentId, totalBlocks, thresholds = {}) {
  return {
    documentId,
    totalBlocks,
    thresholds: { ...DEFAULT_EVAL_THRESHOLDS, ...thresholds },
    validJson: false,
    validSchema: false,
    duplicateBlockIds: 0,
    unknownBlockIds: 0,
    coveragePct: 0,
    flaggedCount: 0,
    noIssueCount: 0,
    noiseCount: 0,
    unclassifiedCount: totalBlocks,
    invalidFieldCount: 0,
    summaryPresent: false,
    pass: false,
  };
}

export function applyPassCriteria(score) {
  const thresholds = score.thresholds ?? DEFAULT_EVAL_THRESHOLDS;
  const summaryOk = thresholds.requireSummary ? score.summaryPresent : true;
  const duplicateOk = thresholds.allowDuplicateBlockIds
    ? true
    : score.duplicateBlockIds === 0;
  const unknownOk = thresholds.allowUnknownBlockIds
    ? true
    : score.unknownBlockIds === 0;
  const coverageOk = score.coveragePct >= thresholds.minCoveragePct;
  const unclassifiedPct =
    score.totalBlocks > 0
      ? (score.unclassifiedCount / score.totalBlocks) * 100
      : 0;
  const unclassifiedOk = unclassifiedPct <= thresholds.maxUnclassifiedPct;

  return {
    ...score,
    pass:
      Boolean(score.validJson) &&
      Boolean(score.validSchema) &&
      summaryOk &&
      duplicateOk &&
      unknownOk &&
      coverageOk &&
      unclassifiedOk &&
      score.invalidFieldCount === 0,
  };
}
