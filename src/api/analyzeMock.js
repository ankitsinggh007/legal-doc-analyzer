export async function analyzeMock(text, segments = []) {
  // Simulate processing delay
  await new Promise((res) => setTimeout(res, 1200));
  const ids = Array.isArray(segments) ? segments.map((s) => s.id) : [];
  // Return mock analysis results
  return {
    clauses: [
      {
        type: "Termination",
        risk: "medium",
        explanation:
          "Specifies that the contract and all related obligations between the parties are terminated and fully released.",
        citations: ids.slice(0, 2),
      },
      {
        type: "Liability",
        risk: "high",
        explanation:
          "Limits or excludes damages under certain conditions, which may shift risk.",
        citations: ids.slice(2, 4),
      },
      {
        type: "Confidentiality",
        risk: "low",
        explanation:
          "States that information or documents exchanged between the parties must remain confidential and not be disclosed to others.",
        citations: ids.slice(4, 6),
      },
    ],
    summary:
      "Detected key clauses covering termination, liability limits, and confidentiality obligations.",
  };
}
