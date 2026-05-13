import { PDFDocument } from "pdf-lib";

export async function convertImageToPdfBytes(file) {
  const doc = await PDFDocument.create();
  const arrayBuffer = await file.arrayBuffer();
  let img;
  const type = file.type.toLowerCase();
  try {
    if (type === "image/jpeg" || type === "image/jpg") {
      img = await doc.embedJpg(arrayBuffer);
    } else if (type === "image/png") {
      img = await doc.embedPng(arrayBuffer);
    } else {
      throw new Error("Use canvas fallback");
    }
  } catch (e) { // eslint-disable-line no-unused-vars
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);
    const pngBuf = await new Promise(res => {
      canvas.toBlob(async b => res(await b.arrayBuffer()), "image/png");
    });
    img = await doc.embedPng(pngBuf);
  }
  const { width, height } = img.scale(1);
  const page = doc.addPage([width, height]);
  page.drawImage(img, { x: 0, y: 0, width, height });
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
      const styleFamily = (styleEntry.fontFamily || "").toString();
      const fn = ((item.fontName || "") + " " + styleFamily).toLowerCase();
      let ff;
      if (styleFamily && /\w/.test(styleFamily)) {
        ff = `"${styleFamily}", Arial, sans-serif`;
        if (/serif/i.test(styleFamily)) ff = `"${styleFamily}", "Times New Roman", serif`;
        else if (/mono|courier/i.test(styleFamily)) ff = `"${styleFamily}", "Courier New", monospace`;
      } else if (fn.includes("times") || fn.includes("roman") || fn.includes("serif")) ff = "Times New Roman, serif";
      else if (fn.includes("courier") || fn.includes("mono")) ff = "Courier New, monospace";
      else if (fn.includes("georgia")) ff = "Georgia, serif";
      else if (fn.includes("verdana")) ff = "Verdana, sans-serif";
      else if (fn.includes("calibri") || fn.includes("segoe")) ff = "Calibri, 'Segoe UI', Arial, sans-serif";
      else ff = "Arial, sans-serif";
      const bold = /bold|black|heavy|semibold|medium/.test(fn);
      const italic = /italic|oblique/.test(fn);

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
