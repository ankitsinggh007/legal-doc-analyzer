export const PREPROCESS_QUALITY = {
  GOOD: "good",
  WARNING: "warning",
  BAD: "bad",
};

export function createEmptyQualitySignals() {
  return {
    textTooShort: false,
    tooManyShortLines: false,
    repeatedHeadersFooters: false,
    numberingOrHeadingsFound: false,
    weirdCharacterNoise: false,
  };
}

export function createEmptyQualityMetrics() {
  return {
    shortLineRatio: 0,
    noiseRatio: 0,
    headingCount: 0,
  };
}

export function createDocumentId() {
  if (globalThis.crypto?.randomUUID) {
    return `doc_${globalThis.crypto.randomUUID()}`;
  }

  return `doc_${Date.now()}`;
}

export function createPreprocessResult({
  documentId = createDocumentId(),
  quality = PREPROCESS_QUALITY.GOOD,
  qualityReason = "",
  qualitySignals = {},
  qualityMetrics = {},
  blocks = [],
} = {}) {
  return {
    documentId,
    quality,
    qualityReason,
    qualitySignals: {
      ...createEmptyQualitySignals(),
      ...qualitySignals,
    },
    qualityMetrics: {
      ...createEmptyQualityMetrics(),
      ...qualityMetrics,
    },
    blocks: Array.isArray(blocks) ? blocks : [],
  };
}
