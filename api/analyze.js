/* global process, URLSearchParams */

const MAX_CHARS = 6000;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let data = "";
  for await (const chunk of req) data += chunk;
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

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

function normalizeOutput(rawText) {
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

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    throw new Error("Server misconfigured: TURNSTILE_SECRET_KEY is missing.");
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (ip) body.append("remoteip", ip);

  const resp = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body }
  );
  const data = await resp.json().catch(() => ({}));
  return Boolean(data?.success);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed." });
  }

  const body = await readJson(req);
  if (!body) return json(res, 400, { error: "Invalid JSON body." });

  const turnstileToken = body.turnstileToken;
  if (!turnstileToken) {
    return json(res, 400, { error: "Missing Turnstile token." });
  }

  const rawSegments = Array.isArray(body.segments) ? body.segments : null;
  const hasSegments = rawSegments && rawSegments.length > 0;
  const text =
    typeof body.text === "string" ? body.text.trim() : hasSegments ? "" : "";

  if (!text && !hasSegments) {
    return json(res, 400, { error: "Missing contract text." });
  }

  const segments = hasSegments
    ? rawSegments
        .map((seg) => ({
          id: seg?.id,
          text: typeof seg?.text === "string" ? seg.text.trim() : "",
        }))
        .filter((seg) => seg.text)
    : [];

  const inputText = hasSegments
    ? segments.map((seg) => `[${seg.id}] ${seg.text}`).join("\n")
    : text;

  if (inputText.length > MAX_CHARS) {
    return json(res, 400, {
      error: `Document too long. Max ${MAX_CHARS} characters.`,
    });
  }

  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim();
  const turnstileOk = await verifyTurnstile(turnstileToken, clientIp);
  if (!turnstileOk) {
    return json(res, 403, { error: "Turnstile verification failed." });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(res, 500, { error: "Server misconfigured: missing API key." });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = hasSegments
    ? `Contract text is provided with paragraph IDs in brackets like [12]. Use those IDs in citations.`
    : `Contract text has no paragraph IDs. Return citations as an empty array for each clause.`;

  const requestBody = {
    model,
    temperature: 0,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are a legal document analyzer. Return JSON only. Keep outputs concise and factual.",
      },
      {
        role: "user",
        content: `${prompt}
Return JSON in exactly this shape:
{
  "clauses": [
    {
      "type": "Termination",
      "risk": "low|medium|high",
      "explanation": "...",
      "citations": [12, 13]
    }
  ],
  "summary": "..."
}
Contract text:
"""${inputText}"""`,
      },
    ],
  };

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const aiJson = await aiRes.json().catch(() => ({}));
    if (!aiRes.ok) {
      const msg = aiJson?.error?.message || "OpenAI request failed.";
      return json(res, 502, { error: msg });
    }

    const raw = aiJson?.choices?.[0]?.message?.content?.trim();
    const normalized = normalizeOutput(raw || "");
    return json(res, 200, normalized);
  } catch (err) {
    return json(res, 500, { error: err.message || "Unknown server error." });
  }
}
