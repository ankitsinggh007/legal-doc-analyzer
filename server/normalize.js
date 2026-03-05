function normalizeRisk(value) {
  const v = typeof value === "string" ? value.toLowerCase().trim() : "";
  if (v === "low" || v === "medium" || v === "high") return v;
  if (v === "med" || v === "mid") return "medium";
  return "medium";
}

function normalizeCitations(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (typeof item === "number" && Number.isFinite(item)) out.push(item);
    if (typeof item === "string" && item.trim() !== "") {
      const n = Number(item);
      if (Number.isFinite(n)) out.push(n);
    }
  }
  return Array.from(new Set(out));
}

export function normalizeOutput(rawText) {
  if (!rawText || typeof rawText !== "string") {
    return { clauses: [], summary: "" };
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { clauses: [], summary: rawText.slice(0, 1200) };
  }

  const clauses = Array.isArray(parsed?.clauses)
    ? parsed.clauses
        .map((c) => {
          if (!c || typeof c !== "object") return null;
          const type = typeof c.type === "string" ? c.type.trim() : "";
          if (!type) return null;
          const explanation =
            typeof c.explanation === "string" ? c.explanation.trim() : "";
          return {
            type,
            risk: normalizeRisk(c.risk),
            explanation,
            citations: normalizeCitations(c.citations),
          };
        })
        .filter(Boolean)
    : [];

  const summary =
    typeof parsed?.summary === "string" ? parsed.summary.trim() : "";

  return { clauses, summary };
}
