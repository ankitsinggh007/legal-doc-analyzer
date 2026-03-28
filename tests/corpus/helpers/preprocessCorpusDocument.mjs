import path from "node:path";
import { fileURLToPath } from "node:url";

import { extractBlocks } from "../../../src/lib/document-processing/extractBlocks.js";
import { evaluateDocumentQuality } from "../../../src/lib/document-processing/qualityGate.js";
import { parseDocumentFromPath } from "./nodeParseDocument.mjs";

const helperDir = path.dirname(fileURLToPath(import.meta.url));
const defaultCorpusDir = path.resolve(helperDir, "../../fixtures/corpus");

function resolveCorpusDir() {
  return path.resolve(process.env.CORPUS_DIR || defaultCorpusDir);
}

export async function preprocessCorpusDocument(fileName) {
  const corpusDir = resolveCorpusDir();
  const filePath = path.join(corpusDir, fileName);
  const parsed = await parseDocumentFromPath(filePath);
  const blocks = extractBlocks(parsed.text);
  const preprocessResult = evaluateDocumentQuality({
    text: parsed.text,
    pages: parsed.pages,
    blocks,
    documentId: `test_${fileName.replace(/[^a-z0-9]+/gi, "_").toLowerCase()}`,
  });

  return {
    fileName,
    filePath,
    parsed,
    preprocessResult,
  };
}

export function getCorpusDir() {
  return resolveCorpusDir();
}
