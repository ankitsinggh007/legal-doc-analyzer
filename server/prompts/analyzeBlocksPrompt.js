const RESPONSE_CONTRACT = `Return one JSON object with this shape:
{
  "results": [
    {
      "blockId": "exact block id from input",
      "clauseType": "Termination",
      "riskFlag": "low",
      "explanation": "1-2 sentences about that block only"
    }
  ],
  "summary": "2-4 sentence document summary"
}`;

const FIELD_RULES = [
  "results: array of zero or more result objects",
  "blockId: must exactly match a blockId from input",
  "clauseType: use a specific clause label such as Engagement, Term, Payment, Duties, Confidentiality, Intellectual Property, Termination, Liability, Indemnity, Warranty, Notices, Dispute Resolution, Governing Law, Assignment, Use of Premises, or Other",
  'riskFlag: must be exactly one of "low", "medium", or "high"',
  "explanation: must describe only that block, not the whole document",
  "summary: concise overall document summary",
].join("\n");

const COVERAGE_RULES = [
  "Process blocks one by one using blockId.",
  "Return one result for each block you can classify as a substantive legal clause.",
  "If a block is substantive but does not fit a known clause type, use Other.",
  "Do not invent, change, merge, or duplicate blockIds.",
  "Return at most one result per blockId.",
  "If X no. of  blocks are present, return X no. of  results.",
  "Do not choose only one block when several blocks are classifiable.",
  "Each explanation must describe only that specific block.",
  "Keep explanations concise and block-specific.",
].join("\n");

const MULTI_RESULT_EXAMPLE = `Example output when multiple substantive blocks are present:
{
  "results": [
    {
      "blockId": "b4",
      "clauseType": "Engagement",
      "riskFlag": "low",
      "explanation": "Defines the consultant's engagement scope and service expectations."
    },
    {
      "blockId": "b6",
      "clauseType": "Payment",
      "riskFlag": "medium",
      "explanation": "Sets out fees, reimbursement, and tax deductions, which may affect payment disputes."
    },
    {
      "blockId": "b9",
      "clauseType": "Confidentiality",
      "riskFlag": "medium",
      "explanation": "Restricts disclosure and use of confidential information and provides remedies for breach."
    }
  ],
  "summary": "This agreement covers engagement scope, payment, confidentiality, IP ownership, termination, and related legal protections."
}`;

const EMPTY_RESULT_EXAMPLE = `Example output when no substantive legal blocks should be classified:
{
  "results": [],
  "summary": "No substantive legal clause blocks were identified from the provided input."
}`;

function buildPromptBody(inputText) {
  return `Preprocessed legal document blocks are provided with stable block IDs in brackets like [b1].
${RESPONSE_CONTRACT}
Field rules:
${FIELD_RULES}
Coverage rules:
${COVERAGE_RULES}
${MULTI_RESULT_EXAMPLE}
${EMPTY_RESULT_EXAMPLE}
Blocks:
"""${inputText}"""`;
}

export function buildAnalyzeBlocksPrompt(inputText) {
  return buildPromptBody(inputText);
}

export function buildAnalyzeBlocksRetryPrompt(inputText, issue = "") {
  const issueText = issue
    ? `The previous response failed validation: ${issue}\n`
    : "";

  return `${buildPromptBody(inputText)}

${issueText}The previous response was incomplete or invalid.
Use only exact blockIds from the input.
Do not repeat any blockId.
Multiple substantive blocks are present.
Return broader block coverage across the document.
Do not collapse the document into one general summary result.
Limit to the 6 most important substantive blocks. Keep explanations to 1 sentence.`;
}
