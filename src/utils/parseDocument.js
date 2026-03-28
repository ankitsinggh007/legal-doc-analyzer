const MAX_DOC_CHARS = Number.parseInt(
  import.meta.env.VITE_MAX_DOC_CHARS || "60000",
  10
);

export default async function parseDocument(file) {
  if (!file || !file.type)
    throw new Error("Invalid file object. Please re-upload.");

  const type = file.type;

  if (type === "application/pdf") {
    return await parsePDF(file);
  } else if (
    type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return await parseDOCX(file);
  } else if (type === "text/plain") {
    return await parseTXT(file);
  } else {
    throw new Error(
      "Unsupported format. Please upload a PDF, DOCX, or TXT file."
    );
  }
}
/*-----------------PDF Parser---------------- */

async function parsePDF(file) {
  try {
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";
    const pages = [];
    let nonTextFound = false;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await getPageTextContent(page);

      if (!content.items.length) nonTextFound = true;

      const pageLines = [];
      let currentLine = "";

      for (const item of content.items) {
        const value = (item.str || "").replace(/\s+/g, " ").trim();

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

      const pageText = pageLines
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      pages.push(pageText);

      text += (text ? "\n\n" : "") + pageText;
    }

    text = text.replace(/\n{3,}/g, "\n\n").trim();

    if (!text) throw new Error("This PDF seems image-based or empty.");
    if (text.length > MAX_DOC_CHARS) {
      throw new Error(
        `This document exceeds the ${MAX_DOC_CHARS.toLocaleString(
          "en-US"
        )}-character processing limit.`
      );
    }
    const warning = nonTextFound
      ? "Some non-text elements were skipped."
      : null;

    if (warning) console.warn(`[parseDocument] ${warning}`);

    return { text, warning, pages };
  } catch (err) {
    throw new Error("Failed to parse PDF: " + err.message);
  }
}

async function getPageTextContent(page) {
  if (typeof page.streamTextContent !== "function") {
    return await page.getTextContent();
  }

  const reader = page.streamTextContent().getReader();
  const textContent = {
    items: [],
    styles: Object.create(null),
    lang: null,
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;
      if (!value) continue;

      textContent.lang ??= value.lang;
      Object.assign(textContent.styles, value.styles);
      textContent.items.push(...value.items);
    }
  } finally {
    reader.releaseLock?.();
  }

  return textContent;
}

/* ------------------DOCX Parser--------------*/

async function parseDOCX(file) {
  try {
    const mammoth = await import("mammoth");

    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.default.convertToHtml({
      arrayBuffer,
    });

    const text = html
      .replace(/<(\/)?(p|div|br|li|h[1-6])[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();

    if (!text) throw new Error("This DOCX file seems empty or unreadable.");
    if (text.length > MAX_DOC_CHARS) {
      throw new Error(
        `This document exceeds the ${MAX_DOC_CHARS.toLocaleString(
          "en-US"
        )}-character processing limit.`
      );
    }
    const nonTextFound = /<img/i.test(html);
    const warning = nonTextFound
      ? "Some non-text elements were skipped."
      : null;

    if (warning) console.warn(`[parseDocument] ${warning}`);

    return { text, warning, pages: [text] };
  } catch (err) {
    throw new Error("Failed to parse DOCX: " + err.message);
  }
}

/* ------------------Plain Text---------------------*/

function parseTXT(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result.trim();
        if (!text) reject(new Error("Text file is empty."));
        if (text.length > MAX_DOC_CHARS) {
          throw new Error(
            `This document exceeds the ${MAX_DOC_CHARS.toLocaleString(
              "en-US"
            )}-character processing limit.`
          );
        } else resolve({ text, warning: null, pages: [text] });
      };
      reader.onerror = () => reject(new Error("Failed to read TXT file."));
      reader.readAsText(file, "utf-8");
    } catch (err) {
      reject(new Error("Unexpected error while parsing TXT: " + err.message));
    }
  });
}
