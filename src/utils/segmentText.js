function splitIntoSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [];
}

export function segmentText(text, { maxChunk = 420 } = {}) {
  if (!text || typeof text !== "string") return [];

  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  if (!normalized) return [];

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 3) {
    return lines.map((line, idx) => ({ id: idx + 1, text: line }));
  }

  const sentences = splitIntoSentences(normalized);
  if (!sentences.length || normalized.length <= maxChunk) {
    return [{ id: 1, text: normalized }];
  }

  const chunks = [];
  let buffer = "";
  for (const sentence of sentences) {
    if (!buffer) {
      buffer = sentence;
      continue;
    }
    if (buffer.length + sentence.length + 1 > maxChunk) {
      chunks.push(buffer);
      buffer = sentence;
    } else {
      buffer = `${buffer} ${sentence}`;
    }
  }
  if (buffer) chunks.push(buffer);

  return chunks.map((chunk, idx) => ({ id: idx + 1, text: chunk }));
}
