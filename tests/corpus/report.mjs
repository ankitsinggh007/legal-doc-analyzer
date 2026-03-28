import fs from "node:fs/promises";
import path from "node:path";

import { getCorpusDir, preprocessCorpusDocument } from "./helpers/preprocessCorpusDocument.mjs";

const corpusDir = getCorpusDir();
const entries = await fs.readdir(corpusDir, { withFileTypes: true });
const fileNames = entries
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => /\.(pdf|docx|txt)$/i.test(name))
  .sort((a, b) => a.localeCompare(b));

const report = [];

for (const fileName of fileNames) {
  try {
    const { preprocessResult } = await preprocessCorpusDocument(fileName);
    report.push({
      file: fileName,
      quality: preprocessResult.quality,
      blockCount: preprocessResult.blocks.length,
      firstLabels: preprocessResult.blocks.slice(0, 5).map((block) => block.sectionLabel),
    });
  } catch (error) {
    report.push({
      file: fileName,
      error: error.message,
    });
  }
}

console.log(JSON.stringify(report, null, 2));
