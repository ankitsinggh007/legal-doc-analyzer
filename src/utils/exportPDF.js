import html2pdf from "html2pdf.js";
import { getClauseColor, getRiskStyle } from "@/utils/clauseStyles";

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getBlockBodyText(block) {
  const sectionLabel = String(block?.sectionLabel || "").trim();
  const text = String(block?.text || "").trim();

  if (!sectionLabel || !text) {
    return text;
  }

  if (!text.startsWith(sectionLabel)) {
    return text;
  }

  return text
    .slice(sectionLabel.length)
    .replace(/^[\s.:;,-]+/, "")
    .trim();
}

function getBlockExportStatus(clause) {
  switch (clause?.classification) {
    case "clause_no_issue":
      return {
        label: "No notable issue detected",
        style: "background:#ecfdf5;color:#166534;border:1px solid #a7f3d0;",
      };
    case "noise":
      return {
        label: "No clause detected",
        style: "background:#f8fafc;color:#475569;border:1px dashed #cbd5e1;",
      };
    case "unclassified":
      return {
        label: "Could not classify. Verify manually",
        style: "background:#fffbeb;color:#92400e;border:1px solid #fcd34d;",
      };
    default:
      return null;
  }
}

/**
 * Generates a print-ready PDF:
 * Header → Analyzed document blocks → Clause list → Risk summary
 */
export async function exportPDF({
  fileName,
  blocks,
  clauses,
  summary,
  date = new Date(),
  setToast,
}) {
  try {
    if (!Array.isArray(blocks) || !blocks.length) {
      throw new Error("No document blocks to export.");
    }

    const htmlEl = document.documentElement;
    const wasDark = htmlEl.classList.contains("dark");
    if (wasDark) htmlEl.classList.remove("dark");

    const dateStr = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const clauseByBlockId = new Map();
    (clauses || []).forEach((clause) => {
      if (
        typeof clause?.blockId === "string" &&
        !clauseByBlockId.has(clause.blockId)
      ) {
        clauseByBlockId.set(clause.blockId, clause);
      }
    });
    const flaggedClauses = (clauses || []).filter(
      (clause) => clause?.classification === "clause_flagged"
    );

    const blockHtml = blocks
      .map((block) => {
        const clause = clauseByBlockId.get(block.blockId);
        const isFlagged = clause?.classification === "clause_flagged";
        const colors = isFlagged ? getClauseColor(clause.type) : null;
        const style = isFlagged
          ? `background:${colors.bg};color:${colors.text};border:1px solid ${colors.border};`
          : "border:1px solid #e5e7eb;";
        const status = getBlockExportStatus(clause);
        const bodyText = getBlockBodyText(block);

        return `
          <article class="block" style="${style}">
            ${
              status
                ? `<div class="block-status" style="${status.style}">${escapeHtml(status.label)}</div>`
                : ""
            }
            <div class="block-label">${escapeHtml(block.sectionLabel || "Untitled block")}</div>
            ${
              bodyText
                ? `<div class="block-text">${escapeHtml(bodyText)}</div>`
                : ""
            }
          </article>
        `;
      })
      .join("");

    const clauseCounts = flaggedClauses.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {});

    const clauseList = flaggedClauses
      .map((clause) => {
        const riskStyle = getRiskStyle(clause.risk);
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
          padding-bottom: 24px;
        }
        h1, h2 { font-weight: 600; margin-bottom: 6px; }
        .section {
          margin-top: 20px;
          padding-bottom: 10px;
          page-break-inside: avoid;
        }
        .block {
          padding: 12px 14px;
          border-radius: 12px;
          margin: 12px 0;
        }
        .block-label {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .block-status {
          display: inline-block;
          margin-bottom: 10px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }
        .block-text {
          white-space: pre-wrap;
        }
        .clauses-list { margin-top: 10px; }
        .clause-item { margin-bottom: 12px; page-break-inside: avoid; }
        .clause-title { display: flex; align-items: center; gap: 8px; }
        .clause-text { margin-top: 6px; }
        .risk-pill {
          display: inline-block;
          height: 22px;
          line-height: 20px;
          box-sizing: border-box;
          vertical-align: middle;
          text-align: center;
          white-space: nowrap;
          font-size: 11px;
          font-weight: 600;
          padding: 0 10px;
          border-radius: 999px;
        }
        .summary-text {
          margin-top: 8px;
          line-height: 1.7;
          padding-bottom: 8px;
        }
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
        <h2>Analyzed Document Blocks</h2>
        <div>${blockHtml}</div>
      </div>
      <div class="section">
        <h2>Clause Details</h2>
        <div class="clauses-list">${clauseList || "No flagged clauses found."}</div>
      </div>
      <div class="section">
        <h2>Risk Summary</h2>
        <p><strong>Detected:</strong> ${
          Object.entries(clauseCounts)
            .map(([type, count]) => `${count} ${type}`)
            .join(", ") || "No flagged clauses"
        }.</p>
        <p class="summary-text">${
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
