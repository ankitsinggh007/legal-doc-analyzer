import fs from "node:fs/promises";
import path from "node:path";

import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_DOC_CHARS = 60000;

function normalizePages(pages) {
  return pages.map((pageText) =>
    String(pageText || "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

async function parsePdf(filePath) {
  const buffer = await fs.readFile(filePath);
  const data = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const pages = [];
  let text = "";
  let nonTextFound = false;

  for (let i = 1; i <= pdf.numPages; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    if (!content.items.length) nonTextFound = true;

    const pageLines = [];
    let currentLine = "";

    for (const item of content.items) {
      const value = String(item.str || "")
        .replace(/\s+/g, " ")
        .trim();

      if (value) {
        currentLine = currentLine ? `${currentLine} ${value}` : value;
      }

      if (item.hasEOL && currentLine) {
        pageLines.push(currentLine.trim());
        currentLine = "";
      }
    }

    if (currentLine) {
      pageLines.push(currentLine.trim());
    }

    const pageText = pageLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    pages.push(pageText);
    text += (text ? "\n\n" : "") + pageText;
  }

  text = text.replace(/\n{3,}/g, "\n\n").trim();

  if (!text) {
    throw new Error("This PDF seems image-based or empty.");
  }

  if (text.length > MAX_DOC_CHARS) {
    throw new Error(
      `This document exceeds the ${MAX_DOC_CHARS.toLocaleString("en-US")}-character processing limit.`
    );
  }

  return {
    text,
    pages: normalizePages(pages),
    warning: nonTextFound ? "Some non-text elements were skipped." : null,
  };
}

async function parseDocx(filePath) {
  const arrayBuffer = await fs.readFile(filePath);
  const { value: html } = await mammoth.convertToHtml({
    arrayBuffer,
  });

  const text = html
    .replace(/<(\/)?(p|div|br|li|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  if (!text) {
    throw new Error("This DOCX file seems empty or unreadable.");
  }

  if (text.length > MAX_DOC_CHARS) {
    throw new Error(
      `This document exceeds the ${MAX_DOC_CHARS.toLocaleString("en-US")}-character processing limit.`
    );
  }

  return {
    text,
    pages: [text],
    warning: /<img/i.test(html) ? "Some non-text elements were skipped." : null,
  };
}

async function parseTxt(filePath) {
  const text = (await fs.readFile(filePath, "utf8")).trim();

  if (!text) {
    throw new Error("Text file is empty.");
  }

  if (text.length > MAX_DOC_CHARS) {
    throw new Error(
      `This document exceeds the ${MAX_DOC_CHARS.toLocaleString("en-US")}-character processing limit.`
    );
  }

  return {
    text,
    pages: [text],
    warning: null,
  };
}

export async function parseDocumentFromPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".pdf") {
    return parsePdf(filePath);
  }

  if (extension === ".docx") {
    return parseDocx(filePath);
  }

  if (extension === ".txt") {
    return parseTxt(filePath);
  }

  throw new Error(`Unsupported format for corpus test: ${extension}`);
}
