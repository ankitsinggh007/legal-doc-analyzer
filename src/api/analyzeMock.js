import { mapAnalysisResultsToClauses } from "@/utils/mapAnalysisResults";

export async function analyzeMock({ documentId, blocks = [] }) {
  // Simulate processing delay
  await new Promise((res) => setTimeout(res, 1200));
  const sourceBlocks = Array.isArray(blocks) ? blocks.slice(0, 3) : [];
  const results = sourceBlocks.map((block, index) => {
    if (index === 0) {
      return {
        blockId: block.blockId,
        clauseType: "Termination",
        riskFlag: "medium",
        explanation:
          "Defines how the agreement can end and what notice or breach conditions apply.",
      };
    }

    if (index === 1) {
      return {
        blockId: block.blockId,
        clauseType: "Liability",
        riskFlag: "high",
        explanation:
          "Shifts or limits responsibility for losses, which may materially affect legal exposure.",
      };
    }

    return {
      blockId: block.blockId,
      clauseType: "Confidentiality",
      riskFlag: "low",
      explanation:
        "Restricts disclosure and use of confidential information shared under the agreement.",
    };
  });

  return {
    documentId,
    results,
    clauses: mapAnalysisResultsToClauses(results, blocks),
    summary:
      "Detected key clauses covering termination, liability limits, and confidentiality obligations.",
  };
}
