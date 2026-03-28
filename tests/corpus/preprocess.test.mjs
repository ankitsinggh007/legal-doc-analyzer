import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { getCorpusDir, preprocessCorpusDocument } from "./helpers/preprocessCorpusDocument.mjs";

const manifestPath = new URL("./manifest.json", import.meta.url);
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const corpusDir = getCorpusDir();

for (const doc of manifest.documents) {
  if (doc.enabled === false) {
    continue;
  }

  test(`preprocess corpus: ${doc.file}`, async (t) => {
    const filePath = path.join(corpusDir, doc.file);

    try {
      await fs.access(filePath);
    } catch {
      t.skip(`Missing corpus file: ${filePath}`);
      return;
    }

    let preprocessResult;

    try {
      ({ preprocessResult } = await preprocessCorpusDocument(doc.file));
    } catch (error) {
      if (doc.expectedErrorContains) {
        assert.match(
          error.message,
          new RegExp(doc.expectedErrorContains, "i"),
          `Expected parse error containing "${doc.expectedErrorContains}" for ${doc.file}`
        );
        return;
      }

      throw error;
    }

    if (doc.expectedErrorContains) {
      assert.fail(
        `Expected parse error containing "${doc.expectedErrorContains}" for ${doc.file}, but preprocessing succeeded`
      );
    }

    if (doc.expectedQuality) {
      assert.equal(
        preprocessResult.quality,
        doc.expectedQuality,
        `Expected quality ${doc.expectedQuality} for ${doc.file}`
      );
    }

    if (doc.blockCountRange) {
      assert.ok(
        preprocessResult.blocks.length >= doc.blockCountRange.min,
        `Expected at least ${doc.blockCountRange.min} blocks for ${doc.file}, got ${preprocessResult.blocks.length}`
      );
      assert.ok(
        preprocessResult.blocks.length <= doc.blockCountRange.max,
        `Expected at most ${doc.blockCountRange.max} blocks for ${doc.file}, got ${preprocessResult.blocks.length}`
      );
    }

    if (Array.isArray(doc.requiredLabels) && doc.requiredLabels.length > 0) {
      const labels = new Set(preprocessResult.blocks.map((block) => block.sectionLabel));

      for (const requiredLabel of doc.requiredLabels) {
        assert.ok(
          labels.has(requiredLabel),
          `Missing required label "${requiredLabel}" for ${doc.file}`
        );
      }
    }

    if (
      Array.isArray(doc.textStartsWithOwnLabelBlockIds) &&
      doc.textStartsWithOwnLabelBlockIds.length > 0
    ) {
      const blocksById = new Map(
        preprocessResult.blocks.map((block) => [block.blockId, block])
      );

      for (const blockId of doc.textStartsWithOwnLabelBlockIds) {
        const block = blocksById.get(blockId);
        assert.ok(block, `Missing block "${blockId}" for ${doc.file}`);
        assert.ok(
          block.text.startsWith(block.sectionLabel),
          `Expected ${doc.file} ${blockId} text to start with its sectionLabel`
        );
      }
    }

    if (
      Array.isArray(doc.forbiddenLabelPrefixes) &&
      doc.forbiddenLabelPrefixes.length > 0
    ) {
      for (const forbiddenPrefix of doc.forbiddenLabelPrefixes) {
        const normalizedPrefix = forbiddenPrefix.toLowerCase();
        const offendingBlock = preprocessResult.blocks.find((block) =>
          block.sectionLabel.toLowerCase().startsWith(normalizedPrefix)
        );

        assert.equal(
          offendingBlock,
          undefined,
          `Found forbidden label prefix "${forbiddenPrefix}" in ${doc.file}`
        );
      }
    }
  });
}
