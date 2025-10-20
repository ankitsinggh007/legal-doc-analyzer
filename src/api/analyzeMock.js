export async function analyzeMock(text) {
  console.log("🧠 Mock AI analyzing text...", text);
  // Simulate processing delay
  await new Promise((res) => setTimeout(res, 1200));
  // Return mock analysis results
  return {
    clauses: [
      {
        type: "Termination",
        start: 520,
        end: 910,
        explanation:
          "Specifies that the contract and all related obligations between the parties are terminated and fully released.",
      },
      {
        type: "Penalty",
        start: 920,
        end: 1180,
        explanation:
          "Clarifies that neither party admits liability or wrongdoing, indicating that no penalty or compensation is owed.",
      },
      {
        type: "Confidentiality",
        start: 2230,
        end: 2450,
        explanation:
          "States that information or documents exchanged between the parties must remain confidential and not be disclosed to others.",
      },
      {
        type: "Termination",
        start: 1450,
        end: 1750,
        explanation:
          "Mentions that either party may provide further documents to confirm the effective termination of the contract.",
      },
      {
        type: "Penalty",
        start: 2600,
        end: 2830,
        explanation:
          "Outlines possible financial consequences if any clause of this agreement is violated or disregarded.",
      },
      {
        type: "Confidentiality",
        start: 3100,
        end: 3400,
        explanation:
          "Emphasizes that all notices and communications are to be handled privately and securely.",
      },
      {
        type: "Termination",
        start: 3550,
        end: 3900,
        explanation:
          "Declares that this document serves as the entire and final agreement between both parties, confirming closure of previous arrangements.",
      },
    ],
    summary:
      "Detected 7 clauses — 3 Termination, 2 Penalty, and 2 Confidentiality — covering contract closure, non-liability, and confidentiality obligations.",
  };
}
