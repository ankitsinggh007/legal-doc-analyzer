import { mapAnalysisResultsToClauses } from "@/utils/mapAnalysisResults";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function analyzeDocument({ documentId, blocks, turnstileToken }) {
  const requestBlocks = Array.isArray(blocks)
    ? blocks.map((block) => ({
        blockId: typeof block?.blockId === "string" ? block.blockId : "",
        sectionLabel:
          typeof block?.sectionLabel === "string" ? block.sectionLabel : "",
        text: typeof block?.text === "string" ? block.text : "",
      }))
    : [];

  const payload = {
    documentId,
    blocks: requestBlocks,
    turnstileToken,
  };

  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || "Analysis request failed.";
    throw new Error(msg);
  }

  const results = Array.isArray(data?.results) ? data.results : [];
  return {
    documentId:
      typeof data?.documentId === "string" ? data.documentId : documentId,
    results,
    clauses: mapAnalysisResultsToClauses(results, blocks),
    summary: typeof data?.summary === "string" ? data.summary : "",
  };
}
