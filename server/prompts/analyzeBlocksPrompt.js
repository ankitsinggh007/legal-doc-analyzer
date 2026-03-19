const RESPONSE_CONTRACT = `Return valid JSON only. Do not use markdown. Do not include any text before or after the JSON.

Return one JSON object with this shape:
{
  "results": [
    {
      "blockId": "exact block id from input",
      "classification": "clause_flagged",
      "clauseType": "Confidentiality",
      "riskLevel": "medium",
      "title": "Broad confidentiality obligation",
      "explanation": "1-2 sentences about that block only"
    }
  ],
  "summary": "2-4 sentence document summary focused on flagged clauses"
}`;

const FIELD_RULES = [
  "results: array of zero or more result objects",
  "blockId: must exactly match a blockId from input",
  'classification: must be exactly one of "clause_flagged", "clause_no_issue", or "noise"',
  "clauseType: required for clause_flagged, optional for clause_no_issue, empty for noise",
  'riskLevel: must be exactly one of "none", "low", "medium", or "high"',
  "title: required for clause_flagged, empty for clause_no_issue and noise",
  "explanation: required for every result and must describe only that block",
  "summary: concise overall document summary focused on flagged clauses; if no clauses are flagged, say that no notable issues were detected",
].join("\n");

const CLASSIFICATION_RULES = [
  "Use clause_flagged when the block is a substantive clause with a notable legal or business concern.",
  "Use clause_no_issue when the block is a substantive clause but no notable issue is detected.",
  "Use noise when the block is clearly not a substantive clause, such as headers, footers, signature fragments, page artifacts, or non-clause administrative text.",
  "For clause_flagged, clauseType, riskLevel, title, and explanation must all be meaningful.",
  "For clause_no_issue, riskLevel must be none.",
  "For noise, riskLevel must be none, clauseType must be empty, and title must be empty.",
].join("\n");

const COVERAGE_RULES = [
  "Process blocks one by one using blockId.",
  "Use only the exact blockIds from the input.",
  "Do not invent, change, merge, or duplicate blockIds.",
  "Return at most one result per blockId.",
  "Try to classify every block if possible, but do not guess when the block is unclear.",
  "Each explanation must describe only that specific block.",
  "Keep explanations concise and block-specific.",
].join("\n");

const EXAMPLE_OUTPUT = `Example output:
{
  "results": [
    {
      "blockId": "b4",
      "classification": "clause_flagged",
      "clauseType": "Confidentiality",
      "riskLevel": "medium",
      "title": "Broad confidentiality obligation",
      "explanation": "The clause imposes confidentiality duties without clear carve-outs or limits."
    },
    {
      "blockId": "b7",
      "classification": "clause_no_issue",
      "clauseType": "Term",
      "riskLevel": "none",
      "title": "",
      "explanation": "No notable issue detected."
    },
    {
      "blockId": "b11",
      "classification": "noise",
      "clauseType": "",
      "riskLevel": "none",
      "title": "",
      "explanation": "No clause detected."
    }
  ],
  "summary": "The document contains one flagged confidentiality clause with medium risk."
}`;

function buildPromptBody(inputText) {
  return `Preprocessed legal document blocks are provided with stable block IDs in brackets like [b1].
${RESPONSE_CONTRACT}
Field rules:
${FIELD_RULES}
Classification rules:
${CLASSIFICATION_RULES}
Coverage rules:
${COVERAGE_RULES}
${EXAMPLE_OUTPUT}
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
Return valid JSON only.
Use only exact blockIds from the input.
Do not repeat any blockId.
Do not invent blockIds.
If a block is substantive with a notable concern, use clause_flagged.
If a block is substantive with no notable issue, use clause_no_issue.
If a block is not a substantive clause, use noise.
Keep explanations to 1 sentence.`;
}
