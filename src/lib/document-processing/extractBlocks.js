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

function findTopLevelStart(lines, startIndex) {
  const current = lines[startIndex];
  if (!current) return null;

  if (IGNORED_SECTION_REGEX.test(current.text)) {
    return { type: "ignored", label: current.text, lineIndex: startIndex };
  }

  if (isTopLevelHeading(current.text)) {
    return { type: "block", label: current.text, lineIndex: startIndex };
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

      if (isLikelyHeadingText(candidate.text)) {
        return {
          type: "block",
          label: `${current.text} ${candidate.text}`.trim(),
          lineIndex: startIndex,
          mergedUntil: i,
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
  mergedUntil
) {
  const blockLines = [];
  let bodyStarted = false;

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
      start.mergedUntil
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
