import { mapAnalysisResultsToClauses } from "@/utils/mapAnalysisResults";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function analyzeDocument({
  documentId,
  blocks,
  segments,
  turnstileToken,
}) {
  const payload = {
    documentId,
    blocks: Array.isArray(blocks) ? blocks : [],
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
    clauses: mapAnalysisResultsToClauses(results, blocks, segments),
    summary: typeof data?.summary === "string" ? data.summary : "",
  };
}
