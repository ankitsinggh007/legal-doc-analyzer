// escapeHTML ensures we never inject untrusted HTML
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * highlightClauses()
 * Injects <span> highlights into the text based on clause start/end positions.
 * NOTE: For real AI integration, ensure offsets match unescaped text length.
 */
// ⚠️ Mock clause indices may visually misalign after escaping;
// real AI integration will provide correct start/end offsets.

export function highlightClauses(text, clauses, activeTypes) {
  if (!clauses?.length) return escapeHTML(text);

  const fragments = [];
  let lastIndex = 0;
  const safeText = escapeHTML(text); // 🔹 escape once

  clauses.forEach(({ start, end, type }) => {
    // TODO: Validate AI clause offsets after real model integration
    start = Math.max(0, start);
    end = Math.min(safeText.length, end);
    if (!activeTypes.has(type)) return;
    if (start > lastIndex) fragments.push(safeText.slice(lastIndex, start));

    fragments.push(
      `<mark class="highlight-${type.toLowerCase()}" tabindex="0" aria-label="${type} clause">
     ${safeText.slice(start, end)}
   </mark>`
    );

    lastIndex = end;
  });

  if (lastIndex < safeText.length) fragments.push(safeText.slice(lastIndex));
  return fragments.join("");
}
