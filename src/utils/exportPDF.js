import html2pdf from "html2pdf.js";
import { segmentText } from "@/utils/segmentText";
import { getClauseColor, getRiskStyle } from "@/utils/clauseStyles";

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Generates a print-ready PDF:
 * Header → Analyzed contract (with line highlights) → Clause list → Risk summary
 */
export async function exportPDF({
  fileName,
  clauses,
  summary,
  parsedText,
  segments,
  date = new Date(),
  setToast,
}) {
  try {
    if (!parsedText && !segments?.length) {
      throw new Error("No contract text to export.");
    }

    const normalizedSegments = segments?.length
      ? segments
      : segmentText(parsedText || "");

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

    const clauseBySegment = new Map();
    (clauses || []).forEach((clause) => {
      const ids = Array.isArray(clause?.citations) ? clause.citations : [];
      ids.forEach((id) => {
        if (!clauseBySegment.has(id)) clauseBySegment.set(id, clause);
      });
    });

    const segmentHtml = normalizedSegments
      .map((segment) => {
        const clause = clauseBySegment.get(segment.id);
        const colors = clause ? getClauseColor(clause.type) : null;
        const style = clause
          ? `background:${colors.bg};color:${colors.text};border-left:4px solid ${colors.border};`
          : "border-left:4px solid transparent;";
        return `<p class="segment" style="${style}"><span class="seg-id">[${segment.id}]</span>${escapeHtml(
          segment.text
        )}</p>`;
      })
      .join("");

    const clauseCounts = (clauses || []).reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {});

    const clauseList = (clauses || [])
      .map((clause) => {
        const riskStyle = getRiskStyle(clause.risk);
        const citationText = clause.citations?.length
          ? clause.citations.join(", ")
          : "None";
        return `
          <div class="clause-item">
            <div class="clause-title">
              <strong>${clause.type}</strong>
              <span class="risk-pill" style="background:${riskStyle.bg};color:${riskStyle.text};border:1px solid ${riskStyle.border};">
                ${clause.risk || "medium"}
              </span>
            </div>
            <div class="clause-text">${escapeHtml(
              clause.explanation || "No explanation provided."
            )}</div>
            <div class="clause-citations">Lines: ${citationText}</div>
          </div>
        `;
      })
      .join("");

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
        .segment {
          padding: 6px 8px;
          border-radius: 4px;
          margin: 8px 0;
        }
        .seg-id {
          font-size: 11px;
          color: #64748b;
          margin-right: 6px;
        }
        .clauses-list { margin-top: 10px; }
        .clause-item { margin-bottom: 12px; page-break-inside: avoid; }
        .clause-title { display: flex; align-items: center; gap: 8px; }
        .clause-text { margin-top: 6px; }
        .clause-citations { margin-top: 6px; font-size: 12px; color: #475569; }
        .risk-pill { font-size: 11px; padding: 2px 6px; border-radius: 999px; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 12px 0; }
        * { page-break-inside: avoid; }
        p, div { page-break-inside: auto; }
      </style>
    `;

    const exportHTML = `
      ${highlightStyle}
      <h1>Legal Document Analyzer</h1>
      <div><strong>File:</strong> ${fileName || "Untitled"}<br/>
      <strong>Exported on:</strong> ${dateStr}</div>
      <hr/>
      <div class="section">
        <h2>Analyzed Contract</h2>
        <div>${segmentHtml}</div>
      </div>
      <div class="section">
        <h2>Clause Details</h2>
        <div class="clauses-list">${clauseList || "No clauses found."}</div>
      </div>
      <div class="section">
        <h2>Risk Summary</h2>
        <p><strong>Detected:</strong> ${
          Object.entries(clauseCounts)
            .map(([type, count]) => `${count} ${type}`)
            .join(", ") || "No clauses"
        }.</p>
        <p style="margin-top:8px;">${
          summary ? escapeHtml(summary) : "No summary available."
        }</p>
      </div>
    `;

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

    if (wasDark) htmlEl.classList.add("dark");
  } catch (err) {
    console.error("❌ PDF export failed:", err);
    setToast?.({ type: "error", msg: err.message });
  }
}
