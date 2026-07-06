import { mapAnalysisResultsToClauses } from "@/utils/mapAnalysisResults";

export const SAMPLE_CONTRACT_FILE = {
  name: "Sample SaaS Services Agreement.txt",
  size: 5280,
  type: "text/plain",
  lastModified: 0,
  isDemo: true,
};

export const SAMPLE_CONTRACT_TEXT = `1. Services: Provider will provide implementation, support, and advisory services for Customer's internal software platform as described in the applicable statement of work. Provider may use subcontractors if Provider remains responsible for their performance.

2. Fees and Payment: Customer will pay the fees listed in the statement of work within fifteen days after receiving an invoice. Late payments may accrue interest at 1.5% per month or the maximum amount permitted by law, whichever is lower.

3. Confidentiality: Each party may receive confidential business, technical, or financial information from the other party. The receiving party must protect confidential information using reasonable care and may use it only to perform this agreement. This obligation continues for three years after termination.

4. Data Security: Provider will maintain commercially reasonable administrative, technical, and physical safeguards designed to protect Customer data. Provider must notify Customer without undue delay after confirming unauthorized access to Customer data.

5. Intellectual Property: The Customer owns its pre-existing materials, data, and trademarks. Provider owns its pre-existing tools, templates, know-how, and reusable software components. Deliverables created specifically for Customer will be assigned to Customer after full payment, excluding Provider's background technology.

6. Term and Termination: Either party may terminate this agreement for convenience with thirty days written notice. Provider may suspend services for non-payment after five days written notice. Upon termination, Customer must pay all fees incurred through the effective termination date.

7. Limitation of Liability: The parties agree that, except for payment obligations, confidentiality breaches, and willful misconduct, each party's total liability under this agreement is limited to the fees paid or payable during the three months before the claim arose.

8. Governing Law: This agreement is governed by the laws of the State of California, excluding conflict of law rules. The parties consent to exclusive jurisdiction in state or federal courts located in San Francisco County, California.`;

export function buildSampleAnalysis(preprocessResult) {
  const blocks = Array.isArray(preprocessResult?.blocks)
    ? preprocessResult.blocks
    : [];
  const byLabel = new Map(
    blocks.map((block) => [block.sectionLabel.toLowerCase(), block])
  );
  const findBlock = (label) =>
    byLabel.get(label.toLowerCase()) ||
    blocks.find((block) =>
      block.sectionLabel.toLowerCase().includes(label.toLowerCase())
    );

  const results = [
    {
      blockId: findBlock("1. Services")?.blockId,
      classification: "clause_no_issue",
      clauseType: "Services",
      riskLevel: "none",
      riskFlag: "none",
      title: "",
      explanation:
        "The services clause describes implementation, support, and advisory services without a notable risk flag.",
    },
    {
      blockId: findBlock("2. Fees and Payment")?.blockId,
      classification: "clause_flagged",
      clauseType: "Payment",
      riskLevel: "medium",
      riskFlag: "medium",
      title: "Short payment window and late fees",
      explanation:
        "Payment is due within 15 days and late amounts may accrue monthly interest. Review cash-flow impact and whether the cure period is appropriate.",
    },
    {
      blockId: findBlock("3. Confidentiality")?.blockId,
      classification: "clause_flagged",
      clauseType: "Confidentiality",
      riskLevel: "low",
      riskFlag: "low",
      title: "Confidentiality term is time-limited",
      explanation:
        "The confidentiality obligation lasts three years after termination. Confirm that this is sufficient for trade secrets or sensitive commercial information.",
    },
    {
      blockId: findBlock("6. Term and Termination")?.blockId,
      classification: "clause_flagged",
      clauseType: "Termination",
      riskLevel: "medium",
      riskFlag: "medium",
      title: "Termination for convenience",
      explanation:
        "Either party can terminate on 30 days notice. This is flexible, but may create delivery or transition risk if critical services are interrupted.",
    },
    {
      blockId: findBlock("7. Limitation of Liability")?.blockId,
      classification: "clause_flagged",
      clauseType: "Liability",
      riskLevel: "high",
      riskFlag: "high",
      title: "Low liability cap",
      explanation:
        "The liability cap is limited to three months of fees. This may be too low for data security, service failure, or business interruption exposure.",
    },
    {
      blockId: findBlock("4. Data Security")?.blockId,
      classification: "clause_no_issue",
      clauseType: "Data Security",
      riskLevel: "none",
      riskFlag: "none",
      title: "",
      explanation:
        "The clause includes reasonable safeguards and prompt notice after confirmed unauthorized access.",
    },
    {
      blockId: findBlock("5. Intellectual Property")?.blockId,
      classification: "clause_no_issue",
      clauseType: "Intellectual Property",
      riskLevel: "none",
      riskFlag: "none",
      title: "",
      explanation:
        "The clause separates customer-owned materials from provider background technology and assigns customer-specific deliverables after payment.",
    },
    {
      blockId: findBlock("8. Governing Law")?.blockId,
      classification: "clause_no_issue",
      clauseType: "Governing Law",
      riskLevel: "none",
      riskFlag: "none",
      title: "",
      explanation:
        "The clause identifies California law and a specific venue for disputes.",
    },
  ].filter((result) => result.blockId);

  return {
    results,
    clauses: mapAnalysisResultsToClauses(results, blocks),
    summary:
      "Sample analysis highlights four review areas: a short payment window, a time-limited confidentiality obligation, termination for convenience, and a low liability cap. Data security language appears reasonable but should still be compared against the customer's security requirements.",
  };
}
