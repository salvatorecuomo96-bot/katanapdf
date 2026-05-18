import { PDFDocument, rgb } from "pdf-lib";

export function pickPdfLibFont(fonts, family, bold, italic) {
  const f = (family || "").toLowerCase();

  // Noto Sans has full set; Noto Serif has regular + bold; Noto Sans Mono has
  // regular only. Fall back to the closest variant we shipped.
  if (!f.includes("sans") && (f.includes("times") || f.includes("georgia") || f.includes("serif"))) {
    return bold ? fonts.timesB : fonts.times;
  }

  if (f.includes("courier") || f.includes("mono")) {
    return fonts.courier;
  }

  if (bold && italic) return fonts.helvBI;
  if (bold) return fonts.helvB;
  if (italic) return fonts.helvI;
  return fonts.helv;
}

export function hexToRgb(hex) {
  const m = (hex || "").match(/^#?([0-9a-f]{6})$/i);
  if (!m) return rgb(0, 0, 0);

  const n = parseInt(m[1], 16);
  return rgb(
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255
  );
}

export async function loadPdfForExport(pdfBytes) {
  try {
    return await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
  } catch (loadErr) {
    if (/encrypt/i.test(loadErr?.message || "")) {
      try {
        return await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      } catch (innerErr) {
        console.warn(
          "pdf-lib couldn't parse this encrypted PDF, falling back to canvas:",
          innerErr.message
        );
        return null;
      }
    }

    console.warn(
      "pdf-lib couldn't parse this PDF, falling back to canvas:",
      loadErr.message
    );
    return null;
  }
}