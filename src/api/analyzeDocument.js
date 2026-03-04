const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function analyzeDocument({ text, segments, turnstileToken }) {
  const payload = {
    text,
    segments: Array.isArray(segments) ? segments : [],
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

  return {
    clauses: Array.isArray(data?.clauses) ? data.clauses : [],
    summary: typeof data?.summary === "string" ? data.summary : "",
  };
}
