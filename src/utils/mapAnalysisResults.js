function getCitationsForBlock(block, segments) {
  if (!block || !Array.isArray(segments)) return [];

  return segments
    .filter((segment) => {
      if (
        typeof segment?.startIndex !== "number" ||
        typeof segment?.endIndex !== "number"
      ) {
        return false;
      }

      return (
        segment.startIndex <= block.endIndex &&
        segment.endIndex >= block.startIndex
      );
    })
    .map((segment) => segment.id);
}

export function mapAnalysisResultsToClauses(results, blocks, segments) {
  if (!Array.isArray(results)) return [];

  const blockMap = new Map(
    (Array.isArray(blocks) ? blocks : []).map((block) => [block.blockId, block])
  );

  return results
    .map((result) => {
      if (!result || typeof result !== "object") return null;

      const type =
        typeof result.clauseType === "string" ? result.clauseType.trim() : "";
      const explanation =
        typeof result.explanation === "string" ? result.explanation.trim() : "";
      const risk =
        typeof result.riskFlag === "string" ? result.riskFlag.trim() : "medium";
      const blockId =
        typeof result.blockId === "string" ? result.blockId.trim() : "";
      const block = blockMap.get(blockId);

      if (!type) return null;

      return {
        blockId,
        type,
        risk,
        explanation,
        citations: getCitationsForBlock(block, segments),
      };
    })
    .filter(Boolean);
}
