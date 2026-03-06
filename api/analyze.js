/* global process */

import { MAX_CHARS, RATE_LIMIT_MAX } from "../server/constants.js";
import { json, readJson } from "../server/http.js";
import { normalizeOutput } from "../server/normalize.js";
import { checkRateLimit } from "../server/rateLimit.js";
import { verifyTurnstile } from "../server/turnstile.js";

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
  const userAgent = req.headers["user-agent"] || "unknown";
  const prefix = process.env.RATE_LIMIT_PREFIX || "legal-doc-analyzer";
  const identity = `${prefix}:${clientIp || "local"}:${userAgent}`;
  let rate;
  try {
    rate = await checkRateLimit(identity);
  } catch (err) {
    return json(res, 500, { error: err.message || "Rate limit failure." });
  }
  const resetSeconds =
    typeof rate.reset === "number" && rate.reset > 1e12
      ? Math.floor(rate.reset / 1000)
      : rate.reset;
  res.setHeader("X-RateLimit-Limit", rate.limit ?? RATE_LIMIT_MAX);
  res.setHeader("X-RateLimit-Remaining", rate.remaining ?? 0);
  res.setHeader("X-RateLimit-Reset", resetSeconds ?? 0);
  if (!rate.success) {
    const retryAfter =
      typeof resetSeconds === "number"
        ? Math.max(0, resetSeconds - Math.floor(Date.now() / 1000))
        : 60;
    res.setHeader("Retry-After", retryAfter);
    return json(res, 429, {
      error: "Rate limit exceeded. Please try again later.",
    });
  }

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

  const systemMessage =
    "You are a legal document analyzer. Return JSON only. Keep outputs concise and factual.";

  const baseUserMessage = `${prompt}
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
"""${inputText}"""`;

  const retryUserMessage = `${prompt}
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
Limit to the 6 most important clauses. Keep explanations to 1 sentence.
Contract text:
"""${inputText}"""`;

  const callOpenAI = async (userMessage) => {
    const requestBody = {
      model,
      temperature: 0,
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    };

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const aiJson = await aiRes.json().catch(() => ({}));
    return { aiRes, aiJson };
  };

  try {
    let { aiRes, aiJson } = await callOpenAI(baseUserMessage);
    if (!aiRes.ok) {
      const msg = aiJson?.error?.message || "OpenAI request failed.";
      return json(res, 502, { error: msg });
    }

    let choice = aiJson?.choices?.[0];
    if (choice?.finish_reason === "length") {
      ({ aiRes, aiJson } = await callOpenAI(retryUserMessage));
      if (!aiRes.ok) {
        const msg = aiJson?.error?.message || "OpenAI request failed.";
        return json(res, 502, { error: msg });
      }
      choice = aiJson?.choices?.[0];
      if (choice?.finish_reason === "length") {
        return json(res, 502, {
          error:
            "Model output was truncated. Please try again or upload a shorter document.",
        });
      }
    }

    const raw = choice?.message?.content?.trim();
    const normalized = normalizeOutput(raw || "");
    return json(res, 200, normalized);
  } catch (err) {
    return json(res, 500, { error: err.message || "Unknown server error." });
  }
}
