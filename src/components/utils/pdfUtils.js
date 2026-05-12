import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export { pdfjsLib };

// Legacy build is transpiled for older Safari / iOS - improves cross-device compatibility.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).href;

export function clusterWordsIntoLineClusters(pageWords) {
  const EPS_Y = 5;
  const MAX_GAP_MULT = 2.8;
  if (!pageWords.length) return [];
  const sorted = [...pageWords].sort((a, b) => {
    if (Math.abs(a.baselineY - b.baselineY) > EPS_Y) return b.baselineY - a.baselineY;
    return a.x - b.x;
  });
  const clusters = [];
  let c = [];
  for (const w of sorted) {
    if (!c.length) {
      c.push(w);
      continue;
    }
    const last = c[c.length - 1];
    const sameLine = Math.abs(w.baselineY - last.baselineY) <= EPS_Y;
    const gap = w.x - (last.x + last.width);
    const maxGap = Math.max(last.fontSize, w.fontSize) * MAX_GAP_MULT;
    if (sameLine && gap <= maxGap) c.push(w);
    else {
      clusters.push(c);
      c = [w];
    }
  }
  if (c.length) clusters.push(c);
  return clusters;
}

export function clusterLineString(cluster) {
  return [...cluster].sort((a, b) => a.x - b.x).map((w) => w.text).join(" ");
}

export function mergeLineClustersIntoParagraphs(lineClusters) {
  if (!lineClusters.length) return [];
  const sorted = [...lineClusters].sort((a, b) => {
    const topA = Math.min(...a.map(w => w.y));
    const topB = Math.min(...b.map(w => w.y));
    if (Math.abs(topA - topB) < 5) return Math.min(...a.map(w => w.x)) - Math.min(...b.map(w => w.x));
    return topA - topB;
  });
  const merged = [];
  let group = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevC = group[group.length - 1];
    const nextC = sorted[i];
    const prevMaxB = Math.max(...prevC.map(w => w.y + w.height));
    const nextMinY = Math.min(...nextC.map(w => w.y));
    const gap = nextMinY - prevMaxB;
    const fsMin = Math.min(prevC[0].fontSize, nextC[0].fontSize);
    const fsMax = Math.max(prevC[0].fontSize, nextC[0].fontSize);

    const prevMinX = Math.min(...prevC.map(w => w.x));
    const prevMaxX = Math.max(...prevC.map(w => w.x + w.width));
    const nextMinX = Math.min(...nextC.map(w => w.x));
    const nextMaxX = Math.max(...nextC.map(w => w.x + w.width));
    const overlap = Math.min(prevMaxX, nextMaxX) - Math.max(prevMinX, nextMinX);
    const wPrev = Math.max(prevMaxX - prevMinX, 1);
    const wNext = Math.max(nextMaxX - nextMinX, 1);
    const minW = Math.min(wPrev, wNext);
    const overlapRatio = minW > 0 ? overlap / minW : 0;

    const prevStr = clusterLineString(prevC).trimEnd();
    const nextStr = clusterLineString(nextC).trimStart();
    const hyphenHung = /[-\u00ad]\s*$/.test(prevStr) || /\d[-\u00ad]\s*$/.test(prevStr);
    const nextLooksLikeDateTail = /^\d{2,4}\b/.test(nextStr) || /^to\s+\d/i.test(nextStr);

    const prevAvgFs = prevC.reduce((s, w) => s + w.fontSize, 0) / prevC.length;
    const nextAvgFs = nextC.reduce((s, w) => s + w.fontSize, 0) / nextC.length;
    const headingPullsBody = prevAvgFs > nextAvgFs * 1.12;

    const gapLo = -fsMin * 0.4;
    let gapHi = fsMin * 2.2;
    if (hyphenHung) gapHi = Math.max(gapHi, fsMin * 3.85);
    else if (nextLooksLikeDateTail && overlapRatio > 0.06 && Math.abs(nextMinX - prevMinX) < fsMin * 6)
      gapHi = Math.max(gapHi, fsMin * 3.1);
    if (headingPullsBody) gapHi = Math.max(gapHi, Math.max(prevAvgFs, nextAvgFs) * 3.6);
    const gapOK = gap >= gapLo && gap < gapHi;

    let isolatedSideBySide = nextMaxX < prevMinX - fsMin * 2.5 || nextMinX > prevMaxX + fsMin * 4;
    if (hyphenHung)
      isolatedSideBySide = nextMaxX < prevMinX - fsMin * 8 || nextMinX > prevMaxX + fsMin * 12;

    const sizeMismatch = fsMax > fsMin * 1.32 && !headingPullsBody;
    const leftAligned = Math.abs(nextMinX - prevMinX) < fsMin * 4.5;

    let merge = false;
    if (!gapOK || isolatedSideBySide) merge = false;
    else if (sizeMismatch) merge = false;
    else if (headingPullsBody) merge = true;
    else if (hyphenHung) merge = true;
    else if (leftAligned) merge = true;
    else if (overlapRatio > 0.32) merge = true;

    if (merge) group.push(nextC);
    else {
      merged.push(group.flat());
      group = [nextC];
    }
  }
  merged.push(group.flat());
  return merged;
}

export function paragraphWordsToTextBlock(words, paraIdx) {
  if (!words.length) return null;
  const page = words[0].page;
  const lineClusters = clusterWordsIntoLineClusters(words);
  const sortedLines = [...lineClusters].sort((a, b) => Math.min(...a.map((w) => w.y)) - Math.min(...b.map((w) => w.y)));
  const linesText = sortedLines.map((lc) => [...lc].sort((a, b) => a.x - b.x).map((w) => w.text).join(" "));
  const text = linesText.join("\n");

  const minX = Math.min(...words.map((w) => w.x));
  const maxR = Math.max(...words.map((w) => w.x + w.width));
  const minY = Math.min(...words.map((w) => w.y));
  const maxB = Math.max(...words.map((w) => w.y + w.height));
  const topLine = [...sortedLines[0]].sort((a, b) => a.x - b.x);
  const baselineY = topLine.reduce((s, w) => s + w.baselineY, 0) / topLine.length;
  const lineBaselines = sortedLines.map((lc) => {
    const ln = [...lc].sort((a, b) => a.x - b.x);
    return ln.reduce((s, w) => s + w.baselineY, 0) / ln.length;
  });
  const fs = sortedLines.length > 1
    ? words.reduce((a, w) => a + w.fontSize, 0) / words.length
    : topLine.reduce((s, w) => s + w.fontSize, 0) / Math.max(topLine.length, 1);
  const { fontFamily, isBold, isItalic } = topLine[0];

  return {
    id: `${page}-P${paraIdx}`,
    page,
    text,
    x: minX,
    y: minY,
    width: maxR - minX,
    height: maxB - minY,
    baselineY,
    lineBaselines,
    fontSize: fs,
    fontFamily,
    isBold,
    isItalic,
    edited: false,
  };
}

export function pageWordsToTextBlocks(pageWords) {
  const lines = clusterWordsIntoLineClusters(pageWords);
  const paragraphs = mergeLineClustersIntoParagraphs(lines);
  return paragraphs.map((p, i) => paragraphWordsToTextBlock(p, i)).filter(Boolean);
}

export function redrawPage(canvas, dataUrl, edits) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    for (const e of edits) {
      const lines = (e.text || "").split(/\r?\n/);
      const lh = e.fontSize * 1.22;
      const lineCount = Math.max(1, lines.length);
      const useBaselines = e.lineBaselines && e.lineBaselines.length === lines.length;
      
      ctx.font = `${e.isItalic ? "italic " : ""}${e.isBold ? "bold " : ""}${e.fontSize}px ${e.fontFamily}`;
      
      let textW = 0;
      for (const line of lines) {
        textW = Math.max(textW, ctx.measureText(line || " ").width);
      }

      // Strictly limit eraser to the new text dimensions + minimal padding to avoid covering the page.
      const rectW = Math.min(textW + 12, canvas.width * 0.9);
      const rectH = Math.min(lineCount * lh + 12, canvas.height * 0.9);

      // Default text background to transparent unless bgColor is specified.
      // (For textBlocks, if no bgColor, we still need a white eraser for the text, 
      // but if bgColor is explicit, use it. Wait, the original code used #fff as eraser).
      ctx.fillStyle = e.bgColor && e.bgColor !== "transparent" ? e.bgColor : "#fff";
      ctx.fillRect(e.x - 2, e.y - 2, rectW, rectH);
      
      ctx.fillStyle = e.color || "#000";
      ctx.textBaseline = "alphabetic";
      if (useBaselines) {
        lines.forEach((line, i) => {
          ctx.fillText(line || "", e.x, e.lineBaselines[i]);
        });
      } else {
        lines.forEach((line, i) => {
          ctx.fillText(line || "", e.x, e.baselineY + i * lh);
        });
      }
    }
  };
  img.src = dataUrl;
}
export function makeTabId() {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

