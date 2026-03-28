import { mapAnalysisResultsToClauses } from "@/utils/mapAnalysisResults";

export async function analyzeMock({ documentId, blocks = [] }) {
  // Simulate processing delay
  await new Promise((res) => setTimeout(res, 1200));
  const sourceBlocks = Array.isArray(blocks) ? blocks.slice(0, 4) : [];
  const results = sourceBlocks.map((block, index) => {
    if (index === 0) {
      return {
        blockId: block.blockId,
        classification: "clause_flagged",
        clauseType: "Termination",
        riskLevel: "medium",
        riskFlag: "medium",
        title: "Early termination clause",
        explanation:
          "Defines how the agreement can end and what notice or breach conditions apply.",
      };
    }

    if (index === 1) {
      return {
        blockId: block.blockId,
        classification: "clause_no_issue",
        clauseType: "Fees",
        riskLevel: "none",
        riskFlag: "none",
        title: "",
        explanation: "No notable issue detected.",
      };
    }

    if (index === 2) {
      return {
        blockId: block.blockId,
        classification: "noise",
        clauseType: "",
        riskLevel: "none",
        riskFlag: "none",
        title: "",
        explanation: "No clause detected.",
      };
    }

    return {
      blockId: block.blockId,
      classification: "clause_flagged",
      clauseType: "Confidentiality",
      riskLevel: "low",
      riskFlag: "low",
      title: "Confidentiality obligation",
      explanation:
        "Restricts disclosure and use of confidential information shared under the agreement.",
    };
  });

  return {
    documentId,
    results,
    clauses: mapAnalysisResultsToClauses(results, blocks),
    summary:
      "Detected flagged clauses covering termination and confidentiality, while other sampled blocks were either benign or non-clause content.",
  };
}
