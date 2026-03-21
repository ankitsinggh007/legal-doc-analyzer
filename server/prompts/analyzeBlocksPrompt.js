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
      "blockId": "b1",
      "classification": "clause_flagged",
      "clauseType": "Confidentiality",
      "riskLevel": "medium",
      "title": "Broad confidentiality obligation",
      "explanation": "The clause imposes confidentiality duties without clear carve-outs or limits."
    },
    {
      "blockId": "b2",
      "classification": "clause_no_issue",
      "clauseType": "Term",
      "riskLevel": "none",
      "title": "",
      "explanation": "No notable issue detected."
    },
    {
      "blockId": "b3",
      "classification": "noise",
      "clauseType": "",
      "riskLevel": "none",
      "title": "",
      "explanation": "No clause detected."
    },......
  ],
  "summary": "summary of all high and medium risks summary ."
}`;

const EXHAUSTIVE_RESPONSE_CONTRACT = `Return valid JSON only. Do not use markdown. Do not include any text before or after the JSON.

Return exactly one JSON object with this shape:
{
  "results": [
    {
      "blockId": "exact block id from input",
      "classification": "clause_flagged",
      "clauseType": "string",
      "riskLevel": "low | medium | high",
      "title": "string",
      "explanation": "string"
    },
    {
      "blockId": "exact block id from input",
      "classification": "clause_no_issue",
      "clauseType": "string",
      "riskLevel": "none"
    },
    {
      "blockId": "exact block id from input",
      "classification": "noise",
      "riskLevel": "none"
    }
  ],
  "summary": "short summary focused only on flagged clauses"
}`;

const EXHAUSTIVE_RULES = [
  "Return exactly one result for every input block.",
  "The number of results must equal the number of input blocks.",
  "Do not omit any block.",
  "Do not invent, merge, or duplicate blockIds.",
  "Use clause_flagged only for substantive clauses with a concrete, notable legal or business concern, burden, ambiguity, or unusually one-sided obligation.",
  "Do not use clause_flagged just because a clause is important, legally operative, or standard.",
  "Use clause_no_issue for substantive clauses that appear standard, balanced, or non-problematic.",
  "Use noise for non-substantive blocks such as headers, footers, signatures, witness details, page artifacts, or other non-clause administrative text.",
  "For clause_flagged, clauseType, title, and explanation must be meaningful, and riskLevel must be low, medium, or high.",
  "For clause_no_issue, include blockId, classification, clauseType, and riskLevel only.",
  "For noise, include blockId, classification, and riskLevel only.",
  "Be conservative when assigning clause_flagged.",
  "Prefer clause_no_issue unless there is a clear reason to flag the clause.",
  "Flag a clause only when there is a real concern such as unusual breadth, clear one-sidedness, strong penalty or liability exposure, vague or ambiguous obligation, operationally burdensome restriction, or material legal disadvantage.",
  "If the clause is standard and commonly expected in this type of agreement, prefer clause_no_issue.",
  "Clauses such as preamble, standard definitions, ordinary return or destruction obligations, governing law, authority to sign, relationship disclaimer, severability, entire agreement, and ordinary notice or termination mechanics should usually be clause_no_issue unless unusually drafted.",
  "Keep the summary concise and focused only on flagged clauses. If none are flagged, say that no notable issues were detected.",
].join("\n");

const EXHAUSTIVE_EXAMPLE_OUTPUT = `Example exhaustive output:
{
  "results": [
    {
      "blockId": "b1",
      "classification": "clause_no_issue",
      "clauseType": "Preamble",
      "riskLevel": "none"
    },
    {
      "blockId": "b2",
      "classification": "clause_flagged",
      "clauseType": "Confidentiality",
      "riskLevel": "medium",
      "title": "Broad confidentiality obligation",
      "explanation": "The clause imposes confidentiality duties without clear carve-outs or limits."
    },
    {
      "blockId": "b3",
      "classification": "noise",
      "riskLevel": "none"
    }
  ],
  "summary": "The document contains one flagged confidentiality clause with medium risk."
}`;

export const ANALYZE_BLOCKS_EXHAUSTIVE_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "legal_block_analysis_exhaustive",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["results", "summary"],
      properties: {
        results: {
          type: "array",
          items: {
            anyOf: [
              {
                type: "object",
                additionalProperties: false,
                required: [
                  "blockId",
                  "classification",
                  "clauseType",
                  "riskLevel",
                  "title",
                  "explanation",
                ],
                properties: {
                  blockId: { type: "string" },
                  classification: {
                    type: "string",
                    enum: ["clause_flagged"],
                  },
                  clauseType: { type: "string" },
                  riskLevel: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                  },
                  title: { type: "string" },
                  explanation: { type: "string" },
                },
              },
              {
                type: "object",
                additionalProperties: false,
                required: [
                  "blockId",
                  "classification",
                  "clauseType",
                  "riskLevel",
                ],
                properties: {
                  blockId: { type: "string" },
                  classification: {
                    type: "string",
                    enum: ["clause_no_issue"],
                  },
                  clauseType: { type: "string" },
                  riskLevel: {
                    type: "string",
                    enum: ["none"],
                  },
                },
              },
              {
                type: "object",
                additionalProperties: false,
                required: ["blockId", "classification", "riskLevel"],
                properties: {
                  blockId: { type: "string" },
                  classification: {
                    type: "string",
                    enum: ["noise"],
                  },
                  riskLevel: {
                    type: "string",
                    enum: ["none"],
                  },
                },
              },
            ],
          },
        },
        summary: { type: "string" },
      },
    },
  },
};

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

function buildExhaustivePromptBody(inputText) {
  return `Preprocessed legal document blocks are provided with stable block IDs in brackets like [b1].
${EXHAUSTIVE_RESPONSE_CONTRACT}
Rules:
${EXHAUSTIVE_RULES}
${EXHAUSTIVE_EXAMPLE_OUTPUT}
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

export function buildExhaustiveAnalyzeBlocksPrompt(inputText) {
  return buildExhaustivePromptBody(inputText);
}

export function buildExhaustiveAnalyzeBlocksRetryPrompt(inputText, issue = "") {
  const issueText = issue
    ? `The previous response failed validation: ${issue}\n`
    : "";

  return `${buildExhaustivePromptBody(inputText)}

${issueText}The previous response was incomplete or invalid.
Return valid JSON only.
Return exactly one result for every input block.
The number of results must equal the number of input blocks.
Do not omit any block.
Do not repeat any blockId.
Do not invent blockIds.
For clause_no_issue, include only blockId, classification, clauseType, and riskLevel.
For noise, include only blockId, classification, and riskLevel.`;
}
