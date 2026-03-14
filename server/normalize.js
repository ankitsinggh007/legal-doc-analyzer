function normalizeRisk(value) {
  const v = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (v === "low" || v === "medium" || v === "high") return v;
  if (v === "med" || v === "mid") return "medium";
  return "";
}

function normalizeBlockId(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOutput(
  rawText,
  { documentId = "", allowedBlockIds = [] } = {}
) {
  const allowedIds = new Set(
    Array.isArray(allowedBlockIds) ? allowedBlockIds.filter(Boolean) : []
  );

  if (!rawText || typeof rawText !== "string") {
    return {
      documentId,
      results: [],
      summary: "",
      validationError: "Model returned an empty response.",
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      documentId,
      results: [],
      summary: "",
      validationError: "Model did not return valid JSON.",
    };
  }

  if (!Array.isArray(parsed?.results)) {
    return {
      documentId,
      results: [],
      summary: "",
      validationError: "Model response is missing a results array.",
    };
  }

  const seenBlockIds = new Set();
  const results = [];

  for (const result of parsed.results) {
    if (!result || typeof result !== "object") {
      return {
        documentId,
        results: [],
        summary: "",
        validationError: "Model returned an invalid result item.",
      };
    }

    const blockId = normalizeBlockId(result.blockId);
    const clauseType =
      typeof result.clauseType === "string" ? result.clauseType.trim() : "";
    const explanation =
      typeof result.explanation === "string" ? result.explanation.trim() : "";
    const riskFlag = normalizeRisk(result.riskFlag);

    if (!blockId) {
      return {
        documentId,
        results: [],
        summary: "",
        validationError: "Model returned a result without a blockId.",
      };
    }

    if (allowedIds.size > 0 && !allowedIds.has(blockId)) {
      return {
        documentId,
        results: [],
        summary: "",
        validationError: `Model returned an unknown blockId: ${blockId}.`,
      };
    }

    if (seenBlockIds.has(blockId)) {
      return {
        documentId,
        results: [],
        summary: "",
        validationError: `Model returned a duplicate blockId: ${blockId}.`,
      };
    }

    if (!clauseType) {
      return {
        documentId,
        results: [],
        summary: "",
        validationError: `Model returned an empty clauseType for ${blockId}.`,
      };
    }

    if (!riskFlag) {
      return {
        documentId,
        results: [],
        summary: "",
        validationError: `Model returned an invalid riskFlag for ${blockId}.`,
      };
    }

    if (!explanation) {
      return {
        documentId,
        results: [],
        summary: "",
        validationError: `Model returned an empty explanation for ${blockId}.`,
      };
    }

    seenBlockIds.add(blockId);
    results.push({
      blockId,
      clauseType,
      riskFlag,
      explanation,
    });
  }

  const summary =
    typeof parsed?.summary === "string" ? parsed.summary.trim() : "";

  return { documentId, results, summary };
}
