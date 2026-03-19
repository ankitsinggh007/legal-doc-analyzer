function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeClassification(value, fallbackClauseType) {
  const normalized = normalizeString(value).toLowerCase();

  if (
    normalized === "clause_flagged" ||
    normalized === "clause_no_issue" ||
    normalized === "noise"
  ) {
    return normalized;
  }

  return fallbackClauseType ? "clause_flagged" : "";
}

function normalizeRisk(value, fallbackClassification) {
  const normalized = normalizeString(value).toLowerCase();

  if (
    normalized === "none" ||
    normalized === "low" ||
    normalized === "medium" ||
    normalized === "high"
  ) {
    return normalized;
  }

  if (normalized === "med" || normalized === "mid") {
    return "medium";
  }

  if (
    fallbackClassification === "clause_no_issue" ||
    fallbackClassification === "noise" ||
    fallbackClassification === "unclassified"
  ) {
    return "none";
  }

  return "medium";
}

export function mapAnalysisResultsToClauses(results, blocks) {
  const blockMap = new Map(
    (Array.isArray(blocks) ? blocks : []).map((block) => [block.blockId, block])
  );
  const seenBlockIds = new Set();

  const mappedResults = (Array.isArray(results) ? results : [])
    .map((result) => {
      if (!result || typeof result !== "object") return null;

      const blockId = normalizeString(result.blockId);
      if (!blockId || !blockMap.has(blockId) || seenBlockIds.has(blockId)) {
        return null;
      }

      const clauseType = normalizeString(result.clauseType);
      const classification = normalizeClassification(
        result.classification,
        clauseType
      );

      if (!classification) {
        return null;
      }

      const riskLevel = normalizeRisk(
        result.riskLevel ?? result.riskFlag,
        classification
      );
      const title =
        classification === "clause_flagged"
          ? normalizeString(result.title) || clauseType
          : "";
      const explanation =
        normalizeString(result.explanation) ||
        (classification === "clause_no_issue"
          ? "No notable issue detected."
          : classification === "noise"
            ? "No clause detected."
            : "Could not classify this block. Verify manually.");

      seenBlockIds.add(blockId);

      return {
        blockId,
        classification,
        clauseType,
        type: classification === "clause_flagged" ? clauseType : "",
        risk: classification === "clause_flagged" ? riskLevel : "none",
        riskLevel,
        title,
        explanation,
      };
    })
    .filter(Boolean);

  const unclassifiedBlocks = Array.from(blockMap.keys())
    .filter((blockId) => !seenBlockIds.has(blockId))
    .map((blockId) => ({
      blockId,
      classification: "unclassified",
      clauseType: "",
      type: "",
      risk: "none",
      riskLevel: "none",
      title: "",
      explanation: "Could not classify this block. Verify manually.",
    }));

  return [...mappedResults, ...unclassifiedBlocks];
}
