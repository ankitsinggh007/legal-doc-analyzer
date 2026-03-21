/* global process */

import { MAX_CHARS, RATE_LIMIT_MAX } from "../server/constants.js";
import { json, readJson } from "../server/http.js";
import { normalizeOutput } from "../server/normalize.js";
import {
  ANALYZE_BLOCKS_EXHAUSTIVE_RESPONSE_FORMAT,
  buildExhaustiveAnalyzeBlocksPrompt,
  buildExhaustiveAnalyzeBlocksRetryPrompt,
} from "../server/prompts/analyzeBlocksPrompt.js";
import { checkRateLimit } from "../server/rateLimit.js";
import { verifyTurnstile } from "../server/turnstile.js";

const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS) || 25000;

function estimateMaxTokens(blockCount) {
  const estimatedOutputTokens = blockCount * 65 + 180;
  return Math.max(500, Math.min(2200, estimatedOutputTokens));
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

  const documentId =
    typeof body.documentId === "string" ? body.documentId.trim() : "";
  const rawBlocks = Array.isArray(body.blocks) ? body.blocks : [];

  if (!documentId) {
    return json(res, 400, { error: "Missing document ID." });
  }

  const blocks = rawBlocks
    .map((block) => ({
      blockId: typeof block?.blockId === "string" ? block.blockId.trim() : "",
      sectionLabel:
        typeof block?.sectionLabel === "string"
          ? block.sectionLabel.trim()
          : "",
      text: typeof block?.text === "string" ? block.text.trim() : "",
    }))
    .filter((block) => block.blockId && block.text);

  if (!blocks.length) {
    return json(res, 400, { error: "Missing document blocks." });
  }
  const allowedBlockIds = blocks.map((block) => block.blockId);

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(res, 500, { error: "Server misconfigured: missing API key." });
  }

  const turnstileOk = await verifyTurnstile(turnstileToken, clientIp);
  if (!turnstileOk) {
    return json(res, 403, { error: "Turnstile verification failed." });
  }

  const inputText = blocks
    .map((block) => {
      const label = block.sectionLabel ? `${block.sectionLabel}\n` : "";
      return `[${block.blockId}] ${label}${block.text}`;
    })
    .join("\n\n");

  if (inputText.length > MAX_CHARS) {
    return json(res, 400, {
      error: `Document too long. Max ${MAX_CHARS} characters.`,
    });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const systemMessage =
    "You are a legal document analyzer. Return JSON only. Keep outputs concise and factual.";
  const maxTokens = estimateMaxTokens(blocks.length);
  const baseUserMessage = buildExhaustiveAnalyzeBlocksPrompt(inputText);

  const callOpenAI = async (userMessage) => {
    const requestBody = {
      model,
      temperature: 0,
      max_tokens: maxTokens,
      response_format: ANALYZE_BLOCKS_EXHAUSTIVE_RESPONSE_FORMAT,
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
      const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      const aiJson = await aiRes.json().catch(() => ({}));
      return { aiRes, aiJson };
    } catch (err) {
      if (err?.name === "AbortError") {
        const timeoutError = new Error(
          "Analysis request timed out. Please try again."
        );
        timeoutError.name = "OpenAITimeoutError";
        throw timeoutError;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    let { aiRes, aiJson } = await callOpenAI(baseUserMessage);
    if (!aiRes.ok) {
      const msg = aiJson?.error?.message || "OpenAI request failed.";
      return json(res, 502, { error: msg });
    }

    let choice = aiJson?.choices?.[0];
    let retryReason = "";

    if (choice?.finish_reason === "length") {
      retryReason = "Model output was truncated.";
    } else {
      const raw = choice?.message?.content?.trim();
      const normalized = normalizeOutput(raw || "", {
        documentId,
        allowedBlockIds,
        requireFullCoverage: true,
      });

      if (!normalized.validationError) {
        return json(res, 200, normalized);
      }

      retryReason = normalized.validationError;
    }

    if (retryReason) {
      ({ aiRes, aiJson } = await callOpenAI(
        buildExhaustiveAnalyzeBlocksRetryPrompt(inputText, retryReason)
      ));
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
    const normalized = normalizeOutput(raw || "", {
      documentId,
      allowedBlockIds,
      requireFullCoverage: true,
    });

    if (normalized.validationError) {
      return json(res, 502, {
        error: "Model returned an invalid analysis response. Please try again.",
      });
    }

    return json(res, 200, normalized);
  } catch (err) {
    if (err?.name === "OpenAITimeoutError") {
      return json(res, 504, { error: err.message });
    }
    return json(res, 500, { error: err.message || "Unknown server error." });
  }
}
