import { PDFDocument } from "pdf-lib";

// iOS Safari/in-app browsers occasionally have Blob.arrayBuffer missing or flaky.
// Fall back to FileReader so uploads work on every WebKit version.
export function fileToArrayBuffer(file) {
  if (file && typeof file.arrayBuffer === "function") {
    try {
      return file.arrayBuffer();
    } catch (_) { /* fall through */ }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read file."));
    reader.onabort = () => reject(new Error("File reading was cancelled."));
    reader.readAsArrayBuffer(file);
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read image file."));
    reader.onabort = () => reject(new Error("Image reading was cancelled."));
    reader.readAsDataURL(file);
  });
}

function dataUrlToImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image."));
    img.src = dataUrl;
  });
}

function dataUrlToArrayBuffer(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function convertImageToPdfBytes(file) {
  const doc = await PDFDocument.create();
  const arrayBuffer = await fileToArrayBuffer(file);
  let img;
  const type = (file.type || "").toLowerCase();
  try {
    if (type === "image/jpeg" || type === "image/jpg") {
      img = await doc.embedJpg(arrayBuffer);
    } else if (type === "image/png") {
      img = await doc.embedPng(arrayBuffer);
    } else {
      throw new Error("Use canvas fallback");
    }
  } catch (e) { // eslint-disable-line no-unused-vars
    // FileReader + <img> fallback — iPhone Safari can fail createImageBitmap for HEIC/odd formats.
    const dataUrl = await fileToDataUrl(file);
    const image = await dataUrlToImage(dataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);

    let pngBuf;
    if (canvas.toBlob) {
      pngBuf = await new Promise((resolve, reject) => {
        canvas.toBlob(async blob => {
          if (!blob) { reject(new Error("Could not convert image to PNG.")); return; }
          try { resolve(await fileToArrayBuffer(blob)); } catch (err) { reject(err); }
        }, "image/png");
      });
    } else {
      pngBuf = dataUrlToArrayBuffer(canvas.toDataURL("image/png"));
    }
    img = await doc.embedPng(pngBuf);
  }
const { width: rawW, height: rawH } = img.scale(1);

// Prevent huge phone photos from creating massive PDF pages.
// This keeps mobile editor layout stable.
const MAX_PAGE_SIZE = 1600;
const scale = Math.min(1, MAX_PAGE_SIZE / Math.max(rawW, rawH));

const width = rawW * scale;
const height = rawH * scale;

const page = doc.addPage([width, height]);
page.drawImage(img, {
  x: 0,
  y: 0,
  width,
  height,
});
  return await doc.save();
}

export async function extractPagesAndTextFromPdfBytes(bytes, {
  startNum = 1,
  pdfjsLib,
  SCALE,
  pageWordsToTextBlocks
}) {
  const pdf = await pdfjsLib.getDocument({
    data: bytes,
    cMapUrl: "https://unpkg.com/pdfjs-dist@5.7.284/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "https://unpkg.com/pdfjs-dist@5.7.284/standard_fonts/"
  }).promise;

  const pageData = [];
  const words = {};

  for (let i = 1; i <= pdf.numPages; i++) {
    const pgNum = startNum + i - 1;
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;

    const content = await page.getTextContent();
    const pageWords = [];

    for (let idx = 0; idx < content.items.length; idx++) {
      const item = content.items[idx];
      if (!item.str.trim()) continue;
      const [, , , d, tx, ty] = item.transform;
      const fs = Math.abs(d) * SCALE;
      const baselineY = vp.height - ty * SCALE;
      const top = baselineY - fs;
      const left = tx * SCALE;
      const totalW = Math.max(item.width * SCALE, fs * 0.4);
      const h = fs * 1.4;

      const styleEntry = (content.styles && content.styles[item.fontName]) || {};
      // pdfjs sometimes gives the real family in styleEntry.fontFamily (e.g. "Arial", "Times New Roman")
      const sfRaw = (styleEntry.fontFamily || "").toString();
      const sf = sfRaw.toLowerCase();
      const fn = ((item.fontName || "") + " " + sf).toLowerCase();

      // Map to an exact FONT_FAMILIES dropdown value — prefer pdfjs's resolved family first
      let ff;
      if (sf.includes("arial") || sf.includes("helvetica"))
        ff = "Arial, sans-serif";
      else if (sf.includes("times") || sf.includes("roman"))
        ff = "Times New Roman, serif";
      else if (sf.includes("courier"))
        ff = '"Courier New", Courier, monospace';
      else if (sf.includes("verdana"))
        ff = "Verdana, Geneva, sans-serif";
      else if (sf.includes("comic"))
        ff = '"Comic Sans MS", "Comic Sans", cursive';
      else if (fn.includes("times") || fn.includes("roman") || (fn.includes("serif") && !fn.includes("sans")))
        ff = "Times New Roman, serif";
      else if (fn.includes("courier") || fn.includes("mono"))
        ff = '"Courier New", Courier, monospace';
      else if (fn.includes("verdana"))
        ff = "Verdana, Geneva, sans-serif";
      else if (fn.includes("comic"))
        ff = '"Comic Sans MS", "Comic Sans", cursive';
      else
        ff = "Arial, sans-serif";

      // "medium" is NOT bold — only flag genuinely heavy weights
      const bold = /bold|black|heavy|semibold/.test(fn);
      const italic = /italic|oblique/.test(fn);

      // Sample canvas to approximate text color (pick darkest pixel along the text body)
      const ctx2d = canvas.getContext("2d");
      let bestR = 0, bestG = 0, bestB = 0, bestLum = 256;
      const sampleY = Math.min(Math.max(0, Math.round(baselineY - fs * 0.4)), canvas.height - 1);
      for (let si = 0; si < 5; si++) {
        const sx = Math.min(Math.max(0, Math.round(left + totalW * (si + 0.5) / 6)), canvas.width - 1);
        const d4 = ctx2d.getImageData(sx, sampleY, 1, 1).data;
        const lum = 0.299 * d4[0] + 0.587 * d4[1] + 0.114 * d4[2];
        if (lum < bestLum) { bestLum = lum; bestR = d4[0]; bestG = d4[1]; bestB = d4[2]; }
      }
      const textColor = bestLum < 200
        ? `#${bestR.toString(16).padStart(2, "0")}${bestG.toString(16).padStart(2, "0")}${bestB.toString(16).padStart(2, "0")}`
        : "#000000";

      const parts = item.str.split(/(\s+)/);
      const charW = totalW / Math.max(item.str.length, 1);
      let ox = 0;
      for (let wi = 0; wi < parts.length; wi++) {
        const word = parts[wi];
        const ww = word.length * charW;
        if (word.trim()) {
          pageWords.push({
            id: `${pgNum}-${idx}-${wi}`,
            text: word, page: pgNum,
            x: left + ox, y: top,
            baselineY, width: ww, height: h,
            fontSize: fs, fontFamily: ff,
            isBold: bold, isItalic: italic,
            color: textColor,
            edited: false,
          });
        }
        ox += ww;
      }
    }

    words[pgNum] = pageWordsToTextBlocks(pageWords);
    pageData.push({ num: pgNum, dataUrl: canvas.toDataURL("image/png"), width: vp.width, height: vp.height });
  }

  return { pageData, words };
}
