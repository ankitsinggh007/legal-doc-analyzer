import {
  createPreprocessResult,
  PREPROCESS_QUALITY,
} from "./preprocessResult.js";

const WARNING_TEXT_LENGTH = 800;
const BAD_TEXT_LENGTH = 400;
const WARNING_SHORT_LINE_RATIO = 0.35;
const BAD_SHORT_LINE_RATIO = 0.55;
const WARNING_NOISE_RATIO = 0.08;
const BAD_NOISE_RATIO = 0.15;
const MIN_VALID_STRUCTURE_COUNT = 2;

const TOP_LEVEL_HEADING_REGEXES = [
  /^\d+\.\s+.+$/,
  /^Clause\s+\d+\b.*$/i,
  /^Section\s+\d+\b.*$/i,
];

const DECIMAL_HEADING_REGEX = /^\d+\.\d+[A-Za-z()]*\s+.+$/;
const NUMBER_ONLY_HEADING_REGEX = /^\d+\.$/;
const CLAUSE_SECTION_ONLY_REGEX = /^(Clause|Section)\s+\d+\b\.?$/i;
const ALL_CAPS_HEADING_REGEX = /^[A-Z][A-Z\s&/-]{2,}$/;

const NOISE_CHAR_REGEX = new RegExp(
  String.raw`[^\p{L}\p{N}\s.,;:'"“”‘’()\[\]{}/&_%$@!?#+*=<>-]`,
  "gu"
);

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function getLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter(Boolean);
}

function isTopLevelHeading(line) {
  return TOP_LEVEL_HEADING_REGEXES.some((regex) => regex.test(line));
}

function isNumberOnlyHeading(line) {
  return (
    NUMBER_ONLY_HEADING_REGEX.test(line) || CLAUSE_SECTION_ONLY_REGEX.test(line)
  );
}

function isLikelyHeadingText(line) {
  if (!line) return false;
  if (ALL_CAPS_HEADING_REGEX.test(line)) return true;
  const words = line.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 12 && line.length <= 120;
}

function hasSubstantialBody(line) {
  if (!line) return false;
  const words = line.split(/\s+/).filter(Boolean);
  return line.length >= 40 || words.length >= 8;
}

function countValidStructureStarts(lines, repeatedChrome = new Set()) {
  let count = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (repeatedChrome.has(line)) continue;

    if (isTopLevelHeading(line)) {
      count += 1;
      continue;
    }

    if (DECIMAL_HEADING_REGEX.test(line)) {
      continue;
    }

    if (isNumberOnlyHeading(line)) {
      let headingLine = "";
      let seen = 0;

      for (let j = i + 1; j < lines.length && seen < 2; j += 1) {
        const nextLine = lines[j];
        if (!nextLine || repeatedChrome.has(nextLine)) continue;
        seen += 1;
        if (isLikelyHeadingText(nextLine)) {
          headingLine = nextLine;
          break;
        }
      }

      if (headingLine) {
        count += 1;
      }
      continue;
    }

    if (ALL_CAPS_HEADING_REGEX.test(line) && !repeatedChrome.has(line)) {
      const nextLine = lines[i + 1];
      if (hasSubstantialBody(nextLine)) {
        count += 1;
      }
    }
  }

  return count;
}

function calculateShortLineRatio(lines) {
  if (!lines.length) return 0;
  const shortLineCount = lines.filter((line) => line.length < 40).length;
  return shortLineCount / lines.length;
}

function calculateNoiseRatio(text) {
  const source = String(text || "");
  if (!source) return 0;
  const matches = source.match(NOISE_CHAR_REGEX) || [];
  return matches.length / source.length;
}

function detectRepeatedHeadersFooters(pages) {
  if (!Array.isArray(pages) || pages.length < 3) {
    return { repeated: false, repeatedLines: new Set() };
  }

  const counts = new Map();

  pages.forEach((pageText) => {
    const pageLines = getLines(pageText);
    const candidateLines = [
      ...pageLines.slice(0, 2),
      ...pageLines.slice(Math.max(pageLines.length - 2, 0)),
    ].filter((line) => line.length >= 4);

    const uniqueCandidates = new Set(candidateLines);
    uniqueCandidates.forEach((line) => {
      counts.set(line, (counts.get(line) || 0) + 1);
    });
  });

  const repeatedLines = new Set(
    Array.from(counts.entries())
      .filter(([, count]) => count >= 3)
      .map(([line]) => line)
  );

  return {
    repeated: repeatedLines.size > 0,
    repeatedLines,
  };
}

function getBadReason({
  textLength,
  shortLineRatio,
  noiseRatio,
  headingCount,
}) {
  if (textLength < BAD_TEXT_LENGTH) {
    return "This document is too short to analyze reliably.";
  }

  if (shortLineRatio > BAD_SHORT_LINE_RATIO) {
    return "This document has fragmented line structure and cannot be analyzed reliably.";
  }

  if (noiseRatio > BAD_NOISE_RATIO) {
    return "This document appears garbled or poorly extracted.";
  }

  if (headingCount < MIN_VALID_STRUCTURE_COUNT) {
    return "No reliable section headings or numbering detected.";
  }

  return "This document has weak or unreliable structure.";
}

function getWarningReason({
  textTooShort,
  tooManyShortLines,
  repeatedHeadersFooters,
  weirdCharacterNoise,
}) {
  if (textTooShort) {
    return "This document is shorter than ideal. Results may be less reliable.";
  }

  if (repeatedHeadersFooters) {
    return "Repeated headers or footers were detected. Results may be less reliable.";
  }

  if (tooManyShortLines) {
    return "This document has fragmented line structure. Results may be less reliable.";
  }

  if (weirdCharacterNoise) {
    return "This document contains extraction noise. Results may be less reliable.";
  }

  return "";
}

export function evaluateDocumentQuality({
  text,
  pages = [],
  documentId,
  blocks = [],
} = {}) {
  const normalizedText = String(text || "").trim();
  const lines = getLines(normalizedText);
  const shortLineRatio = calculateShortLineRatio(lines);
  const noiseRatio = calculateNoiseRatio(normalizedText);
  const repeatedChrome = detectRepeatedHeadersFooters(pages);
  const headingCount = countValidStructureStarts(
    lines,
    repeatedChrome.repeatedLines
  );

  const qualitySignals = {
    textTooShort: normalizedText.length < WARNING_TEXT_LENGTH,
    tooManyShortLines: shortLineRatio > WARNING_SHORT_LINE_RATIO,
    repeatedHeadersFooters: repeatedChrome.repeated,
    numberingOrHeadingsFound: headingCount > 0,
    weirdCharacterNoise: noiseRatio > WARNING_NOISE_RATIO,
  };

  const qualityMetrics = {
    shortLineRatio: Number(shortLineRatio.toFixed(2)),
    noiseRatio: Number(noiseRatio.toFixed(2)),
    headingCount,
  };

  const isBad =
    normalizedText.length < BAD_TEXT_LENGTH ||
    shortLineRatio > BAD_SHORT_LINE_RATIO ||
    noiseRatio > BAD_NOISE_RATIO ||
    headingCount < MIN_VALID_STRUCTURE_COUNT;

  if (isBad) {
    return createPreprocessResult({
      documentId,
      quality: PREPROCESS_QUALITY.BAD,
      qualityReason: getBadReason({
        textLength: normalizedText.length,
        shortLineRatio,
        noiseRatio,
        headingCount,
      }),
      qualitySignals,
      qualityMetrics,
      blocks: [],
    });
  }

  const isWarning =
    qualitySignals.textTooShort ||
    shortLineRatio > WARNING_SHORT_LINE_RATIO ||
    repeatedChrome.repeated ||
    noiseRatio > WARNING_NOISE_RATIO;

  return createPreprocessResult({
    documentId,
    quality: isWarning ? PREPROCESS_QUALITY.WARNING : PREPROCESS_QUALITY.GOOD,
    qualityReason: isWarning
      ? getWarningReason({
          textTooShort: qualitySignals.textTooShort,
          tooManyShortLines: qualitySignals.tooManyShortLines,
          repeatedHeadersFooters: qualitySignals.repeatedHeadersFooters,
          weirdCharacterNoise: qualitySignals.weirdCharacterNoise,
        })
      : "",
    qualitySignals,
    qualityMetrics,
    blocks,
  });
}
