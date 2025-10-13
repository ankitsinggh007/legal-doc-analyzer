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
    let nonTextFound = false;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      if (!content.items.length) nonTextFound = true;

      const pageText = content.items
        .map((item) => item.str || "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      text += pageText + "\n";
    }

    text = text.replace(/\n{2,}/g, "\n").trim();

    if (!text) throw new Error("This PDF seems image-based or empty.");

    const warning = nonTextFound
      ? "Some non-text elements were skipped."
      : null;

    if (warning) console.warn(`[parseDocument] ${warning}`);

    return { text, warning };
  } catch (err) {
    throw new Error("Failed to parse PDF: " + err.message);
  }
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
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text) throw new Error("This DOCX file seems empty or unreadable.");

    const nonTextFound = /<img/i.test(html);
    const warning = nonTextFound
      ? "Some non-text elements were skipped."
      : null;

    if (warning) console.warn(`[parseDocument] ${warning}`);

    return { text, warning };
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
        else resolve({ text, warning: null });
      };
      reader.onerror = () => reject(new Error("Failed to read TXT file."));
      reader.readAsText(file, "utf-8");
    } catch (err) {
      reject(new Error("Unexpected error while parsing TXT: " + err.message));
    }
  });
}
