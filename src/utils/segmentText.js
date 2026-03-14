function splitIntoSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [];
}

function getLineSegments(text) {
  const source = text.replace(/\r\n/g, "\n");
  const rawLines = source.split("\n");
  const segments = [];
  let cursor = 0;

  rawLines.forEach((rawLine) => {
    const trimmed = rawLine.trim();
    const startOffset = rawLine.search(/\S/);

    if (trimmed) {
      const startIndex = cursor + Math.max(startOffset, 0);
      segments.push({
        id: segments.length + 1,
        text: trimmed,
        startIndex,
        endIndex: startIndex + trimmed.length - 1,
      });
    }

    cursor += rawLine.length + 1;
  });

  return segments;
}

export function segmentText(text, { maxChunk = 420 } = {}) {
  if (!text || typeof text !== "string") return [];

  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  if (!normalized) return [];

  const lines = getLineSegments(normalized);

  if (lines.length >= 3) {
    return lines;
  }

  const sentences = splitIntoSentences(normalized);
  if (!sentences.length || normalized.length <= maxChunk) {
    return [
      {
        id: 1,
        text: normalized,
        startIndex: 0,
        endIndex: normalized.length - 1,
      },
    ];
  }

  const chunks = [];
  let buffer = "";
  let bufferStart = 0;
  let cursor = 0;
  for (const sentence of sentences) {
    const sentenceStart = normalized.indexOf(sentence, cursor);
    const safeSentenceStart = sentenceStart === -1 ? cursor : sentenceStart;
    const sentenceEnd = safeSentenceStart + sentence.length - 1;

    if (!buffer) {
      buffer = sentence;
      bufferStart = safeSentenceStart;
      cursor = sentenceEnd + 1;
      continue;
    }
    if (buffer.length + sentence.length + 1 > maxChunk) {
      chunks.push({
        text: buffer,
        startIndex: bufferStart,
        endIndex: bufferStart + buffer.length - 1,
      });
      buffer = sentence;
      bufferStart = safeSentenceStart;
    } else {
      buffer = `${buffer} ${sentence}`;
    }
    cursor = sentenceEnd + 1;
  }
  if (buffer) {
    chunks.push({
      text: buffer,
      startIndex: bufferStart,
      endIndex: bufferStart + buffer.length - 1,
    });
  }

  return chunks.map((chunk, idx) => ({ id: idx + 1, ...chunk }));
}
