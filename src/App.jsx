import { useRef, useState, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

const SCALE = 2;

function KatanaLogo({ size = 36 }) {
  return (
    <svg width={size * 6} height={size * 1.8} viewBox="0 0 300 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── KATANA (top) ── */}
      {/* Tsuka (grip) — wrapped handle */}
      <rect x="4" y="14" width="66" height="14" rx="7" fill="#7a7a7a"/>
      {/* Ito wrapping — cross-diamond pattern */}
      {[11,18,25,32,39,46,53,60].map((x, i) => (
        <line key={i} x1={x} y1="14" x2={x + 6} y2="28" stroke="#3a3a3a" strokeWidth="1.6" opacity="0.8"/>
      ))}
      {/* Habaki (blade collar) */}
      <rect x="70" y="16" width="6" height="10" rx="1" fill="#c0c0c0"/>
      {/* Tsuba (guard) — round with detail */}
      <ellipse cx="80" cy="21" rx="6" ry="16" fill="#b0b0b0"/>
      <ellipse cx="80" cy="21" rx="4" ry="12" fill="#959595"/>
      <ellipse cx="80" cy="21" rx="2" ry="7" fill="#808080"/>
      {/* Nagasa (blade) — curved, characteristic katana sori */}
      <path d="M86 17 Q160 12 292 21 L86 25 Z" fill="#d8d8d8"/>
      {/* Ha (edge) highlight */}
      <path d="M86 17.5 Q160 12.5 285 21 L86 19 Z" fill="rgba(255,255,255,0.55)"/>
      {/* Mune (spine) dark line */}
      <path d="M86 24.5 Q160 20 288 21.5" stroke="#aaa" strokeWidth="0.5" fill="none"/>

      {/* ── SAYA (scabbard) ── */}
      {/* Main body — slightly curved like the blade */}
      <path d="M6 58 Q150 54 200 63 L200 69 Q150 60 6 64 Z" fill="#505050"/>
      {/* Lacquer sheen */}
      <path d="M12 59 Q150 55 198 64" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" fill="none"/>
      {/* Kojiri (metal end cap — left) */}
      <ellipse cx="7" cy="61" rx="7" ry="9" fill="#6e6e6e"/>
      <ellipse cx="7" cy="61" rx="5" ry="7" fill="#7c7c7c"/>
      {/* Kurikata (cord knob) */}
      <rect x="55" y="55" width="11" height="18" rx="4" fill="#383838"/>
      <rect x="57" y="57" width="7" height="14" rx="3" fill="#2e2e2e"/>
      {/* Koiguchi (mouth — open right end) */}
      <rect x="196" y="57" width="9" height="12" rx="2" fill="#686868"/>
      <rect x="197" y="59" width="5" height="8" rx="1" fill="#747474"/>
    </svg>
  );
}

function AdSlot({ slot, style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    try { if (window.adsbygoogle) (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, []);
  return (
    <div style={{ textAlign: "center", ...style }}>
      <ins ref={ref} className="adsbygoogle" style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

let floatingIdCounter = 0;

function clusterWordsIntoLineClusters(pageWords) {
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

function clusterLineString(cluster) {
  return [...cluster].sort((a, b) => a.x - b.x).map((w) => w.text).join(" ");
}

function mergeLineClustersIntoParagraphs(lineClusters) {
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

function paragraphWordsToTextBlock(words, paraIdx) {
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

function pageWordsToTextBlocks(pageWords) {
  const lines = clusterWordsIntoLineClusters(pageWords);
  const paragraphs = mergeLineClustersIntoParagraphs(lines);
  return paragraphs.map((p, i) => paragraphWordsToTextBlock(p, i)).filter(Boolean);
}

function redrawPage(canvas, dataUrl, edits) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    for (const e of edits) {
      const lines = e.text.split(/\r?\n/);
      const lh = e.fontSize * 1.22;
      const lineCount = Math.max(1, lines.length);
      const useBaselines = e.lineBaselines && e.lineBaselines.length === lines.length;
      let whiteH;
      if (useBaselines && lines.length > 1) {
        const bs = e.lineBaselines;
        whiteH = Math.max(e.height + 12, Math.max(...bs) - Math.min(...bs) + lh + 16);
      } else whiteH = Math.max(e.height + 12, lineCount * lh + 14);
      ctx.font = `${e.isItalic ? "italic " : ""}${e.isBold ? "bold " : ""}${e.fontSize}px ${e.fontFamily}`;
      ctx.fillStyle = "#fff";
      let maxLineW = e.width;
      for (const line of lines) maxLineW = Math.max(maxLineW, ctx.measureText(line || " ").width);
      ctx.fillRect(e.x - 2, e.y - 2, maxLineW + 14, whiteH + 8);
      ctx.fillStyle = "#000";
      ctx.textBaseline = "alphabetic";
      if (useBaselines) {
        lines.forEach((line, i) => {
          ctx.fillText(line, e.x, e.lineBaselines[i]);
        });
      } else {
        lines.forEach((line, i) => {
          ctx.fillText(line, e.x, e.baselineY + i * lh);
        });
      }
    }
  };
  img.src = dataUrl;
}

function EditPopup({ block, zoom, fontSize, fontFamily, isBold, isItalic, offsetX, offsetY, onOffsetChange, onCommit, onCancel }) {
  const [text, setText] = useState(block.text);
  const [dragging, setDragging] = useState(false);
  const [measuredW, setMeasuredW] = useState(0);
  const taRef = useRef(null);
  const popupRef = useRef(null);
  const measureRef = useRef(null);
  const textRef = useRef(block.text);
  const dragOrigin = useRef(null);

  useEffect(() => { textRef.current = text; }, [text]);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.focus();
    taRef.current.select();
  }, []);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.target.closest?.("[data-edit-toolbar]")) return;
      if (popupRef.current && !popupRef.current.contains(e.target)) onCommit(textRef.current);
    };
    document.addEventListener("mousedown", onMouseDown, true);
    return () => document.removeEventListener("mousedown", onMouseDown, true);
  }, [onCommit]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const o = dragOrigin.current;
      if (!o) return;
      onOffsetChange(o.ox + e.clientX - o.mx, o.oy + e.clientY - o.my);
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, onOffsetChange]);

  const onHandleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offsetX, oy: offsetY };
    setDragging(true);
  };

  const cssFontSize = (fontSize != null ? fontSize * SCALE : block.fontSize) * zoom;
  const lineHeightPx = Math.max(cssFontSize * 1.22, 15);
  const nLines = Math.max(1, text.split(/\r?\n/).length);
  const origNLines = Math.max(1, block.text.split(/\r?\n/).length);
  const padX = 10;
  const vw = typeof window !== "undefined" ? window.innerWidth * 0.96 : 900;

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const lines = text.split(/\r?\n/);
    let mw = 0;
    el.style.fontWeight = isBold ? "bold" : "normal";
    el.style.fontStyle = isItalic ? "italic" : "normal";
    el.style.fontSize = `${cssFontSize}px`;
    el.style.fontFamily = fontFamily;
    el.style.whiteSpace = "pre";
    for (const line of lines) {
      el.textContent = line || " ";
      mw = Math.max(mw, el.offsetWidth);
    }
    setMeasuredW(mw);
  }, [text, fontFamily, isBold, isItalic, cssFontSize]);

  const boxW = Math.max(block.width * zoom + padX, measuredW + 36, 96);
  const boxHBody = Math.max(
    block.height * zoom + 6,
    lineHeightPx * Math.max(nLines, origNLines) + 10,
    lineHeightPx * 1.35
  );
  const singleVisualLine = text.split(/\r?\n/).length <= 1;
  const sharedFont = {
    fontSize: cssFontSize,
    fontFamily,
    fontWeight: isBold ? "bold" : "normal",
    fontStyle: isItalic ? "italic" : "normal",
    lineHeight: `${lineHeightPx}px`,
    whiteSpace: singleVisualLine ? "pre" : "pre-wrap",
    wordBreak: singleVisualLine ? "normal" : "break-word",
  };

  return (
    <div ref={popupRef} onClick={e => e.stopPropagation()} style={{
      position: "absolute", left: offsetX, top: offsetY, zIndex: 999,
      border: "1px solid #c42f3c", borderRadius: 3, background: "#fff",
      boxSizing: "border-box", display: "flex", flexDirection: "column",
      width: Math.min(boxW, vw), minWidth: Math.min(boxW, vw), maxWidth: vw,
      boxShadow: "0 4px 18px rgba(0,0,0,0.28)",
    }}>
      <span ref={measureRef} aria-hidden style={{ position: "absolute", left: -9999, top: 0, visibility: "hidden", pointerEvents: "none" }} />
      <div style={{
        background: "#e63946", height: 11, flexShrink: 0, userSelect: "none",
        borderRadius: "2px 2px 0 0", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 4px 0 2px",
      }}>
        <div onMouseDown={onHandleMouseDown} title="Drag · Tab to save · ✓ or click outside"
          aria-label="Drag to move editor" style={{
            flex: 1, cursor: dragging ? "grabbing" : "grab", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 3, height: "100%",
          }}>
          {[0, 1, 2].map((k) => (
            <span key={k} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.92)" }} />
          ))}
        </div>
        <button type="button" title="Save" aria-label="Save"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onCommit(textRef.current); }}
          style={{
            border: "none", background: "rgba(0,0,0,0.12)", color: "#fff",
            width: 22, height: 20, lineHeight: "18px", borderRadius: 3,
            cursor: "pointer", fontSize: 13, fontWeight: 800, padding: 0, flexShrink: 0,
          }}>✓</button>
      </div>
      <textarea ref={taRef} value={text} onChange={e => setText(e.target.value)}
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          if (e.key === "Tab") { e.preventDefault(); onCommit(textRef.current); }
        }}
        style={{
          ...sharedFont, display: "block", border: "none", outline: "none",
          resize: "vertical", background: "#fff", padding: "5px 6px 6px",
          margin: 0, cursor: "text", width: "100%", minHeight: boxHBody,
          maxHeight: Math.max(boxHBody * 2.2, 360), boxSizing: "border-box",
          color: "#000", overflowX: singleVisualLine ? "auto" : "hidden",
        }} />
      <div style={{
        fontSize: 10, color: "#666", padding: "4px 8px 5px",
        borderTop: "1px solid #eee", background: "#fafafa",
        flexShrink: 0, userSelect: "none",
      }}>Tab to save · Esc to cancel</div>
    </div>
  );
}

const FB_SIZES = [6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72,80,96,120];

function FloatingBox({ fb, isSel, onSelect, onStartDrag, onUpdate, onDelete }) {
  const stopAll = e => e.stopPropagation();
  return (
    <div onClick={e => { e.stopPropagation(); onSelect(); }} style={{
      position: "absolute", left: fb.x, top: fb.y, minWidth: 140,
      zIndex: isSel ? 100 : 50,
      border: isSel ? "2px solid #e63946" : "1.5px dashed rgba(230,57,70,0.4)",
      borderRadius: 4, background: "rgba(255,255,255,0.97)",
      boxShadow: isSel ? "0 4px 20px rgba(0,0,0,0.25)" : "0 2px 8px rgba(0,0,0,0.1)",
      boxSizing: "border-box",
    }}>
      {/* Toolbar */}
      <div onMouseDown={onStartDrag} style={{
        background: "#e63946", padding: "4px 6px", fontSize: 11, color: "#fff",
        cursor: "grab", display: "flex", alignItems: "center", gap: 5,
        userSelect: "none", borderRadius: "2px 2px 0 0", flexWrap: "nowrap",
      }}>
        <span style={{ fontWeight: 700, marginRight: 2, cursor: "grab" }}>✥</span>

        {/* Font size */}
        <select value={FB_SIZES.includes(fb.fontSize) ? fb.fontSize : 14}
          onChange={e => onUpdate({ fontSize: +e.target.value })}
          onMouseDown={stopAll} onClick={e => e.stopPropagation()}
          style={{ fontSize: 11, background: "#a02030", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", width: 46 }}>
          {FB_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Bold */}
        <span onMouseDown={stopAll} onClick={e => { e.stopPropagation(); onUpdate({ isBold: !fb.isBold }); }}
          style={{ cursor: "pointer", fontWeight: 900, opacity: fb.isBold ? 1 : 0.4 }}>B</span>

        {/* Italic */}
        <span onMouseDown={stopAll} onClick={e => { e.stopPropagation(); onUpdate({ isItalic: !fb.isItalic }); }}
          style={{ cursor: "pointer", fontStyle: "italic", opacity: fb.isItalic ? 1 : 0.4 }}>I</span>

        {/* Color */}
        <input type="color" value={fb.color || "#000000"} onChange={e => onUpdate({ color: e.target.value })}
          onMouseDown={stopAll}
          style={{ width: 16, height: 16, border: "none", padding: 0, background: "none", cursor: "pointer", flexShrink: 0 }} />

        {/* Font family */}
        <select value={fb.fontFamily}
          onChange={e => onUpdate({ fontFamily: e.target.value })}
          onMouseDown={stopAll} onClick={e => e.stopPropagation()}
          style={{ fontSize: 11, background: "#a02030", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", padding: "0 2px" }}>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Times New Roman, serif">Times</option>
          <option value="Courier New, monospace">Courier</option>
          <option value="Georgia, serif">Georgia</option>
        </select>

        {/* Delete */}
        <span onMouseDown={stopAll} onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700 }}>✕</span>
      </div>

      {/* Textarea — fully controlled by parent state */}
      <textarea value={fb.text}
        onChange={e => onUpdate({ text: e.target.value })}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        rows={2}
        style={{
          display: "block", width: "100%", minWidth: 120, border: "none",
          outline: "none", resize: "both", background: "transparent",
          padding: "5px 8px", fontSize: fb.fontSize, fontFamily: fb.fontFamily,
          fontWeight: fb.isBold ? "bold" : "normal",
          fontStyle: fb.isItalic ? "italic" : "normal",
          color: fb.color || "#000", lineHeight: 1.5, cursor: "text",
          boxSizing: "border-box",
        }} />
    </div>
  );
}

export default function App() {
  const [pdfBytes, setPdfBytes] = useState(null);
  const [pages, setPages] = useState([]);
  const [textBlocks, setTextBlocks] = useState({});
  const [floatingBoxes, setFloatingBoxes] = useState([]);
  const [history, setHistory] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [fontSize, setFontSize] = useState(14);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const canvasRefs = useRef({});

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    setPdfBytes(bytes);

    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const pageData = [];
    const words = {};

    for (let i = 1; i <= pdf.numPages; i++) {
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

        const fn = (item.fontName || "").toLowerCase();
        let ff = "Arial, sans-serif";
        if (fn.includes("times") || fn.includes("roman")) ff = "Times New Roman, serif";
        else if (fn.includes("courier") || fn.includes("mono")) ff = "Courier New, monospace";
        else if (fn.includes("georgia")) ff = "Georgia, serif";
        const bold = fn.includes("bold");
        const italic = fn.includes("italic") || fn.includes("oblique");

        const parts = item.str.split(/(\s+)/);
        const charW = totalW / Math.max(item.str.length, 1);
        let ox = 0;
        for (let wi = 0; wi < parts.length; wi++) {
          const word = parts[wi];
          const ww = word.length * charW;
          if (word.trim()) {
            pageWords.push({
              id: `${i}-${idx}-${wi}`,
              text: word, page: i,
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

      words[i] = pageWordsToTextBlocks(pageWords);
      pageData.push({ num: i, dataUrl: canvas.toDataURL("image/png"), width: vp.width, height: vp.height });
    }
    setPages(pageData);
    setTextBlocks(words);
    setFloatingBoxes([]);
    setHistory([]);
    setActivePopup(null);
    setSelected(null);
    setZoom(1);
  }

  useEffect(() => {
    for (const pg of pages) {
      const canvas = canvasRefs.current[pg.num];
      if (!canvas) continue;
      canvas.width = pg.width;
      canvas.height = pg.height;
      const edits = (textBlocks[pg.num] || []).filter(w => w.edited && activePopup?.blockId !== w.id);
      redrawPage(canvas, pg.dataUrl, edits);
    }
  }, [textBlocks, pages, activePopup]);

  function saveHistory() {
    setHistory(prev => [...prev.slice(-29), {
      textBlocks: JSON.parse(JSON.stringify(textBlocks)),
      floatingBoxes: JSON.parse(JSON.stringify(floatingBoxes)),
    }]);
  }

  function undo() {
    if (!history.length) return;
    const snap = history[history.length - 1];
    setTextBlocks(snap.textBlocks);
    setFloatingBoxes(snap.floatingBoxes);
    setHistory(h => h.slice(0, -1));
    setActivePopup(null);
    setSelected(null);
  }

  function commitEdit(blockId, pageNum, newText) {
    setTextBlocks(prev => ({
      ...prev,
      [pageNum]: prev[pageNum].map(w => {
        if (w.id !== blockId) return w;
        return { ...w, text: newText, edited: true, fontFamily, fontSize: fontSize * SCALE, isBold, isItalic, lineBaselines: undefined };
      }),
    }));
    setActivePopup(null);
    setSelected(null);
  }

  function cancelEdit() {
    setActivePopup(null);
    setSelected(null);
  }

  function clickTextBlock(tb, e) {
    e.stopPropagation();
    if (activePopup?.blockId === tb.id) return;
    if (!tb.edited) saveHistory();
    setSelected(tb.id);
    setFontFamily(tb.fontFamily);
    setFontSize(Math.round(tb.fontSize / SCALE));
    setIsBold(tb.isBold);
    setIsItalic(tb.isItalic);
    setActivePopup({ blockId: tb.id, pageNum: tb.page, offsetX: 0, offsetY: 0 });
  }

  function handleBgClick() {
    setActivePopup(null);
    setSelected(null);
  }

  function handleWheel(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.min(3, Math.max(0.3, +(z - e.deltaY * 0.001).toFixed(2))));
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  function addFloatingBox(pageNum) {
    saveHistory();
    floatingIdCounter++;
    setFloatingBoxes(prev => [...prev, {
      id: `float-${floatingIdCounter}`, page: pageNum,
      x: 80, y: 80, text: "New text",
      fontSize: 14, fontFamily: "Arial, sans-serif",
      isBold: false, isItalic: false, color: "#000000",
    }]);
  }

  function updateFloatingBox(id, updates) {
    setFloatingBoxes(prev => prev.map(fb => fb.id === id ? { ...fb, ...updates } : fb));
  }

  function deleteFloatingBox(id) {
    saveHistory();
    setFloatingBoxes(prev => prev.filter(fb => fb.id !== id));
  }

  function startDragFloat(e, fb) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(fb.id);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging({ id: fb.id });
  }

  const onMouseMove = useCallback((e) => {
    if (!dragging) return;
    let pageEl = null;
    containerRef.current?.querySelectorAll("[data-pgwrap]").forEach(el => {
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) pageEl = el;
    });
    if (!pageEl) return;
    const r = pageEl.getBoundingClientRect();
    setFloatingBoxes(prev => prev.map(fb => fb.id === dragging.id
      ? { ...fb, x: Math.max(0, e.clientX - r.left - dragOffset.current.x), y: Math.max(0, e.clientY - r.top - dragOffset.current.y) }
      : fb
    ));
  }, [dragging]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  async function handleDownload() {
    if (!pages.length) { alert("No PDF loaded."); return; }
    try {
      const doc = await PDFDocument.create();
      for (const pg of pages) {
        const canvas = canvasRefs.current[pg.num];
        if (!canvas) continue;
        canvas.width = pg.width;
        canvas.height = pg.height;
        const ctx = canvas.getContext("2d");

        await new Promise(resolve => {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, 0, 0); resolve(); };
          img.src = pg.dataUrl;
        });

        const edits = (textBlocks[pg.num] || []).filter(w => w.edited);
        for (const e of edits) {
          const lines = e.text.split(/\r?\n/);
          const lh = e.fontSize * 1.22;
          ctx.font = `${e.isItalic ? "italic " : ""}${e.isBold ? "bold " : ""}${e.fontSize}px ${e.fontFamily}`;
          ctx.fillStyle = "#fff";
          let maxW = e.width;
          for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln || " ").width);
          ctx.fillRect(e.x - 2, e.y - 2, maxW + 14, lines.length * lh + 16);
          ctx.fillStyle = "#000";
          ctx.textBaseline = "alphabetic";
          lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.lineBaselines?.[i] ?? e.baselineY + i * lh));
        }

        for (const fb of floatingBoxes.filter(f => f.page === pg.num)) {
          const lines = fb.text.split(/\r?\n/);
          ctx.font = `${fb.isItalic ? "italic " : ""}${fb.isBold ? "bold " : ""}${fb.fontSize}px ${fb.fontFamily}`;
          ctx.fillStyle = fb.color || "#000";
          ctx.textBaseline = "top";
          lines.forEach((ln, i) => ctx.fillText(ln, fb.x, fb.y + i * fb.fontSize * 1.5));
        }

        const pngBytes = await (await fetch(canvas.toDataURL("image/png"))).arrayBuffer();
        const pngImg = await doc.embedPng(pngBytes);
        const pdfPage = doc.addPage([pg.width / SCALE, pg.height / SCALE]);
        pdfPage.drawImage(pngImg, { x: 0, y: 0, width: pg.width / SCALE, height: pg.height / SCALE });
      }

      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (fileName || "document").replace(/\.pdf$/i, "") + "_edited.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed: " + err.message);
    }
  }

  const isNoFile = pages.length === 0;

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#0f0f0f", userSelect: dragging ? "none" : "auto" }} onClick={handleBgClick}>
      {isNoFile ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "radial-gradient(ellipse at 50% 40%, #1c1c1c 0%, #080808 100%)" }}>
          <AdSlot slot="1234567890" style={{ width: "100%", maxWidth: 728, marginBottom: 32 }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 32 }}>
            <KatanaLogo size={44} />
            <h1 style={{ fontSize: 58, fontWeight: 900, color: "#fff", letterSpacing: -2.5, margin: 0, fontFamily: "Georgia, serif" }}>
              katana<span style={{ color: "#e63946" }}>pdf</span>
            </h1>
          </div>
          <label style={{ padding: "14px 52px", background: "#e63946", color: "#fff", borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, boxShadow: "0 8px 32px rgba(230,57,70,0.4)" }}>
            Open PDF <input type="file" accept=".pdf" onChange={handleFile} style={{ display: "none" }} />
          </label>
          <AdSlot slot="0987654321" style={{ width: "100%", maxWidth: 728, marginTop: 40 }} />
        </div>
      ) : (
        <>
          <div data-edit-toolbar style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 52, background: "#111", borderBottom: "1px solid #222", position: "sticky", top: 0, zIndex: 300, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
            <KatanaLogo size={26} />
            <span style={{ fontWeight: 900, fontSize: 15, color: "#fff", fontFamily: "Georgia, serif" }}>katana<span style={{ color: "#e63946" }}>pdf</span></span>
            <div style={{ width: 1, height: 24, background: "#2a2a2a", margin: "0 4px" }} />
            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={tbSelect}>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Courier New, monospace">Courier</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
            <select value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} style={{ ...tbSelect, width: 58, textAlign: "center" }}>
              {[6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72,80,96,120].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={() => setIsBold(b => !b)} style={{ ...tbIconBtn, fontWeight: 900, background: isBold ? "#e63946" : "#1a1a1a", color: isBold ? "#fff" : "#888" }}>B</button>
            <button onClick={() => setIsItalic(i => !i)} style={{ ...tbIconBtn, fontStyle: "italic", background: isItalic ? "#e63946" : "#1a1a1a", color: isItalic ? "#fff" : "#888" }}>I</button>
            <div style={{ width: 1, height: 24, background: "#2a2a2a", margin: "0 4px" }} />
            <label style={tbBtn}>Open <input type="file" accept=".pdf" onChange={handleFile} style={{ display: "none" }} /></label>
            <button onClick={undo} disabled={!history.length} style={{ ...tbBtn, opacity: history.length ? 1 : 0.3 }}>↩ Undo</button>
            <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))} style={tbIconBtn}>+</button>
            <span style={{ fontSize: 11, color: "#555", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} style={tbIconBtn}>−</button>
            <div style={{ flex: 1 }} />
            <button onClick={handleDownload} style={{ padding: "8px 20px", background: "#e63946", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>⬇ Download PDF</button>
          </div>

          <div onClick={e => e.stopPropagation()} style={{ background: "#0f0f0f", padding: "6px 0", display: "flex", justifyContent: "center" }}>
            <AdSlot slot="11223344async55" style={{ width: "100%", maxWidth: 728 }} />
          </div>

          <div ref={containerRef} style={{ padding: "40px 0 80px", display: "flex", flexDirection: "column", alignItems: "center", gap: 48 }}>
            {pages.map((pg, pgIdx) => {
              const dispW = pg.width * zoom;
              const dispH = pg.height * zoom;
              return (
                <div key={pg.num}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, width: Math.min(dispW, window.innerWidth * 0.96) }}>
                    <span style={{ fontSize: 11, color: "#444", letterSpacing: 2, textTransform: "uppercase" }}>Page {pg.num}</span>
                    <button onClick={e => { e.stopPropagation(); addFloatingBox(pg.num); }} style={pageBtn}>+ Add text</button>
                  </div>
                  <div data-pgwrap={pg.num} onClick={e => e.stopPropagation()} style={{ position: "relative", width: dispW, height: dispH, maxWidth: "96vw", boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden" }}>
                    <canvas ref={(el) => { if (el) canvasRefs.current[pg.num] = el; else delete canvasRefs.current[pg.num]; }} style={{ display: "block", width: dispW, height: dispH }} />
                    {(textBlocks[pg.num] || []).map(tb => {
                      const isOpen = activePopup?.blockId === tb.id;
                      return (
                        <div key={tb.id} style={{
                          position: "absolute", left: tb.x * zoom, top: tb.y * zoom,
                          width: Math.max(tb.width * zoom, 8),
                          height: Math.max(tb.height * zoom, tb.fontSize * zoom * 0.9),
                          zIndex: isOpen ? 20 : 10, cursor: "text",
                        }} onClick={e => clickTextBlock(tb, e)}>
                          {isOpen && (
                            <EditPopup block={tb} zoom={zoom} fontSize={fontSize} fontFamily={fontFamily} isBold={isBold} isItalic={isItalic}
                              offsetX={activePopup.offsetX ?? 0} offsetY={activePopup.offsetY ?? 0}
                              onOffsetChange={(ox, oy) => setActivePopup(ap => (ap && ap.blockId === tb.id ? { ...ap, offsetX: ox, offsetY: oy } : ap))}
                              onCommit={newText => commitEdit(tb.id, tb.page, newText)}
                              onCancel={cancelEdit} />
                          )}
                        </div>
                      );
                    })}
                    {floatingBoxes.filter(fb => fb.page === pg.num).map(fb => (
                      <FloatingBox key={fb.id} fb={fb} isSel={selected === fb.id}
                        onSelect={() => setSelected(fb.id)}
                        onStartDrag={e => startDragFloat(e, fb)}
                        onUpdate={u => updateFloatingBox(fb.id, u)}
                        onDelete={() => deleteFloatingBox(fb.id)} />
                    ))}
                  </div>
                  {pgIdx % 2 === 1 && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
                      <AdSlot slot="5566778899" style={{ width: "100%", maxWidth: 728 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

const tbBtn = { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 12, background: "#1a1a1a", color: "#666", cursor: "pointer", userSelect: "none", fontFamily: "inherit" };
const tbIconBtn = { width: 28, height: 28, border: "1px solid #2a2a2a", borderRadius: 5, fontSize: 13, background: "#1a1a1a", color: "#888", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", padding: 0 };
const tbSelect = { padding: "4px 6px", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 12, background: "#1a1a1a", color: "#888", cursor: "pointer", fontFamily: "inherit" };
const pageBtn = { padding: "7px 16px", border: "1px solid #444", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "#1a1a1a", color: "#c9a84c", cursor: "pointer", userSelect: "none" };