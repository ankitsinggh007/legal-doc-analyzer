import process from "node:process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import evalSet from "./fixtures/legal-analysis.eval-set.json" with { type: "json" };
import {
  ANALYSIS_CLASSIFICATIONS,
  ANALYSIS_RISK_LEVELS,
  applyPassCriteria,
  createEmptyDocumentScore,
} from "./helpers/scoreAnalysis.mjs";
import { preprocessCorpusDocument } from "../corpus/helpers/preprocessCorpusDocument.mjs";
import { normalizeOutput } from "../../server/normalize.js";
import {
  ANALYZE_BLOCKS_EXHAUSTIVE_RESPONSE_FORMAT,
  buildExhaustiveAnalyzeBlocksPrompt,
} from "../../server/prompts/analyzeBlocksPrompt.js";

const evalDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(evalDir, "output");
const systemMessage =
  "You are a legal document analyzer. Return JSON only. Keep outputs concise and factual.";

function estimateEvalMaxTokens(blockCount) {
  const estimatedOutputTokens = blockCount * 65 + 180;
  return Math.max(500, Math.min(2200, estimatedOutputTokens));
}

function getCliMode() {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  const mode = modeArg?.split("=")[1]?.trim().toLowerCase() || "mock";
  return mode === "live" ? "live" : "mock";
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeClassification(value) {
  const v = normalizeString(value).toLowerCase();
  return ANALYSIS_CLASSIFICATIONS.includes(v) ? v : "";
}

function normalizeRiskLevel(value) {
  const v = normalizeString(value).toLowerCase();
  if (ANALYSIS_RISK_LEVELS.includes(v)) return v;
  if (v === "med" || v === "mid") return "medium";
  return "";
}

function createMockResults(blocks) {
  return blocks.map((block, index) => {
    const sourceText = `${block.sectionLabel || ""} ${block.text || ""}`.toLowerCase();

    if (
      sourceText.includes("witness") ||
      sourceText.includes("signature") ||
      sourceText.includes("owner tenant")
    ) {
      return {
        blockId: block.blockId,
        classification: "noise",
        riskLevel: "none",
      };
    }

    if (index % 5 === 0) {
      return {
        blockId: block.blockId,
        classification: "clause_flagged",
        clauseType: "Termination",
        riskLevel: "medium",
        title: "Early termination clause",
        explanation:
          "Defines how the agreement can end and what notice or breach conditions apply.",
      };
    }

    if (index % 5 === 1) {
      return {
        blockId: block.blockId,
        classification: "clause_no_issue",
        clauseType: "Term",
        riskLevel: "none",
      };
    }

    return {
      blockId: block.blockId,
      classification: "clause_no_issue",
      clauseType: "General Clause",
      riskLevel: "none",
    };
  });
}

function scoreResults({ documentId, blocks, results, summary, thresholds }) {
  return scoreRun({
    documentId,
    blocks,
    results,
    summary,
    thresholds,
    validJson: true,
    validSchema: true,
    validationError: "",
  });
}

function scoreRun({
  documentId,
  blocks,
  results,
  summary,
  thresholds,
  validJson,
  validSchema,
  validationError = "",
}) {
  const base = createEmptyDocumentScore(documentId, blocks.length, thresholds);
  const allowedBlockIds = new Set(blocks.map((block) => block.blockId));
  const seen = new Set();

  let duplicateBlockIds = 0;
  let unknownBlockIds = 0;
  let invalidFieldCount = 0;
  let flaggedCount = 0;
  let noIssueCount = 0;
  let noiseCount = 0;

  for (const result of Array.isArray(results) ? results : []) {
    if (!result || typeof result !== "object") {
      invalidFieldCount += 1;
      continue;
    }

    const blockId = normalizeString(result.blockId);
    const classification = normalizeClassification(result.classification);
    const clauseType = normalizeString(result.clauseType);
    const riskLevel = normalizeRiskLevel(result.riskLevel);
    const title = normalizeString(result.title);
    const explanation = normalizeString(result.explanation);

    if (!blockId) {
      invalidFieldCount += 1;
      continue;
    }

    if (seen.has(blockId)) duplicateBlockIds += 1;
    seen.add(blockId);

    if (!allowedBlockIds.has(blockId)) unknownBlockIds += 1;
    if (!classification || !riskLevel) invalidFieldCount += 1;

    if (classification === "clause_flagged") {
      flaggedCount += 1;
      if (!clauseType || !title || !explanation || riskLevel === "none") {
        invalidFieldCount += 1;
      }
    } else if (classification === "clause_no_issue") {
      noIssueCount += 1;
      if (!clauseType || riskLevel !== "none") invalidFieldCount += 1;
    } else if (classification === "noise") {
      noiseCount += 1;
      if (riskLevel !== "none") invalidFieldCount += 1;
    } else {
      invalidFieldCount += 1;
    }
  }

  const coveragePct =
    blocks.length > 0 ? Math.round((seen.size / blocks.length) * 100) : 0;
  const unclassifiedCount = Math.max(0, blocks.length - seen.size);

  return applyPassCriteria({
    ...base,
    validJson,
    validSchema: validSchema && invalidFieldCount === 0,
    duplicateBlockIds,
    unknownBlockIds,
    coveragePct,
    flaggedCount,
    noIssueCount,
    noiseCount,
    unclassifiedCount,
    invalidFieldCount,
    summaryPresent: Boolean(normalizeString(summary)),
    validationError,
  });
}

async function ensureOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

function buildInputText(blocks) {
  return blocks
    .map((block) => {
      const label = block.sectionLabel ? `${block.sectionLabel}\n` : "";
      return `[${block.blockId}] ${label}${block.text}`;
    })
    .join("\n\n");
}

function tryParseJson(rawText) {
  try {
    JSON.parse(rawText);
    return true;
  } catch {
    return false;
  }
}

async function runLiveAnalysis({ documentId, blocks }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for --mode=live.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const maxTokens =
    Number(process.env.OPENAI_EVAL_MAX_TOKENS) ||
    estimateEvalMaxTokens(blocks.length);
  const inputText = buildInputText(blocks);
  const userMessage = buildExhaustiveAnalyzeBlocksPrompt(inputText);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: maxTokens,
      response_format: ANALYZE_BLOCKS_EXHAUSTIVE_RESPONSE_FORMAT,
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    }),
  });

  const responseJson = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(responseJson?.error?.message || "OpenAI eval request failed.");
  }

  const rawText = normalizeString(responseJson?.choices?.[0]?.message?.content);
  const normalized = normalizeOutput(rawText, {
    documentId,
    allowedBlockIds: blocks.map((block) => block.blockId),
    requireFullCoverage: true,
  });

  return {
    rawText,
    normalized,
    validJson: tryParseJson(rawText),
  };
}

async function runEval() {
  await ensureOutputDir();
  const mode = getCliMode();

  const report = {
    evalSet: evalSet.name,
    generatedAt: new Date().toISOString(),
    mode,
    documents: [],
  };

  for (const document of evalSet.documents) {
    const fileName = path.basename(document.fixturePath);
    const { preprocessResult } = await preprocessCorpusDocument(fileName);
    const blocks = preprocessResult.blocks || [];
    let results = [];
    let summary = "";
    let rawResponse = "";
    let validationError = "";
    let validJson = true;
    let validSchema = true;

    if (mode === "live") {
      const live = await runLiveAnalysis({
        documentId: document.id,
        blocks,
      });
      rawResponse = live.rawText;
      results = live.normalized.results || [];
      summary = live.normalized.summary || "";
      validationError = live.normalized.validationError || "";
      validJson = live.validJson;
      validSchema = !validationError;
    } else {
      results = createMockResults(blocks);
      summary =
        "Mock evaluation output for schema and scoring harness validation.";
    }

    const score = scoreRun({
      documentId: document.id,
      blocks,
      results,
      summary,
      thresholds: evalSet.thresholds,
      validJson,
      validSchema,
      validationError,
    });

    report.documents.push({
      id: document.id,
      fixturePath: document.fixturePath,
      blockCount: blocks.length,
      score,
      results,
      summary,
      rawResponse,
    });
  }

  const filePath = path.join(outputDir, `latest-${mode}-report.json`);
  await fs.writeFile(filePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const lines = [
    `Eval set: ${report.evalSet}`,
    `Mode: ${report.mode}`,
    ...report.documents.map((document) => {
      const { score } = document;
      return [
        `${document.id}: ${score.pass ? "PASS" : "FAIL"}`,
        `coverage=${score.coveragePct}%`,
        `flagged=${score.flaggedCount}`,
        `no_issue=${score.noIssueCount}`,
        `noise=${score.noiseCount}`,
        `unclassified=${score.unclassifiedCount}`,
        `invalid=${score.invalidFieldCount}`,
        score.validationError ? `validation_error=${score.validationError}` : "",
      ]
        .filter(Boolean)
        .join(" | ");
    }),
    `Saved report: ${filePath}`,
  ];

  console.log(lines.join("\n"));
}

runEval().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
