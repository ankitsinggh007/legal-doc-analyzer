import html2pdf from "html2pdf.js";

/**
 * Generates a professional, print-ready PDF:
 * Header → Parsed contract (with highlights) → Clause list → Risk summary
 */
// ⚠️ TODO: FIX TEXT OVERLAP ISSUE IN PDF EXPORT
// --------------------------------------------------
// The current html2pdf.js rendering occasionally causes
// overlapping or clipped text at page boundaries when
// highlights (<mark>) are nested or sliced mid-line.
// Root cause: index-based slicing after escaping text
// + inconsistent line wrapping in html2canvas snapshots.
//
// 🧠 Next steps for fix (post-deadline):
// 1. Replace index-based highlighting with token-based spans.
// 2. Use pdfMake or Puppeteer for server-side export (more stable).
// 3. Add font auto-scaling + word boundary protection before slicing.
//
// Temporary workaround: visually acceptable for demo purposes.

export async function exportPDF({
  fileName,
  clauses,
  summary,
  parsedText,
  date = new Date(),
  setToast,
}) {
  try {
    if (!parsedText) throw new Error("No contract text to export.");

    // ✅ Force light mode during export
    const htmlEl = document.documentElement;
    const wasDark = htmlEl.classList.contains("dark");
    if (wasDark) htmlEl.classList.remove("dark");

    // 🔹 Format date
    const dateStr = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // 🔹 Build highlight styles inline for consistent print
    const highlightStyle = `
      <style>
        body {
          font-family: Inter, sans-serif;
          line-height: 1.6;
          color: #111827;
          background: #ffffff;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        h1, h2 { font-weight: 600; margin-bottom: 6px; }
        .section { margin-top: 20px; page-break-inside: avoid; }
        mark {
          display: inline-block;
          white-space: pre-wrap;
          line-height: 1.6;
          padding: 0 2px;
          border-radius: 2px;
          vertical-align: baseline;
        }
        /* 🔹 Clause Colors */
        .highlight-termination { background: #fecaca; color: #7f1d1d; }      /* Red */
        .highlight-penalty { background: #fde68a; color: #78350f; }          /* Amber */
        .highlight-confidentiality { background: #bfdbfe; color: #1e3a8a; }  /* Blue */
        .clauses-list { margin-top: 10px; padding-left: 16px; }
        .clause-item { margin-bottom: 8px; page-break-inside: avoid; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
        * { page-break-inside: avoid; }
        p, div { page-break-inside: auto; }
      </style>
    `;

    // 🔹 Generate highlighted text
    const escaped = parsedText
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    let htmlBody = escaped.replace(/\n\s*\n/g, "<br/><br/>");
    clauses.forEach(({ start, end, type }) => {
      const tag = `mark class="highlight-${type.toLowerCase()}"`;
      htmlBody =
        htmlBody.slice(0, start) +
        `<${tag}>` +
        htmlBody.slice(start, end) +
        `</mark>` +
        htmlBody.slice(end);
    });

    // 🔹 Clause breakdown
    const clauseCounts = clauses.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {});
    const clauseList = clauses
      .map(
        (c) =>
          `<div class="clause-item"><strong>${c.type}</strong>: ${c.explanation}</div>`
      )
      .join("");

    // 🔹 Assemble export HTML
    const exportHTML = `
      ${highlightStyle}
      <h1>Legal Document Analyzer</h1>
      <div><strong>File:</strong> ${fileName || "Untitled"}<br/>
      <strong>Exported on:</strong> ${dateStr}</div>
      <hr/>
      <div class="section">
        <h2>Analyzed Contract</h2>
        <div>${htmlBody}</div>
      </div>
      <div class="section">
        <h2>Clause Details</h2>
        <div class="clauses-list">${clauseList}</div>
      </div>
      <div class="section">
        <h2>Risk Summary</h2>
        <p><strong>Detected:</strong> 
          ${clauseCounts.Termination || 0} Termination, 
          ${clauseCounts.Penalty || 0} Penalty, 
          ${clauseCounts.Confidentiality || 0} Confidentiality clauses.
        </p>
        <p style="margin-top:8px;">${summary || "No summary available."}</p>
      </div>
    `;

    // 🔹 Export configuration
    const options = {
      margin: 0.5,
      filename: `${fileName || "document"}_${Date.now()}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        letterRendering: true,
        useCORS: true,
        scrollY: 0,
      },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    await html2pdf().set(options).from(exportHTML).save();
    setToast?.({ type: "success", msg: "✅ Exported successfully!" });

    // ♻️ Restore user's theme
    if (wasDark) htmlEl.classList.add("dark");
  } catch (err) {
    console.error("❌ PDF export failed:", err);
    setToast?.({ type: "error", msg: err.message });
  }
}
