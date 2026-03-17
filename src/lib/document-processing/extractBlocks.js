const TOP_LEVEL_HEADING_REGEXES = [
  /^\d+\.\s+.+$/,
  /^Clause\s+\d+\b.*$/i,
  /^Section\s+\d+\b.*$/i,
];

const DECIMAL_HEADING_REGEX = /^\d+\.\d+[A-Za-z()]*\s+.+$/;
const NUMBER_ONLY_HEADING_REGEX = /^\d+\.$/;
const CLAUSE_SECTION_ONLY_REGEX = /^(Clause|Section)\s+\d+\b\.?$/i;
const ALL_CAPS_HEADING_REGEX = /^[A-Z][A-Z\s&/-]{2,}$/;
const IGNORED_SECTION_REGEX = /^(Schedule|Annexure|Exhibit|Appendix)\b/i;
const NUMBERED_LINE_REGEX = /^(\d+\.)\s+(.+)$/;
const CLAUSE_SECTION_LINE_REGEX = /^((?:Clause|Section)\s+\d+\b\.?)\s+(.+)$/i;
const INLINE_SPLIT_REGEX = /^(.{1,100}?)[.:;]\s+(.+)$/;
const BODY_START_REGEX =
  /^(that|the|if|in|within|where|when|upon|all|either|each|party|tenant|landlord|lessee|lessor|owner|consultant|employee|company|receiving|disclosing|for|this|any|neither)\b/i;
const EARLY_BODY_VERB_REGEX =
  /\b(shall|must|will|may|agrees?|undertakes?|means|includes?|constitutes?)\b/i;
const DEFINITION_MARKER_REGEX =
  /\b(means|shall mean|is defined as|refers to)\b/i;

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function getLinesWithOffsets(text) {
  const source = String(text || "");
  const lines = [];
  const regex = /([^\n]*)(\n|$)/g;
  let match;

  while ((match = regex.exec(source)) !== null) {
    const rawLine = match[1];
    const normalized = normalizeLine(rawLine);

    if (normalized) {
      const leadingWhitespace = rawLine.match(/^\s*/)?.[0].length || 0;
      const startIndex = match.index + leadingWhitespace;
      const endIndex = startIndex + normalized.length;

      lines.push({
        raw: rawLine,
        text: normalized,
        startIndex,
        endIndex,
      });
    }

    if (match[0] === "") break;
  }

  return lines;
}

function isTopLevelHeading(line) {
  return TOP_LEVEL_HEADING_REGEXES.some((regex) => regex.test(line));
}

function isNumberOnlyHeading(line) {
  return (
    NUMBER_ONLY_HEADING_REGEX.test(line) || CLAUSE_SECTION_ONLY_REGEX.test(line)
  );
}

function isLikelyHeadingText(line) {
  if (!line) return false;
  if (ALL_CAPS_HEADING_REGEX.test(line)) return true;
  const words = line.split(/\s+/).filter(Boolean);
  return words.length >= 1 && words.length <= 12 && line.length <= 120;
}

function hasSubstantialBody(line) {
  if (!line) return false;
  const words = line.split(/\s+/).filter(Boolean);
  return line.length >= 40 || words.length >= 8;
}

function isLikelyBodyText(line) {
  if (!line) return false;

  const normalized = normalizeLine(line);
  const words = normalized.split(/\s+/).filter(Boolean);
  const leadingWindow = words.slice(0, 12).join(" ");

  return (
    (BODY_START_REGEX.test(normalized) ||
      EARLY_BODY_VERB_REGEX.test(leadingWindow)) &&
    hasSubstantialBody(normalized)
  );
}

function isLikelyInlineHeading(line) {
  if (!line) return false;

  const normalized = normalizeLine(line);
  const words = normalized.split(/\s+/).filter(Boolean);

  return (
    words.length >= 1 &&
    words.length <= 12 &&
    normalized.length <= 100 &&
    !DEFINITION_MARKER_REGEX.test(normalized) &&
    !EARLY_BODY_VERB_REGEX.test(normalized)
  );
}

function isDefinitionStyleBody(line) {
  if (!line) return false;
  return DEFINITION_MARKER_REGEX.test(line);
}

function splitInlineClauseStart(line) {
  const normalized = normalizeLine(line);
  if (!normalized) {
    return { sectionLabel: "", inlineBodyText: "" };
  }

  const prefixedMatch =
    normalized.match(NUMBERED_LINE_REGEX) ||
    normalized.match(CLAUSE_SECTION_LINE_REGEX);

  if (prefixedMatch) {
    const prefix = normalizeLine(prefixedMatch[1]);
    const remainder = normalizeLine(prefixedMatch[2]);

    if (!remainder) {
      return { sectionLabel: prefix, inlineBodyText: "" };
    }

    // Definition clauses are body-style clauses, even though they often start
    // with a short phrase before `means` or similar wording.
    if (isDefinitionStyleBody(remainder)) {
      return { sectionLabel: prefix, inlineBodyText: remainder };
    }

    const inlineSplit = remainder.match(INLINE_SPLIT_REGEX);
    if (inlineSplit) {
      const heading = normalizeLine(inlineSplit[1]);
      const body = normalizeLine(inlineSplit[2]);

      if (isLikelyInlineHeading(heading) && isLikelyBodyText(body)) {
        return {
          sectionLabel: `${prefix} ${heading}`.trim(),
          inlineBodyText: body,
        };
      }
    }

    if (isLikelyBodyText(remainder)) {
      return { sectionLabel: prefix, inlineBodyText: remainder };
    }

    return { sectionLabel: normalized, inlineBodyText: "" };
  }

  const inlineSplit = normalized.match(INLINE_SPLIT_REGEX);
  if (inlineSplit) {
    const heading = normalizeLine(inlineSplit[1]);
    const body = normalizeLine(inlineSplit[2]);

    if (
      isLikelyInlineHeading(heading) &&
      isLikelyBodyText(body) &&
      !isDefinitionStyleBody(normalized)
    ) {
      return {
        sectionLabel: heading,
        inlineBodyText: body,
      };
    }
  }

  return { sectionLabel: normalized, inlineBodyText: "" };
}

function findTopLevelStart(lines, startIndex) {
  const current = lines[startIndex];
  if (!current) return null;

  if (IGNORED_SECTION_REGEX.test(current.text)) {
    return { type: "ignored", label: current.text, lineIndex: startIndex };
  }

  if (isTopLevelHeading(current.text)) {
    const parsed = splitInlineClauseStart(current.text);

    return {
      type: "block",
      label: parsed.sectionLabel || current.text,
      lineIndex: startIndex,
      inlineBodyText: parsed.inlineBodyText || "",
    };
  }

  if (DECIMAL_HEADING_REGEX.test(current.text)) {
    return null;
  }

  if (isNumberOnlyHeading(current.text)) {
    let seen = 0;
    for (let i = startIndex + 1; i < lines.length && seen < 2; i += 1) {
      const candidate = lines[i];
      if (!candidate?.text) continue;
      seen += 1;

      if (IGNORED_SECTION_REGEX.test(candidate.text)) {
        return null;
      }

      const parsedCandidate = splitInlineClauseStart(candidate.text);
      if (isLikelyHeadingText(parsedCandidate.sectionLabel || candidate.text)) {
        return {
          type: "block",
          label:
            `${current.text} ${parsedCandidate.sectionLabel || candidate.text}`.trim(),
          lineIndex: startIndex,
          mergedUntil: i,
          inlineBodyText: parsedCandidate.inlineBodyText || "",
        };
      }
    }
  }

  if (ALL_CAPS_HEADING_REGEX.test(current.text)) {
    const nextLine = lines[startIndex + 1]?.text || "";
    if (hasSubstantialBody(nextLine)) {
      return { type: "block", label: current.text, lineIndex: startIndex };
    }
  }

  return null;
}

function collectBlockText(
  lines,
  startLineIndex,
  endLineIndex,
  label,
  mergedUntil,
  inlineBodyText = ""
) {
  const blockLines = [];
  let bodyStarted = false;

  if (inlineBodyText) {
    blockLines.push(inlineBodyText);
    bodyStarted = true;
  }

  for (let i = startLineIndex; i < endLineIndex; i += 1) {
    if (mergedUntil !== undefined && i > startLineIndex && i <= mergedUntil) {
      continue;
    }

    const line = lines[i];
    if (!line?.text) continue;

    if (!bodyStarted) {
      if (i === startLineIndex) continue;
      if (mergedUntil !== undefined && i === mergedUntil) continue;
      bodyStarted = true;
    }

    blockLines.push(line.text);
  }

  const text = blockLines.join(" ").replace(/\s+/g, " ").trim();

  return {
    sectionLabel: label,
    text,
  };
}

export function extractBlocks(text) {
  const lines = getLinesWithOffsets(text);
  const blocks = [];

  let activeIgnoredSection = false;

  for (let i = 0; i < lines.length; i += 1) {
    const start = findTopLevelStart(lines, i);

    if (!start) {
      continue;
    }

    if (start.type === "ignored") {
      activeIgnoredSection = true;
      continue;
    }

    if (activeIgnoredSection) {
      activeIgnoredSection = false;
    }

    let nextStartIndex = lines.length;

    for (let j = (start.mergedUntil ?? i) + 1; j < lines.length; j += 1) {
      const nextStart = findTopLevelStart(lines, j);
      if (!nextStart) continue;
      nextStartIndex = j;
      break;
    }

    const { sectionLabel, text: blockText } = collectBlockText(
      lines,
      i,
      nextStartIndex,
      start.label,
      start.mergedUntil,
      start.inlineBodyText
    );

    if (!blockText) {
      continue;
    }

    const startIndex = lines[i].startIndex;
    const endIndex = lines[Math.max(nextStartIndex - 1, i)].endIndex;

    blocks.push({
      blockId: `b${blocks.length + 1}`,
      sectionLabel,
      text: blockText,
      startIndex,
      endIndex,
      blockType: "top_level_clause_block",
    });

    i = Math.max(i, nextStartIndex - 1);
  }

  return blocks;
}
