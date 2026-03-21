function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRiskLevel(value) {
  const v = normalizeString(value).toLowerCase();
  if (v === "none" || v === "low" || v === "medium" || v === "high") {
    return v;
  }
  if (v === "med" || v === "mid") return "medium";
  return "";
}

function normalizeClassification(value) {
  const v = normalizeString(value).toLowerCase();
  if (v === "clause_flagged" || v === "clause_no_issue" || v === "noise") {
    return v;
  }
  return "";
}

function normalizeBlockId(value) {
  return normalizeString(value);
}

export function normalizeOutput(
  rawText,
  { documentId = "", allowedBlockIds = [], requireFullCoverage = false } = {}
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
    const rawClauseType = normalizeString(result.clauseType);
    const rawExplanation = normalizeString(result.explanation);
    const rawTitle = normalizeString(result.title);
    const riskLevel = normalizeRiskLevel(result.riskLevel ?? result.riskFlag);

    let classification = normalizeClassification(result.classification);
    const looksLikeLegacyFlagged =
      !classification &&
      rawClauseType &&
      ["low", "medium", "high"].includes(riskLevel);

    if (looksLikeLegacyFlagged) {
      classification = "clause_flagged";
    }

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

    if (!classification) {
      return {
        documentId,
        results: [],
        summary: "",
        validationError: `Model returned an invalid classification for ${blockId}.`,
      };
    }

    if (!riskLevel) {
      return {
        documentId,
        results: [],
        summary: "",
        validationError: `Model returned an invalid riskLevel for ${blockId}.`,
      };
    }

    let clauseType = rawClauseType;
    let title = rawTitle;
    let explanation = rawExplanation;

    if (classification === "clause_flagged") {
      if (!clauseType) {
        return {
          documentId,
          results: [],
          summary: "",
          validationError: `Model returned an empty clauseType for flagged block ${blockId}.`,
        };
      }

      if (!["low", "medium", "high"].includes(riskLevel)) {
        return {
          documentId,
          results: [],
          summary: "",
          validationError: `Model returned invalid riskLevel "${riskLevel}" for flagged block ${blockId}.`,
        };
      }

      if (!title) {
        if (looksLikeLegacyFlagged) {
          title = clauseType;
        } else {
          return {
            documentId,
            results: [],
            summary: "",
            validationError: `Model returned an empty title for flagged block ${blockId}.`,
          };
        }
      }

      if (!explanation) {
        return {
          documentId,
          results: [],
          summary: "",
          validationError: `Model returned an empty explanation for flagged block ${blockId}.`,
        };
      }
    }

    if (classification === "clause_no_issue") {
      if (!clauseType) {
        return {
          documentId,
          results: [],
          summary: "",
          validationError: `Model returned an empty clauseType for clause_no_issue block ${blockId}.`,
        };
      }

      if (riskLevel !== "none") {
        return {
          documentId,
          results: [],
          summary: "",
          validationError: `Model returned non-none riskLevel for clause_no_issue block ${blockId}.`,
        };
      }

      title = "";
      explanation = "";
    }

    if (classification === "noise") {
      if (riskLevel !== "none") {
        return {
          documentId,
          results: [],
          summary: "",
          validationError: `Model returned non-none riskLevel for noise block ${blockId}.`,
        };
      }

      clauseType = "";
      title = "";
      explanation = "";
    }

    seenBlockIds.add(blockId);
    results.push({
      blockId,
      classification,
      clauseType,
      riskLevel,
      title,
      explanation,
    });
  }

  if (
    requireFullCoverage &&
    allowedIds.size > 0 &&
    seenBlockIds.size !== allowedIds.size
  ) {
    const missingBlockIds = [...allowedIds].filter(
      (blockId) => !seenBlockIds.has(blockId)
    );
    return {
      documentId,
      results: [],
      summary: "",
      validationError: `Model omitted blockIds: ${missingBlockIds.join(", ")}.`,
    };
  }

  const summary = normalizeString(parsed?.summary);

  return { documentId, results, summary };
}
