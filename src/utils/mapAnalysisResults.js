export function mapAnalysisResultsToClauses(results, blocks) {
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

      if (!type) return null;

      return {
        blockId: blockMap.has(blockId) ? blockId : "",
        type,
        risk,
        explanation,
      };
    })
    .filter(Boolean);
}
