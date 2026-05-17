import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument, degrees, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import Homepage from "../Homepage";
import EditPopup from "./EditPopup";
import FloatingBox from "./FloatingBox";
import FloatingImage from "./FloatingImage";
import SignatureModal from "./SignatureModal";
import SplitModal from "./SplitModal";
import EditorNotices from "./EditorNotices";
import EditorHeader from "./EditorHeader";
import EditorToolbar from "./EditorToolbar";
import FloatingShape from "./FloatingShape";
import DownloadSupportPrompt from "./DownloadSupportPrompt";
import HexColorInput from "./HexColorInput";
import { GridIcon, RotateIcon } from "./PageSidebar";
import { convertImageToPdfBytes, extractPagesAndTextFromPdfBytes } from "../utils/pdfLoadUtils";
import { pickPdfLibFont, hexToRgb, loadPdfForExport } from "../utils/pdfExportUtils";
import { loadNotoFontBytes } from "../utils/fonts";
import { makeTabId, pageWordsToTextBlocks, pdfjsLib, redrawPage } from "../utils/pdfUtils";
import { CINZEL, DRAW_COLORS, FB_SIZES, FELL, GOLD, hiddenFileInput, INK, LACQUER, pageBtn, PARCHMENT, PARCHMENT_2, SCALE } from "../utils/constant";

import "./PDFEditor.css";

let floatingIdCounter = 0;


export default function PDFEditor({ pendingFile, onPendingFileConsumed, navigate }) {
  const [pdfBytes, setPdfBytes] = useState(null);

  const [pages, setPages] = useState([]);
  // Phase 6: pageOrder is an array of indices into `pages[]` describing the
  // current display order. When unmodified it equals [0,1,...,n-1]. Reorder
  // mutates this, not pages[], so textBlocks / floatingBoxes / floatingImages
  // (keyed by the immutable pg.num) keep working without renumbering.
  const [pageOrder, setPageOrder] = useState([]);
  const [rotatedPages, setRotatedPages] = useState({}); // { [pageNum]: angle }
  const [deletedPages, setDeletedPages] = useState(new Set());
  const [textBlocks, setTextBlocks] = useState({});
  const [floatingBoxes, setFloatingBoxes] = useState([]);
  const [floatingImages, setFloatingImages] = useState([]);
  const [history, setHistory] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fileName, setFileName] = useState("");

  // Multi-tab state - each loaded PDF is a "tab" with its own state snapshot
  const [tabsList, setTabsList] = useState([]); // [{ id, fileName }]
  const [activeTabId, setActiveTabId] = useState(null);
  const tabSnapshots = useRef({}); // { [id]: { pdfBytes, pages, pageOrder, textBlocks, floatingBoxes, floatingImages, history, fileName, zoom, hasTextLayer, isEncrypted, rotatedPages, deletedPages } }
  const liveStateRef = useRef({});
  const [hasTextLayer, setHasTextLayer] = useState(true);
  const [textLayerNoticeDismissed, setTextLayerNoticeDismissed] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [encryptionNoticeDismissed, setEncryptionNoticeDismissed] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [draggingImg, setDraggingImg] = useState(null);
  const [resizingImg, setResizingImg] = useState(null);
  const [resizingFb, setResizingFb] = useState(null);
  const [rotating, setRotating] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isGridView, setIsGridView] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [signatureColor, setSignatureColor] = useState("#000000");
  const [signatureTargetPageNum, setSignatureTargetPageNum] = useState(null);
  const [draggedPageNum, setDraggedPageNum] = useState(null);
  const [dragOverPageNum, setDragOverPageNum] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawPanelOpen, setDrawPanelOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [areaSelection, setAreaSelection] = useState(null);
  // { pageNum, x0, y0, x1, y1, live } — coords in page pixels (before scale)
  const selDragRef = useRef(null);
  const [drawColor, setDrawColor] = useState('#e53e3e');
  const [drawWidth, setDrawWidth] = useState(6);
  const [drawTool, setDrawTool] = useState('pencil');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSupportPrompt, setShowSupportPrompt] = useState(false);
  const [floatingShapes, setFloatingShapes] = useState([]);
  const [dragOverImagePage, setDragOverImagePage] = useState(null);
  const [ocrState, setOcrState] = useState(null); // null | 'running' | 'done' | 'error'
  const [ocrProgress, setOcrProgress] = useState({ page: 0, total: 0, pct: 0 });
  const [ocrError, setOcrError] = useState('');
  const ocrCancelRef = useRef(false);
  const ocrWorkerRef = useRef(null);
  const internalClipboardRef = useRef(null);
  const [shapePanelPage, setShapePanelPage] = useState(null);
  const [shapePanelColor, setShapePanelColor] = useState('#000000');
  const [shapePanelFill, setShapePanelFill] = useState(false);
  const [moveToPanelPage, setMoveToPanelPage] = useState(null);
  const [draggingShape, setDraggingShape] = useState(null);
  const [resizingShape, setResizingShape] = useState(null);
  const pendingEditRef = useRef(null);
  const focusedPageNumRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const imgDragOrigin = useRef(null);
  const imgResizeOrigin = useRef(null);
  const fbResizeOrigin = useRef(null);
  const shapeDragOrigin = useRef(null);
  const shapeResizeOrigin = useRef(null);
  const containerRef = useRef(null);
  const canvasRefs = useRef({});
  const drawCanvasRefs = useRef({});
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef(null);
  const addTextClickLock = useRef(false);
  const autoZoomPendingRef = useRef(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  // Close sidebar by default only on actual phone screens
  useEffect(() => { if (window.innerWidth < 480) setSidebarOpen(false); }, []);

  useEffect(() => {
    if (!pendingFile) return;
    loadPdfFromFile(pendingFile).catch(console.error).finally(() => onPendingFileConsumed?.());
  }, [pendingFile]);

  async function handleFile(e) {
    const input = e.target;
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    try {
      snapshotCurrentTab();
      const { bytes: newBytes, name: newName } = await loadPdfFromFile(file);
      const id = makeTabId();
      setTabsList(prev => [...prev, { id, fileName: newName }]);
      setActiveTabId(id);
    } catch (err) {
      console.error("Failed to load PDF/Image:", err);
      alert("Couldn't open this file: " + (err.message || err) + "\n\nTry a different file or refresh the page.");
    }
  }

  async function loadPdfFromFile(file) {
    let bytes;
    let name;
    if (file.type === "application/pdf") {
      name = file.name.match(/\.pdf$/i) ? file.name : file.name + ".pdf";
      setFileName(name);
      bytes = new Uint8Array(await file.arrayBuffer());
    } else if (file.type.startsWith("image/")) {
      name = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
      setFileName(name);
      bytes = await convertImageToPdfBytes(file);
    } else {
      throw new Error("Unsupported file type: " + file.type);
    }
    await loadPdfFromBytes(bytes);
    return { bytes, name };
  }

   async function loadPdfFromBytes(bytes) {
    setPdfBytes(bytes);

    // Phase 3 - encryption probe. pdfjs renders encrypted PDFs fine, but pdf-lib's
    // strict load throws when the trailer has /Encrypt. We use this only as a flag.
    let encrypted = false;
    try {
      await PDFDocument.load(bytes, { ignoreEncryption: false });
    } catch (probeErr) {
      if (/encrypt/i.test(probeErr?.message || "")) encrypted = true;
    }
    setIsEncrypted(encrypted);
    setEncryptionNoticeDismissed(false);

    const { pageData, words } = await extractPagesAndTextFromPdfBytes(bytes, {
      startNum: 1,
      pdfjsLib,
      SCALE,
      pageWordsToTextBlocks,
    });

    autoZoomPendingRef.current = true;
    setPages(pageData);
    setPageOrder(pageData.map((_, i) => i));
    setRotatedPages({});
    setDeletedPages(new Set());
    setTextBlocks(words);
    setFloatingBoxes([]);
    setFloatingImages([]);
    setHistory([]);
    setActivePopup(null);
    setSelected(null);
    setZoom(1);

    const totalWords = Object.values(words).reduce(
      (acc, blocks) => acc + (blocks ? blocks.length : 0),
      0
    );
    setHasTextLayer(totalWords > 0);
    setTextLayerNoticeDismissed(false);
    setOcrState(null);
    setOcrProgress({ page: 0, total: 0, pct: 0 });
    setOcrError('');
    ocrCancelRef.current = false;
    return { pageData, words };
  }

  function _ocrGetBBox(item) {
    const b = item.bbox || item;
    const x0 = b.x0 ?? b.left ?? b.x ?? 0;
    const y0 = b.y0 ?? b.top ?? b.y ?? 0;
    const x1 = b.x1 ?? b.right ?? (x0 + (b.width || 0));
    const y1 = b.y1 ?? b.bottom ?? (y0 + (b.height || 0));
    return { x0, y0, x1, y1 };
  }

  function _ocrGetItems(data) {
    const out = [];
    if (Array.isArray(data?.blocks)) {
      for (const block of data.blocks) {
        for (const para of block.paragraphs || []) {
          for (const line of para.lines || []) out.push(line);
        }
        for (const line of block.lines || []) out.push(line);
      }
    }
    if (!out.length && Array.isArray(data?.lines)) out.push(...data.lines);
    if (!out.length && Array.isArray(data?.words)) out.push(...data.words);
    return out;
  }

  function sanitizeOcrStyle(style) {
    const hexToRgb = hex => {
      const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
      if (!m) return null;
      const n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const dist = (a, b) => {
      if (!a || !b) return 999;
      return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
    };
    const lum = rgb => rgb ? 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] : 0;
    const fg = hexToRgb(style?.color);
    const bg = hexToRgb(style?.bgColor);
    const safeColor = (!fg || lum(fg) > 185 || dist(fg, bg) < 45) ? "#243241" : style.color;
    const safeBg = (!bg || lum(bg) < 160) ? "#ffffff" : style.bgColor;
    return { color: safeColor, bgColor: safeBg, isBold: !!style?.isBold, fontFamily: style?.fontFamily || "Arial, sans-serif" };
  }

  function _ocrRgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  }

  function _ocrMedianChannel(values) {
    if (!values.length) return 128;
    const s = [...values].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }

  function _ocrMedianColor(pixels) {
    // pixels: [[r,g,b], ...]
    if (!pixels.length) return [128, 128, 128];
    return [
      _ocrMedianChannel(pixels.map(p => p[0])),
      _ocrMedianChannel(pixels.map(p => p[1])),
      _ocrMedianChannel(pixels.map(p => p[2])),
    ];
  }

  function _ocrColorDist(a, b) {
    return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
  }

  // Load original page image into a sampling canvas (not the preprocessed one)
  function _ocrLoadPageCanvas(dataUrl, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    return new Promise(resolve => {
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(ctx);
      };
      img.src = dataUrl;
    });
  }

  function _ocrSampleStyle(ctx, bbox, canvasWidth, canvasHeight) {
    const { x0, y0, x1, y1 } = bbox;
    const pad = 8;
    const cx0 = Math.max(0, Math.floor(x0));
    const cy0 = Math.max(0, Math.floor(y0));
    const cx1 = Math.min(canvasWidth - 1, Math.ceil(x1));
    const cy1 = Math.min(canvasHeight - 1, Math.ceil(y1));

    // Sample background from a ring around the bbox
    const bgPx0 = Math.max(0, cx0 - pad);
    const bgPy0 = Math.max(0, cy0 - pad);
    const bgPx1 = Math.min(canvasWidth - 1, cx1 + pad);
    const bgPy1 = Math.min(canvasHeight - 1, cy1 + pad);

    const bgPixels = [];
    // top strip
    if (bgPy0 < cy0) {
      const strip = ctx.getImageData(bgPx0, bgPy0, bgPx1 - bgPx0 + 1, cy0 - bgPy0);
      for (let i = 0; i < strip.data.length; i += 4) bgPixels.push([strip.data[i], strip.data[i+1], strip.data[i+2]]);
    }
    // bottom strip
    if (cy1 < bgPy1) {
      const strip = ctx.getImageData(bgPx0, cy1 + 1, bgPx1 - bgPx0 + 1, bgPy1 - cy1);
      for (let i = 0; i < strip.data.length; i += 4) bgPixels.push([strip.data[i], strip.data[i+1], strip.data[i+2]]);
    }
    // left strip
    if (bgPx0 < cx0) {
      const strip = ctx.getImageData(bgPx0, cy0, cx0 - bgPx0, cy1 - cy0 + 1);
      for (let i = 0; i < strip.data.length; i += 4) bgPixels.push([strip.data[i], strip.data[i+1], strip.data[i+2]]);
    }
    // right strip
    if (cx1 < bgPx1) {
      const strip = ctx.getImageData(cx1 + 1, cy0, bgPx1 - cx1, cy1 - cy0 + 1);
      for (let i = 0; i < strip.data.length; i += 4) bgPixels.push([strip.data[i], strip.data[i+1], strip.data[i+2]]);
    }

    const bgColor = bgPixels.length >= 4 ? _ocrMedianColor(bgPixels) : [255, 255, 255];

    // Sample foreground from inside the bbox — pixels that contrast strongly with bg
    const fgPixels = [];
    let totalInner = 0;
    if (cx1 > cx0 && cy1 > cy0) {
      const inner = ctx.getImageData(cx0, cy0, cx1 - cx0, cy1 - cy0);
      for (let i = 0; i < inner.data.length; i += 4) {
        const px = [inner.data[i], inner.data[i+1], inner.data[i+2]];
        totalInner++;
        if (_ocrColorDist(px, bgColor) > 45) fgPixels.push(px);
      }
    }

    const fgColor = fgPixels.length >= 4 ? _ocrMedianColor(fgPixels) : [0, 0, 0];

    // Bold guess: if foreground pixel density is high (>35% of bbox area)
    const fgDensity = totalInner > 0 ? fgPixels.length / totalInner : 0;
    const isBold = fgDensity > 0.35;

    return {
      color: _ocrRgbToHex(...fgColor),
      bgColor: _ocrRgbToHex(...bgColor),
      isBold,
      fontFamily: "Arial, sans-serif",
    };
  }

  const OCR_X_PAD = 1;
  const OCR_Y_PAD = 1;
  const OCR_W_PAD = 4;
  const OCR_H_PAD = 4;

  function fitOcrFontSize(text, bbox, fontFamily, isBold) {
    const boxW = bbox.x1 - bbox.x0;
    const boxH = bbox.y1 - bbox.y0;
    const heightSize = Math.max(8, boxH * 0.78);
    if (!text.trim()) return heightSize;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${isBold ? 'bold ' : ''}${heightSize}px ${fontFamily}`;
    const measured = ctx.measureText(text).width;
    if (measured <= 0) return heightSize;
    const widthSize = heightSize * (boxW / measured);
    // Allow slight upward from height-size for wide-spaced/short text, cap at 1.15×
    return Math.max(8, Math.min(heightSize * 1.15, Math.max(heightSize * 0.4, widthSize)));
  }

  function _ocrPreprocess(dataUrl, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    return new Promise(resolve => {
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
          d[i] = d[i + 1] = d[i + 2] = contrast;
          d[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    });
  }

  async function handleActivateOCR() {
    setSelectMode(false);
    setAreaSelection(null);
    const { pages: livePages, deletedPages: liveDel, pageOrder: liveOrder } = liveStateRef.current;
    const activePages = liveOrder
      .map(i => livePages[i])
      .filter(pg => pg && !liveDel.has(pg.num));
    if (!activePages.length) return;

    ocrCancelRef.current = false;
    setOcrError('');
    setOcrState('running');
    setOcrProgress({ page: 0, total: activePages.length, pct: 0 });

    let worker;
    try {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(p => ({ ...p, pct: Math.round(m.progress * 100) }));
          }
        },
      });
      ocrWorkerRef.current = worker;

      saveHistory();
      const newTextBlocksByPage = {};
      let lastOCRText = "";

      for (let i = 0; i < activePages.length; i++) {
        if (ocrCancelRef.current) {
          await worker.terminate();
          ocrWorkerRef.current = null;
          setOcrState(null);
          return;
        }
        const pg = activePages[i];
        setOcrProgress({ page: i + 1, total: activePages.length, pct: 0 });

        const [processedUrl, samplingCtx] = await Promise.all([
          _ocrPreprocess(pg.dataUrl, pg.width, pg.height),
          _ocrLoadPageCanvas(pg.dataUrl, pg.width, pg.height),
        ]);

        const result = await worker.recognize(
          processedUrl,
          {},
          {
            text: true,
            blocks: true,
            hocr: false,
            tsv: false,
            box: false,
            unlv: false,
            osd: false,
            pdf: false,
            imageColor: false,
            imageGrey: false,
            imageBinary: false,
          }
        );
        const { data } = result;

        lastOCRText += "\n" + (data.text || "");

        const rawLines = _ocrGetItems(data);
        const stripEmoji = t => t.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{20D0}-\u{20FF}]/gu, '').trim();

        const pageBlocks = rawLines
          .map(line => ({ ...line, _text: stripEmoji(line.text || "") }))
          .filter(line => line._text && (line.confidence == null || line.confidence > 20))
          .map((line, li) => {
            const bbox = _ocrGetBBox(line);
            const style = sanitizeOcrStyle(_ocrSampleStyle(samplingCtx, bbox, pg.width, pg.height));
            const fontSize = fitOcrFontSize(line._text, bbox, style.fontFamily, style.isBold);
            const baselineY = bbox.y0 + fontSize * 0.92;
            const y = Math.max(0, baselineY - fontSize * 1.02);
            return {
              id: `ocr-${pg.num}-L${li}`,
              page: pg.num,
              text: line._text,
              x: Math.max(0, bbox.x0 - OCR_X_PAD),
              y,
              width: Math.max(bbox.x1 - bbox.x0 + OCR_W_PAD, 10),
              height: Math.max(bbox.y1 - bbox.y0 + OCR_H_PAD, fontSize * 1.25),
              baselineY,
              lineBaselines: [baselineY],
              fontSize,
              fontFamily: style.fontFamily,
              isBold: style.isBold,
              isItalic: false,
              color: style.color,
              bgColor: style.bgColor,
              edited: false,
              ocr: true,
            };
          });
        newTextBlocksByPage[pg.num] = pageBlocks;

        await new Promise(r => setTimeout(r, 10));
      }

      await worker.terminate();
      ocrWorkerRef.current = null;

      const totalFound = Object.values(newTextBlocksByPage).reduce((s, arr) => s + arr.length, 0);
      if (totalFound === 0) {
        if (lastOCRText.trim()) {
          setOcrError("Text was detected, but text positions were not returned. OCR layout output is missing.");
        } else {
          setOcrError("No readable text was found.");
        }
        setOcrState('error');
        return;
      }

      setTextBlocks(prev => {
        const next = { ...prev };
        for (const [pageNum, blocks] of Object.entries(newTextBlocksByPage)) {
          const existing = next[pageNum] || [];
          next[pageNum] = [...existing.filter(b => !b.ocr), ...blocks];
        }
        return next;
      });
      setHasTextLayer(true);
      setTextLayerNoticeDismissed(true);
      setOcrState('done');
    } catch (err) {
      const msg = err?.message || String(err);
      console.error("OCR error:", msg);
      if (worker) { try { await worker.terminate(); } catch (_) {} }
      ocrWorkerRef.current = null;
      setOcrError(msg);
      setOcrState('error');
    }
  }

  async function handleCancelOCR() {
    ocrCancelRef.current = true;
    if (ocrWorkerRef.current) {
      try { await ocrWorkerRef.current.terminate(); } catch (_) {}
      ocrWorkerRef.current = null;
    }
    setOcrState(null);
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

  useEffect(() => {
    if (!pages.length || !autoZoomPendingRef.current) return;
    autoZoomPendingRef.current = false;
    const id = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el) return;
      const pg = pages[0];
      if (!pg) return;
      const availW = Math.max(200, el.clientWidth - 80);
      setZoom(Math.min(0.9, Math.max(0.3, +(availW / pg.width).toFixed(2))));
    });
    return () => cancelAnimationFrame(id);
  }, [pages]);

  // Mirror live state into a ref so snapshotCurrent always reads fresh values
  useEffect(() => {
    liveStateRef.current = {
      pdfBytes, pages, pageOrder, textBlocks, floatingBoxes, floatingImages, floatingShapes, history, fileName, zoom, hasTextLayer, isEncrypted,
      rotatedPages, deletedPages, selected, areaSelection, selectMode,
    };
  });

  // Paste images from clipboard (Ctrl+V or right-click → Paste)
  useEffect(() => {
    const handlePaste = (e) => {
      if (!liveStateRef.current.pages?.length) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.contentEditable === 'true') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = ev => {
            const { pages } = liveStateRef.current;
            const pageNum = focusedPageNumRef.current || pages[0]?.num;
            if (!pageNum) return;
            const pg = pages.find(p => p.num === pageNum);
            saveHistory();
            floatingIdCounter++;
            setFloatingImages(prev => [...prev, {
              id: `paste-${floatingIdCounter}`,
              page: pageNum,
              z: 50 + floatingIdCounter,
              x: Math.max(0, (pg?.width || 600) / 2 - 100),
              y: Math.max(0, (pg?.height || 800) / 2 - 75),
              w: 200, h: 150,
              dataUrl: ev.target.result,
            }]);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Keyboard shortcuts: Escape, Ctrl+C/X/V for floating objects
  useEffect(() => {
    const isTyping = t => {
      const tag = t?.tagName?.toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select' || !!t?.isContentEditable;
    };

    const snapHistory = (ref) => {
      const { textBlocks, floatingBoxes, floatingImages, floatingShapes, rotatedPages, deletedPages } = ref.current;
      setHistory(prev => [...prev.slice(-29), {
        textBlocks: JSON.parse(JSON.stringify(textBlocks || [])),
        floatingBoxes: JSON.parse(JSON.stringify(floatingBoxes || [])),
        floatingImages: JSON.parse(JSON.stringify(floatingImages || [])),
        floatingShapes: JSON.parse(JSON.stringify(floatingShapes || [])),
        rotatedPages: { ...(rotatedPages || {}) },
        deletedPages: new Set(deletedPages),
      }]);
    };

    const onKey = e => {
      const { selected, areaSelection, selectMode,
              floatingImages, floatingBoxes, floatingShapes } = liveStateRef.current;

      if (e.key === 'Escape') {
        if (areaSelection) { setAreaSelection(null); return; }
        if (selectMode) { setSelectMode(false); return; }
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (isTyping(e.target)) return;

      if (e.key === 'c' || e.key === 'C') {
        if (!selected) return;
        const img = floatingImages?.find(fi => fi.id === selected);
        if (img) { internalClipboardRef.current = { type: 'image', item: JSON.parse(JSON.stringify(img)) }; e.preventDefault(); return; }
        const box = floatingBoxes?.find(fb => fb.id === selected);
        if (box) { internalClipboardRef.current = { type: 'box', item: JSON.parse(JSON.stringify(box)) }; e.preventDefault(); return; }
        const shape = floatingShapes?.find(s => s.id === selected);
        if (shape) { internalClipboardRef.current = { type: 'shape', item: JSON.parse(JSON.stringify(shape)) }; e.preventDefault(); return; }
      }

      if (e.key === 'x' || e.key === 'X') {
        if (!selected) return;
        const img = floatingImages?.find(fi => fi.id === selected);
        if (img) {
          internalClipboardRef.current = { type: 'image', item: JSON.parse(JSON.stringify(img)) };
          snapHistory(liveStateRef);
          setFloatingImages(prev => prev.filter(fi => fi.id !== selected));
          setSelected(null); e.preventDefault(); return;
        }
        const box = floatingBoxes?.find(fb => fb.id === selected);
        if (box) {
          internalClipboardRef.current = { type: 'box', item: JSON.parse(JSON.stringify(box)) };
          snapHistory(liveStateRef);
          setFloatingBoxes(prev => prev.filter(fb => fb.id !== selected));
          setSelected(null); e.preventDefault(); return;
        }
        const shape = floatingShapes?.find(s => s.id === selected);
        if (shape) {
          internalClipboardRef.current = { type: 'shape', item: JSON.parse(JSON.stringify(shape)) };
          snapHistory(liveStateRef);
          setFloatingShapes(prev => prev.filter(s => s.id !== selected));
          setSelected(null); e.preventDefault(); return;
        }
      }

      if (e.key === 'v' || e.key === 'V') {
        if (!internalClipboardRef.current) return; // fall through to system paste event
        const clip = internalClipboardRef.current;
        snapHistory(liveStateRef);
        floatingIdCounter++;
        const offset = 24;
        if (clip.type === 'image') {
          const newItem = { ...clip.item, id: `img-${floatingIdCounter}`, x: clip.item.x + offset, y: clip.item.y + offset, z: 50 + floatingIdCounter };
          setFloatingImages(prev => [...prev, newItem]);
          setSelected(newItem.id); e.preventDefault(); return;
        }
        if (clip.type === 'box') {
          const newItem = { ...clip.item, id: `float-${floatingIdCounter}`, x: clip.item.x + offset, y: clip.item.y + offset, z: 50 + floatingIdCounter };
          setFloatingBoxes(prev => [...prev, newItem]);
          setSelected(newItem.id); e.preventDefault(); return;
        }
        if (clip.type === 'shape') {
          const newItem = { ...clip.item, id: `shape-${floatingIdCounter}`, x: clip.item.x + offset, y: clip.item.y + offset, z: 50 + floatingIdCounter };
          setFloatingShapes(prev => [...prev, newItem]);
          setSelected(newItem.id); e.preventDefault(); return;
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // reads fresh state from liveStateRef every keypress

  // Warn on browser refresh/tab-close when a PDF is open
  useEffect(() => {
    const onBeforeUnload = e => {
      if (!pdfBytes) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [pdfBytes]);

  function snapshotCurrentTab() {
    if (!activeTabId) return;
    const snap = liveStateRef.current;
    tabSnapshots.current[activeTabId] = {
      ...snap,
      // Convert Set to Array for JSON serialization
      deletedPages: [...(snap.deletedPages || [])],
    };
  }

  function restoreSnapshot(snap) {
    setPdfBytes(snap.pdfBytes);
    setPages(snap.pages);
    setPageOrder(snap.pageOrder ?? snap.pages.map((_, i) => i));
    setRotatedPages(snap.rotatedPages || {});
    setDeletedPages(new Set(snap.deletedPages || []));
    setTextBlocks(snap.textBlocks);
    setFloatingBoxes(snap.floatingBoxes);
    setFloatingImages(snap.floatingImages);
    setHistory(snap.history);
    setFileName(snap.fileName);
    setZoom(snap.zoom);
    setHasTextLayer(snap.hasTextLayer !== undefined ? snap.hasTextLayer : true);
    setIsEncrypted(snap.isEncrypted ?? false);
    setEncryptionNoticeDismissed(false);
    setSelected(null);
    setActivePopup(null);
  }

  function switchTab(id) {
    if (id === activeTabId) return;
    snapshotCurrentTab();
    const snap = tabSnapshots.current[id];
    if (!snap) return;
    restoreSnapshot(snap);
    setActiveTabId(id);
  }

  // Close the editor entirely and return to the homepage. Wired to the
  // \'katanapdf\' wordmark in the editor toolbar - without this the link only
  // updates the URL hash and the editor still renders because pages.length > 0.
  function doGoHome() {
    tabSnapshots.current = {};
    setTabsList([]);
    setActiveTabId(null);
    setPages([]);
    setPageOrder([]);
    setRotatedPages({});
    setDeletedPages(new Set());
    setTextBlocks({});
    setFloatingBoxes([]);
    setFloatingImages([]);
    setHistory([]);
    setFileName("");
    setPdfBytes(null);
    setIsEncrypted(false);
    setEncryptionNoticeDismissed(false);
    setHasTextLayer(true);
    setTextLayerNoticeDismissed(false);
    setSelected(null);
    setActivePopup(null);
    setShowSupportPrompt(false);
  }

  function goHome() {
    if (pdfBytes) { setShowLeaveConfirm(true); return; }
    doGoHome();
  }

  function closeTab(id) {
    delete tabSnapshots.current[id];
    setTabsList(prev => {
      const next = prev.filter(t => t.id !== id);
      if (id === activeTabId) {
        if (next.length) {
          // Activate the first remaining tab
          const newActive = next[0].id;
          const snap = tabSnapshots.current[newActive];
          if (snap) restoreSnapshot(snap);
          setActiveTabId(newActive);
        } else {
          // No tabs left - return to homepage
          setPages([]);
          setPageOrder([]);
          setRotatedPages({});
          setDeletedPages(new Set());
          setTextBlocks({});
          setFloatingBoxes([]);
          setFloatingImages([]);
          setHistory([]);
          setFileName("");
          setPdfBytes(null);
          setActiveTabId(null);
        }
      }
      return next;
    });
  }

  function movePageTo(pageNum, targetDisplayIdx) {
    saveHistory();
    setPageOrder(prev => {
      const pageOrderIdx = prev.findIndex(pIdx => pages[pIdx]?.num === pageNum);
      if (pageOrderIdx === -1) return prev;

      const next = [...prev];
      const [item] = next.splice(pageOrderIdx, 1);

      let visibleCount = 0;
      let insertIdx = next.length;
      for (let i = 0; i < next.length; i++) {
        if (visibleCount === targetDisplayIdx) {
          insertIdx = i;
          break;
        }
        const pIdx = next[i];
        const pg = pages[pIdx];
        if (pg && !deletedPages.has(pg.num)) {
          visibleCount++;
        }
      }
      
      next.splice(insertIdx, 0, item);
      return next;
    });
  }

  // Phase 7: delete/rotate pages. These are soft-deletes/rotates, tracked in
  // state and applied to the UI immediately, but only committed to the PDF on
  // download.
  function deletePage(pageNum) {
    saveHistory();
    setDeletedPages(prev => new Set(prev).add(pageNum));
  }

  function rotatePage(pageNum) {
    saveHistory();
    setRotatedPages(prev => ({
      ...prev,
      [pageNum]: ((prev[pageNum] || 0) + 90) % 360,
    }));
  }

  function addBlankPage(afterPageNum) {
    saveHistory();
    const refPage = pages.find(p => p.num === afterPageNum);
    const w = refPage ? refPage.width : 612 * SCALE;
    const h = refPage ? refPage.height : 792 * SCALE;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/png");
    const newNum = Math.max(0, ...pages.map(p => p.num)) + 1;
    const newPage = { num: newNum, dataUrl, width: w, height: h };
    const newPageIdx = pages.length;
    const insertAfterPos = pageOrder.findIndex(idx => pages[idx]?.num === afterPageNum);
    setPages(prev => [...prev, newPage]);
    setPageOrder(prev => {
      const next = [...prev];
      next.splice(insertAfterPos + 1, 0, newPageIdx);
      return next;
    });
  }

  async function createBlankPdf() {
    snapshotCurrentTab();
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]); // US Letter
    const bytes = await doc.save();
    setFileName("blank.pdf");
    await loadPdfFromBytes(bytes);
    setHasTextLayer(true);
    setFloatingShapes([]);
    const id = makeTabId();
    setTabsList(prev => [...prev, { id, fileName: "blank.pdf" }]);
    setActiveTabId(id);
  }

  async function handleDroppedFile(file) {
    if (!file) return;
    try {
      snapshotCurrentTab();
      await loadPdfFromFile(file);
      const id = makeTabId();
      setTabsList(prev => [...prev, { id, fileName: file.name.match(/\.pdf$/i) ? file.name : file.name.replace(/\.[^/.]+$/, "") + ".pdf" }]);
      setActiveTabId(id);
    } catch (err) {
      console.error("Drop error:", err);
    }
  }

  function saveHistory() {
    setHistory(prev => [...prev.slice(-29), {
      textBlocks: JSON.parse(JSON.stringify(textBlocks)),
      floatingBoxes: JSON.parse(JSON.stringify(floatingBoxes)),
      floatingImages: JSON.parse(JSON.stringify(floatingImages)),
      floatingShapes: JSON.parse(JSON.stringify(floatingShapes)),
      rotatedPages: { ...rotatedPages },
      deletedPages: new Set(deletedPages),
    }]);
  }

  function undo() {
    if (!history.length) return;
    const snap = history[history.length - 1];
    setTextBlocks(snap.textBlocks);
    setFloatingBoxes(snap.floatingBoxes);
    setFloatingImages(snap.floatingImages || []);
    setFloatingShapes(snap.floatingShapes || []);
    if (snap.rotatedPages) setRotatedPages(snap.rotatedPages);
    if (snap.deletedPages) setDeletedPages(snap.deletedPages);
    setHistory(h => h.slice(0, -1));
    setActivePopup(null);
    setSelected(null);
  }

  function commitEdit(blockId, pageNum, newText, ox = 0, oy = 0, fmt = {}) {
    setTextBlocks(prev => ({
      ...prev,
      [pageNum]: prev[pageNum].map(w => {
        if (w.id !== blockId) return w;
        const ff = fmt.fontFamily || w.fontFamily || "Arial, sans-serif";
        const fs = (fmt.fontSize || Math.round((w.fontSize || 14) / SCALE)) * SCALE;
        const newLines = newText.split(/\r?\n/);
        const approxW = Math.max(w.width, newLines.reduce((m, l) => Math.max(m, l.length * fs * 0.55), 0) + 12);
        const approxH = Math.max(w.height, newLines.length * fs * 1.28 + 10);
        return {
          ...w,
          text: newText,
          edited: true,
          width: approxW,
          height: approxH,
          fontFamily: ff,
          fontSize: fs,
          isBold: fmt.isBold ?? w.isBold ?? false,
          isItalic: fmt.isItalic ?? w.isItalic ?? false,
          color: fmt.color || w.color || "#000000",
          bgColor: fmt.bgColor || w.bgColor || "transparent",
          angle: fmt.angle ?? w.angle ?? 0,
          x: w.x + ox,
          y: w.y + oy,
          baselineY: w.baselineY !== undefined ? w.baselineY + oy : undefined,
          lineBaselines: undefined
        };
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
    saveHistory();
    setSelected(tb.id);
    setActivePopup({ blockId: tb.id, pageNum: tb.page, offsetX: 0, offsetY: 0 });
  }

  function handleBgClick() {
    // Auto-delete any selected floating box that was left empty
    setFloatingBoxes(prev => prev.filter(fb => fb.id !== selected || (fb.text || "").trim() !== ""));
    // If an EditPopup is open, commit whatever was typed instead of discarding
    if (activePopup && pendingEditRef.current) {
      const { text, fmt } = pendingEditRef.current;
      pendingEditRef.current = null;
      commitEdit(activePopup.blockId, activePopup.pageNum, text, activePopup.offsetX ?? 0, activePopup.offsetY ?? 0, fmt);
    } else {
      setActivePopup(null);
      setSelected(null);
    }
    setShapePanelPage(null);
    setMoveToPanelPage(null);
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
    if (addTextClickLock.current) return;

    addTextClickLock.current = true;
    window.setTimeout(() => {
      addTextClickLock.current = false;
    }, 250);

    const pg = pages.find(p => p.num === pageNum);
    if (!pg) return;
    saveHistory();
    floatingIdCounter++;
    const id = `float-${floatingIdCounter}`;
    const rot = rotatedPages[pageNum] || 0;
    const swap = rot === 90 || rot === 270;
    const visW = swap ? pg.height : pg.width;
    const visH = swap ? pg.width : pg.height;
    const visX = visW / 2;
    const visY = Math.max(60, visH * 0.10);
    const rad = -rot * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const dx = visX - visW / 2, dy = visY - visH / 2;
    const pageX = pg.width / 2 + dx * cos - dy * sin;
    const pageY = pg.height / 2 + dx * sin + dy * cos;

    setFloatingBoxes(prev => [...prev, {
      id, page: pageNum,
      z: 50 + floatingIdCounter,
      x: pageX, y: pageY, text: "",
      fontSize: 14, fontFamily: "Arial, sans-serif",
      isBold: false, isItalic: false, color: "#000000",
      bgColor: "#ffffff",
      angle: 0,
    }]);
    setSelected(id); // auto-select so the textarea focuses immediately
  }

  function updateFloatingBox(id, updates) {
    // Determine if this update needs a history save (e.g. text changing should maybe not save per keystroke, but property changes should).
    // Actually, saveHistory is called before dragging/resizing starts, so it's safe to not call it here.
    // For text editing, we could save history on select instead.
    setFloatingBoxes(prev => prev.map(fb => fb.id === id ? { ...fb, ...updates } : fb));
  }

  function deleteFloatingBox(id) {
    saveHistory();
    setFloatingBoxes(prev => prev.filter(fb => fb.id !== id));
  }

  function handleAddImage(e, pageNum) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = ev => {
      saveHistory();
      floatingIdCounter++;
      const id = `img-${floatingIdCounter}`;
      const pg = pages.find(p => p.num === pageNum);
      setFloatingImages(prev => [...prev, {
        id, page: pageNum,
        z: 50 + floatingIdCounter,
        x: (pg?.width || 600) / 2 - 60, y: (pg?.height || 800) / 2 - 20, w: 200, h: 150,
        dataUrl: ev.target.result,
      }]);
      setSelected(id);
    };
    reader.readAsDataURL(file);
  }

  function drawShapeOnCanvas(ctx, shape) {
    const { x, y, w, h, shapeType, shapeColor, shapeFill } = shape;
    ctx.strokeStyle = shapeColor;
    ctx.fillStyle = shapeColor;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (shapeType === "circle") {
      ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI*2);
      ctx.lineWidth = 3;
      if (shapeFill) ctx.fill(); else ctx.stroke();
    } else if (shapeType === "square") {
      ctx.rect(x, y, w, h);
      ctx.lineWidth = 3;
      if (shapeFill) ctx.fill(); else ctx.stroke();
    } else if (shapeType === "checkmark") {
      ctx.moveTo(x + w*0.1, y + h*0.6); ctx.lineTo(x + w*0.38, y + h*0.85); ctx.lineTo(x + w*0.9, y + h*0.18);
      ctx.lineWidth = Math.max(2, w*0.07); ctx.stroke();
    } else if (shapeType === "cross") {
      ctx.moveTo(x + w*0.12, y + h*0.12); ctx.lineTo(x + w*0.88, y + h*0.88);
      ctx.moveTo(x + w*0.88, y + h*0.12); ctx.lineTo(x + w*0.12, y + h*0.88);
      ctx.lineWidth = Math.max(2, w*0.07); ctx.stroke();
    } else if (shapeType === "line") {
      ctx.moveTo(x + w*0.05, y + h*0.5); ctx.lineTo(x + w*0.95, y + h*0.5);
      ctx.lineWidth = Math.max(2, h*0.07); ctx.stroke();
    } else if (shapeType === "arrow") {
      ctx.moveTo(x + w*0.05, y + h*0.5); ctx.lineTo(x + w*0.82, y + h*0.5);
      ctx.moveTo(x + w*0.6, y + h*0.22); ctx.lineTo(x + w*0.92, y + h*0.5); ctx.lineTo(x + w*0.6, y + h*0.78);
      ctx.lineWidth = Math.max(2, h*0.07); ctx.stroke();
    }
  }

  function handleAddShape(pageNum, shapeType) {
    const pg = pages.find(p => p.num === pageNum);
    if (!pg) return;
    saveHistory();
    floatingIdCounter++;
    const id = `shape-${floatingIdCounter}`;
    const size = Math.min(pg.width, pg.height) * 0.25;

    let initialY = pg.height * 0.15;
    if (containerRef.current) {
      const el = containerRef.current.querySelector(`[data-pgwrap="${pageNum}"]`);
      if (el) {
        const scrollWithinPage = Math.max(0, containerRef.current.scrollTop - el.offsetTop);
        const visibleY = scrollWithinPage / zoom + 60;
        initialY = Math.min(Math.max(visibleY, 20), pg.height * 0.75 - size);
      }
    }

    setFloatingShapes(prev => [...prev, {
      id,
      page: pageNum,
      z: 50 + floatingIdCounter,
      x: pg.width / 2 - size / 2,
      y: initialY,
      w: size,
      h: size,
      shapeType,
      shapeColor: shapePanelColor,
      shapeFill: shapePanelFill,
    }]);
    setSelected(id);
    setShapePanelPage(null);
    setTimeout(() => {
      const el = containerRef.current?.querySelector(`[data-pgwrap="${pageNum}"]`);
      if (el && containerRef.current) {
        const target = el.offsetTop + initialY * zoom - 80;
        containerRef.current.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
      }
    }, 50);
  }

  function updateFloatingShape(id, updates) {
    setFloatingShapes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }

  function deleteFloatingShape(id) {
    saveHistory();
    setFloatingShapes(prev => prev.filter(s => s.id !== id));
  }

  function startDragShape(e, shape) {
    e.preventDefault();
    e.stopPropagation();
    saveHistory();
    setSelected(shape.id);
    shapeDragOrigin.current = { mx: e.clientX, my: e.clientY, x: shape.x, y: shape.y, rotation: rotatedPages[shape.page] || 0 };
    setDraggingShape({ id: shape.id });
  }

  function startResizeShape(e, shape, axis = 'se') {
    e.preventDefault();
    e.stopPropagation();
    shapeResizeOrigin.current = { mx: e.clientX, my: e.clientY, w: shape.w, h: shape.h, axis, rotation: rotatedPages[shape.page] || 0 };
    setResizingShape({ id: shape.id });
  }
  function handleSelMouseDown(e, pgNum, scale) {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    selDragRef.current = { pageNum: pgNum, startX: x, startY: y, curX: x, curY: y };
    setAreaSelection(null);
  }

  function handleSelMouseMove(e, pgNum, scale) {
    if (!selDragRef.current || selDragRef.current.pageNum !== pgNum) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    selDragRef.current.curX = x;
    selDragRef.current.curY = y;
    const { startX, startY } = selDragRef.current;
    setAreaSelection({
      pageNum: pgNum,
      x0: Math.min(startX, x), y0: Math.min(startY, y),
      x1: Math.max(startX, x), y1: Math.max(startY, y),
      live: true,
    });
  }

  function handleSelMouseUp(e, pgNum, scale) {
    if (!selDragRef.current || selDragRef.current.pageNum !== pgNum) return;
    const { startX, startY, curX, curY } = selDragRef.current;
    selDragRef.current = null;
    const x0 = Math.min(startX, curX), y0 = Math.min(startY, curY);
    const x1 = Math.max(startX, curX), y1 = Math.max(startY, curY);
    if (x1 - x0 < 4 || y1 - y0 < 4) { setAreaSelection(null); return; }
    setAreaSelection({ pageNum: pgNum, x0, y0, x1, y1, live: false });
  }

  async function copySelectedArea() {
    if (!areaSelection) return false;
    const { pageNum, x0, y0, x1, y1 } = areaSelection;
    const pg = pages.find(p => p.num === pageNum);
    if (!pg) return false;
    const w = Math.max(1, Math.round(x1 - x0));
    const h = Math.max(1, Math.round(y1 - y0));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    await new Promise(res => { img.onload = res; img.src = pg.dataUrl; });
    ctx.drawImage(img, Math.round(x0), Math.round(y0), w, h, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/png');
    internalClipboardRef.current = { type: 'area-image', page: pageNum, dataUrl, w, h, sourceX: x0, sourceY: y0 };
    // Optional: also write to system clipboard. Ignore failure.
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (blob) await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      }
    } catch (_) { /* internal clipboard is sufficient */ }
    return true;
  }

  async function eraseSelectedArea(fillColor = '#ffffff') {
    if (!areaSelection) return;
    const { pageNum, x0, y0, x1, y1 } = areaSelection;
    const pg = pages.find(p => p.num === pageNum);
    if (!pg) return;
    saveHistory();
    const canvas = document.createElement('canvas');
    canvas.width = pg.width; canvas.height = pg.height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    await new Promise(res => { img.onload = res; img.src = pg.dataUrl; });
    ctx.drawImage(img, 0, 0);
    ctx.fillStyle = fillColor;
    ctx.fillRect(Math.floor(x0), Math.floor(y0), Math.ceil(x1 - x0), Math.ceil(y1 - y0));
    const newDataUrl = canvas.toDataURL('image/png');
    setPages(prev => prev.map(p => p.num === pageNum ? { ...p, dataUrl: newDataUrl } : p));
    setAreaSelection(null);
  }

  async function cutSelectedArea() {
    const copied = await copySelectedArea();
    if (!copied) return;
    await eraseSelectedArea('#ffffff');
  }

  function pasteSelectedArea() {
    const clip = internalClipboardRef.current;
    if (!clip || clip.type !== 'area-image') return false;
    const targetPage =
      pages.find(p => p.num === clip.page && !deletedPages.has(p.num))?.num ||
      focusedPageNumRef.current ||
      visiblePages[0]?.num ||
      pages[0]?.num;
    if (!targetPage) return false;
    saveHistory();
    floatingIdCounter++;
    const id = `img-${floatingIdCounter}`;
    setFloatingImages(prev => [...prev, {
      id, page: targetPage, z: 50 + floatingIdCounter,
      x: Math.max(0, (clip.sourceX || 0) + 24),
      y: Math.max(0, (clip.sourceY || 0) + 24),
      w: clip.w, h: clip.h, dataUrl: clip.dataUrl,
    }]);
    setSelected(id);
    setAreaSelection(null);
    return true;
  }

  function handleDrawStart(e, pgNum, scale) {
    if (!drawMode) return;
    e.preventDefault();
    setDrawPanelOpen(false);
    isDrawingRef.current = true;
    const canvas = drawCanvasRefs.current[pgNum];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;
    const ctx = canvas.getContext('2d');
    const isHL = drawTool === 'highlighter';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = isHL ? 'square' : 'round';
    ctx.lineJoin = 'round';
    currentStrokeRef.current = { pgNum, ctx, canvas, color: drawColor, width: drawWidth, startX: x, startY: y, hasMoved: false, isHighlighter: isHL, points: isHL ? [{x, y}] : null };
  }

  function handleDrawMove(e, pgNum, scale) {
    if (!isDrawingRef.current || !currentStrokeRef.current || currentStrokeRef.current.pgNum !== pgNum) return;
    e.preventDefault();
    const stroke = currentStrokeRef.current;
    const { ctx, canvas } = stroke;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;
    if (stroke.isHighlighter) {
      stroke.points.push({x, y});
      // Redraw entire path at once so semi-transparency doesn't compound
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'square';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      ctx.stroke();
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    stroke.hasMoved = true;
  }

  function handleDrawEnd(pgNum, pg) {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;
    const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    const { canvas, ctx, hasMoved, startX, startY, color, width, isHighlighter } = stroke;
    if (!hasMoved) {
      // Tap with no drag: draw a dot. Highlighter uses 40% alpha.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = isHighlighter ? 0.4 : 1.0;
      ctx.beginPath();
      ctx.arc(startX, startY, width / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    // Highlighter + drag: snap to a clean horizontal rectangle so it lines up with text.
    let hlRect = null;
    if (isHighlighter && hasMoved && stroke.points && stroke.points.length > 1) {
      const pts = stroke.points;
      const minX = Math.min(...pts.map(p => p.x));
      const maxX = Math.max(...pts.map(p => p.x));
      const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      hlRect = { x: minX, y: avgY - width / 2, w: maxX - minX, h: width, color };
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = color;
      ctx.fillRect(minX, avgY - width / 2, maxX - minX, width);
    }
    saveHistory();
    const dataUrl = canvas.toDataURL('image/png');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    floatingIdCounter++;
    const id = `draw-${floatingIdCounter}`;
    setFloatingImages(prev => [...prev, {
      id,
      page: pgNum,
      z: 50 + floatingIdCounter,
      x: 0,
      y: 0,
      w: pg.width,
      h: pg.height,
      dataUrl,
      isDrawStroke: true,
      ...(hlRect ? { isHighlight: true, hlRect } : {}),
    }]);
  }

  function handleInsertSignature(dataUrl) {
    saveHistory();
    floatingIdCounter++;
    const id = `img-${floatingIdCounter}`;
    let targetPageNum = signatureTargetPageNum ?? (
      pages.length
        ? pageOrder.map(pIdx => pages[pIdx]).filter(pg => pg && !deletedPages.has(pg.num))[0]?.num
        : null
    );
    
    // Attempt to find the most visible page
    if (containerRef.current) {
      const windowHeight = window.innerHeight;
      let maxVisibleHeight = 0;
      containerRef.current.querySelectorAll("[data-pgwrap]").forEach(el => {
        const rect = el.getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          const pgNum = parseInt(el.getAttribute("data-pgwrap"), 10);
          if (!isNaN(pgNum)) targetPageNum = pgNum;
        }
      });
    }

    if (targetPageNum == null) targetPageNum = pages[0]?.num;
    if (targetPageNum == null) return;

    // Center of viewport roughly
    // The exact position inside the page would depend on scale, but 60, 60 is what handleAddImage uses.
    // Let's use 100, 100 for better visibility.
    setFloatingImages(prev => [...prev, {
      id, page: targetPageNum,
      z: 50 + floatingIdCounter,
      x: 100, y: 100, w: 180, h: 70,
      dataUrl,
    }]);
    setSelected(id);
    setSignatureTargetPageNum(null);
    setIsSignModalOpen(false);
  }

  // Append another PDF or Image's pages to the current document - fully editable like original pages
  async function handleAppendFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    try {
      saveHistory();
      let bytes;
      if (file.type.startsWith("image/")) {
        bytes = await convertImageToPdfBytes(file);
      } else {
        const buf = await file.arrayBuffer();
        bytes = new Uint8Array(buf);
      }
            const startNum = pages.length + 1;

      const { pageData: newPages, words: appendedWords } =
        await extractPagesAndTextFromPdfBytes(bytes, {
          startNum,
          pdfjsLib,
          SCALE,
          pageWordsToTextBlocks,
        });

      const newWords = {
        ...textBlocks,
        ...appendedWords,
      };

      // Stage 1: keep pdfBytes in sync with the visible page list so the
      // default export path includes appended pages with their original
      // vector content. Without this, handleDownload silently drops them
      // (the docPages[pgIdx] lookup returns undefined past the original
      // page count). On merge failure the canvas fallback in handleDownload
      // catches the mismatch and rasterises instead.
      let mergedBytes = pdfBytes;
      try {
        const baseDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const addedDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copied = await baseDoc.copyPages(addedDoc, addedDoc.getPageIndices());
        for (const p of copied) baseDoc.addPage(p);
        mergedBytes = await baseDoc.save();
      } catch (mergeErr) {
        console.warn("Append-PDF merge failed; download will use canvas fallback for the appended pages:", mergeErr);
      }

      setPages(prev => [...prev, ...newPages]);
      // Append the new page indices onto pageOrder so merged pages land at the end.
      setPageOrder(prev => [...prev, ...newPages.map((_, j) => prev.length + j)]);
      setTextBlocks(newWords);
      setPdfBytes(mergedBytes);
      setTimeout(snapshotCurrentTab, 0); // Wait for state to settle before taking snapshot
    } catch (err) {
      console.error("Add PDF error:", err);
      alert("Couldn't append this PDF: " + (err.message || err));
    }
  }

  function deleteFloatingImage(id) {
    saveHistory();
    setFloatingImages(prev => prev.filter(fi => fi.id !== id));
  }

  function startDragImg(e, fi) {
    e.preventDefault();
    e.stopPropagation();
    saveHistory();
    setSelected(fi.id);
    imgDragOrigin.current = { mx: e.clientX, my: e.clientY, x: fi.x, y: fi.y };
    setDraggingImg({ id: fi.id });
  }

  function startResizeImg(e, fi, corner = 'se') {
    e.preventDefault();
    e.stopPropagation();
    saveHistory();
    imgResizeOrigin.current = { mx: e.clientX, my: e.clientY, w: fi.w, h: fi.h, x: fi.x, y: fi.y, ratio: (fi.w / fi.h) || 1, corner };
    setResizingImg({ id: fi.id });
  }

  // Drag the corner handle on a text box to scale fontSize. Diagonal drag
  // (down-right grows, up-left shrinks) feels closest to the picture
  // resize that scales the image.
  function startResizeFb(e, fb, axis = 'both') {
    e.preventDefault();
    e.stopPropagation();
    saveHistory();
    fbResizeOrigin.current = { mx: e.clientX, my: e.clientY, fs: fb.fontSize, axis };
    setResizingFb({ id: fb.id });
  }

  function startDragFloat(e, fb) {
    e.preventDefault();
    e.stopPropagation();
    saveHistory();
    setDragging({
      id: fb.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: fb.x,
      origY: fb.y,
      rotation: rotatedPages[fb.page] || 0
    });
  }

  function startRotateFb(e, fb) {
    e.preventDefault();
    e.stopPropagation();
    saveHistory();
    const pgWrap = e.currentTarget.closest("[data-pgwrap]");
    if (!pgWrap) return;
    const rect = pgWrap.getBoundingClientRect();
    const rotation = rotatedPages[fb.page] || 0;
    const alpha = rotation * Math.PI / 180;
    
    // Page center in screen pixels
    const pcx = rect.left + rect.width / 2;
    const pcy = rect.top + rect.height / 2;

    // Box center relative to page center in PDF points
    const pg = pages.find(p => p.num === fb.page);
    if (!pg) return;
    const rx = fb.x - pg.width / 2;
    const ry = fb.y - pg.height / 2;
    
    // Box center rotated relative to page center in screen pixels
    const rxRot = (rx * Math.cos(alpha) - ry * Math.sin(alpha)) * zoom;
    const ryRot = (rx * Math.sin(alpha) + ry * Math.cos(alpha)) * zoom;
    
    const bx = pcx + rxRot;
    const by = pcy + ryRot;
    
    setRotating({
      id: fb.id,
      centerX: bx,
      centerY: by,
      startMouseAngle: Math.atan2(e.clientY - by, e.clientX - bx),
      origAngle: fb.angle || 0
    });
  }

  const onMouseMove = useCallback((e) => {
    if (dragging) {
      const dx = e.clientX - dragging.startX;
      const dy = e.clientY - dragging.startY;
      const rad = dragging.rotation * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      // Transform screen delta to local delta
      const localDx = (dx * cos + dy * sin) / zoom;
      const localDy = (-dx * sin + dy * cos) / zoom;
      
      setFloatingBoxes(prev => prev.map(fb => fb.id === dragging.id
        ? { ...fb, x: dragging.origX + localDx, y: dragging.origY + localDy }
        : fb
      ));
    }
    if (rotating) {
      const currentMouseAngle = Math.atan2(e.clientY - rotating.centerY, e.clientX - rotating.centerX);
      const deltaAngle = (currentMouseAngle - rotating.startMouseAngle) * 180 / Math.PI;
      setFloatingBoxes(prev => prev.map(fb => fb.id === rotating.id
        ? { ...fb, angle: (rotating.origAngle + deltaAngle) % 360 }
        : fb
      ));
    }
    if (draggingImg) {
      const o = imgDragOrigin.current;
      if (!o) return;
      setFloatingImages(prev => prev.map(fi => fi.id === draggingImg.id
        ? { ...fi, x: Math.max(0, o.x + e.clientX - o.mx), y: Math.max(0, o.y + e.clientY - o.my) }
        : fi
      ));
    }
    if (resizingImg) {
      const o = imgResizeOrigin.current;
      if (!o) return;
      const dx = e.clientX - o.mx;
      const dy = e.clientY - o.my;
      const corner = o.corner || 'se';
      // Scalar growth: positive = bigger. Each corner maps the two drag axes to growth.
      let delta;
      if      (corner === 'se') delta = (dx + dy) / 2;
      else if (corner === 'sw') delta = (-dx + dy) / 2;
      else if (corner === 'ne') delta = (dx - dy) / 2;
      else                      delta = (-dx - dy) / 2; // nw
      const newW = Math.max(40, o.w + delta);
      const newH = newW / o.ratio;
      // Anchor the opposite corner so the image doesn't jump
      const newX = (corner === 'sw' || corner === 'nw') ? o.x + o.w - newW : o.x;
      const newY = (corner === 'nw' || corner === 'ne') ? o.y + o.h - newH : o.y;
      setFloatingImages(prev => prev.map(fi => fi.id === resizingImg.id
        ? { ...fi, w: newW, h: newH, x: Math.max(0, newX), y: Math.max(0, newY) }
        : fi
      ));
    }
    if (resizingFb) {
      const o = fbResizeOrigin.current;
      if (!o) return;
      const dx = e.clientX - o.mx;
      const dy = e.clientY - o.my;
      const delta = o.axis === 'x' ? dx : o.axis === '-x' ? -dx : (dx + dy) / 2;
      const newFs = Math.max(6, Math.min(200, Math.round(o.fs + delta * 0.18)));
      setFloatingBoxes(prev => prev.map(fb => fb.id === resizingFb.id
        ? { ...fb, fontSize: newFs }
        : fb
      ));
    }
    if (draggingShape) {
      const o = shapeDragOrigin.current;
      if (!o) return;
      const dx = e.clientX - o.mx;
      const dy = e.clientY - o.my;
      const rad = (o.rotation || 0) * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const localDx = (dx * cos + dy * sin) / zoom;
      const localDy = (-dx * sin + dy * cos) / zoom;
      setFloatingShapes(prev => prev.map(s => s.id === draggingShape.id
        ? { ...s, x: Math.max(0, o.x + localDx), y: Math.max(0, o.y + localDy) }
        : s
      ));
    }
    if (resizingShape) {
      const o = shapeResizeOrigin.current;
      if (!o) return;
      const dx = e.clientX - o.mx;
      const dy = e.clientY - o.my;
      const rad = (o.rotation || 0) * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const localDx = (dx * cos + dy * sin) / zoom;
      const localDy = (-dx * sin + dy * cos) / zoom;
      setFloatingShapes(prev => prev.map(s => {
        if (s.id !== resizingShape.id) return s;
        const axis = o.axis || 'se';
        return {
          ...s,
          w: axis !== 's' ? Math.max(40, o.w + localDx) : s.w,
          h: axis !== 'e' ? Math.max(40, o.h + localDy) : s.h,
        };
      }));
    }
  }, [dragging, rotating, draggingImg, resizingImg, resizingFb, draggingShape, resizingShape, zoom]);
  const onMouseUp = useCallback(() => {
    setDragging(null);
    setRotating(null);
    setDraggingImg(null);
    setResizingImg(null);
    setResizingFb(null);
    setDraggingShape(null);
    setResizingShape(null);
  }, []);

  useEffect(() => {
    const onTouchMove = (e) => {
      if (!e.touches[0]) return;
      onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY });
    };
    const onTouchEnd = () => onMouseUp();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onMouseMove, onMouseUp]);

  async function rasterizePage(pg) {
    const pageRotation = rotatedPages[pg.num] || 0;
    const origW = pg.width;
    const origH = pg.height;
    const swap = pageRotation === 90 || pageRotation === 270;
    const outW = swap ? origH : origW;
    const outH = swap ? origW : origH;
    const rad = pageRotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    // Map an unrotated page point to the output (visually rotated) canvas coordinate
    const toOut = (px, py) => {
      const dx = px - origW / 2;
      const dy = py - origH / 2;
      return [outW / 2 + dx * cos - dy * sin, outH / 2 + dx * sin + dy * cos];
    };

    // 1. Draw base page + edited text on an unrotated intermediate canvas
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = origW;
    baseCanvas.height = origH;
    const baseCtx = baseCanvas.getContext("2d");
    await new Promise(resolve => {
      const img = new Image();
      img.onload = () => { baseCtx.drawImage(img, 0, 0); resolve(); };
      img.src = pg.dataUrl;
    });
    const edits = (textBlocks[pg.num] || []).filter(w => w.edited);
    for (const e of edits) {
      const lines = e.text.split(/\r?\n/);
      const lh = e.fontSize * 1.22;
      const lineCount = Math.max(1, lines.length);
      const useBaselines = e.lineBaselines && e.lineBaselines.length === lines.length;
      baseCtx.font = `${e.isItalic ? "italic " : ""}${e.isBold ? "bold " : ""}${e.fontSize}px ${e.fontFamily}`;
      let maxLineW = e.width;
      for (const ln of lines) maxLineW = Math.max(maxLineW, baseCtx.measureText(ln || " ").width);
      const whiteH = useBaselines && lines.length > 1
        ? Math.max(e.height + 12, Math.max(...e.lineBaselines) - Math.min(...e.lineBaselines) + lh + 16)
        : Math.max(e.height + 12, lineCount * lh + 14);
      baseCtx.fillStyle = e.bgColor && e.bgColor !== "transparent" ? e.bgColor : "#fff";
      baseCtx.fillRect(e.x - 2, e.y - 2, maxLineW + 14, whiteH + 8);
      baseCtx.fillStyle = e.color || "#000";
      baseCtx.textBaseline = "alphabetic";
      if (useBaselines) lines.forEach((ln, i) => baseCtx.fillText(ln, e.x, e.lineBaselines[i]));
      else lines.forEach((ln, i) => baseCtx.fillText(ln, e.x, e.baselineY + i * lh));
    }

    // 2. Create output canvas at (potentially rotated) dimensions and stamp the base onto it
    const outCanvas = document.createElement("canvas");
    outCanvas.width = outW;
    outCanvas.height = outH;
    const outCtx = outCanvas.getContext("2d");
    outCtx.save();
    outCtx.translate(outW / 2, outH / 2);
    outCtx.rotate(rad);
    outCtx.translate(-origW / 2, -origH / 2);
    outCtx.drawImage(baseCanvas, 0, 0);
    outCtx.restore();

    // 3. Draw floating items at their visual positions on the output canvas.
    //    Text uses only fb.angle (user-explicit rotation) — NOT the page rotation —
    //    so it stays visually upright, matching the editor view.
    const rasterItems = [
      ...floatingBoxes.filter(f => f.page === pg.num).map(f => ({ ...f, _kind: 'box' })),
      ...floatingImages.filter(f => f.page === pg.num).map(f => ({ ...f, _kind: 'image' })),
      ...floatingShapes.filter(s => s.page === pg.num).map(s => ({ ...s, _kind: 'shape' })),
    ].sort((a, b) => (a.z || 50) - (b.z || 50));
    for (const item of rasterItems) {
      if (item._kind === 'box') {
        if (!item.text) continue;
        const [visX, visY] = toOut(item.x, item.y);
        const lines = item.text.split(/\r?\n/);
        const lh = item.fontSize * 1.5;
        const halfH = lines.length * lh / 2;
        outCtx.save();
        outCtx.translate(visX, visY);
        outCtx.rotate((item.angle || 0) * Math.PI / 180);
        outCtx.font = `${item.isItalic ? "italic " : ""}${item.isBold ? "bold " : ""}${item.fontSize}px ${item.fontFamily}`;
        outCtx.textAlign = "center";
        outCtx.textBaseline = "top";
        if (item.bgColor && item.bgColor !== "transparent") {
          let maxW = 0;
          for (const ln of lines) maxW = Math.max(maxW, outCtx.measureText(ln || " ").width);
          outCtx.fillStyle = item.bgColor;
          outCtx.fillRect(-maxW / 2 - 4, -halfH - 3, maxW + 8, lines.length * lh + 6);
        }
        outCtx.fillStyle = item.color || "#000";
        lines.forEach((ln, i) => outCtx.fillText(ln, 0, -halfH + i * lh));
        outCtx.restore();
      } else if (item._kind === 'image') {
        const cx = item.x + item.w / 2;
        const cy = item.y + item.h / 2;
        const [visCX, visCY] = toOut(cx, cy);
        await new Promise(resolve => {
          const img = new Image();
          img.onload = () => {
            outCtx.save();
            outCtx.translate(visCX, visCY);
            outCtx.rotate((item.angle || 0) * Math.PI / 180);
            outCtx.drawImage(img, -item.w / 2, -item.h / 2, item.w, item.h);
            outCtx.restore();
            resolve();
          };
          img.src = item.dataUrl;
        });
      } else {
        const cx = item.x + item.w / 2;
        const cy = item.y + item.h / 2;
        const [visCX, visCY] = toOut(cx, cy);
        drawShapeOnCanvas(outCtx, { ...item, x: visCX - item.w / 2, y: visCY - item.h / 2 });
      }
    }
    return outCanvas.toDataURL("image/png");
  }

  async function handleDownload() {
    if (!pages.length) { alert("No PDF loaded."); return; }
    try {
 // Phase 3: don't silently strip encryption. Try strict first; only
      // fall back to ignoreEncryption: true if we hit an actual encryption
      // error. Other parse failures still go to the canvas fallback.
      const srcDoc = await loadPdfForExport(pdfBytes);
      if (!srcDoc) return await handleDownloadCanvasFallback();

    const srcPages = srcDoc.getPages();

      // Stage 1 guard: if pdfBytes has fewer pages than the editor state
      // (e.g. an Add-PDF merge failed earlier), the loop below would silently
      // skip the missing pages. Fall through to the canvas fallback so every
      // visible page lands in the export - even if at raster quality.
      if (srcPages.length < pages.length) {
        console.warn(`pdfBytes has ${srcPages.length} pages but state has ${pages.length}; using canvas fallback to preserve every page.`);
        return await handleDownloadCanvasFallback();
      }
      // Stage 2 guard: when a page has a non-zero /Rotate value the canvas
      // we captured is already the visually-rotated bitmap, but the overlay
      // math below still uses pre-rotation page coordinates so text/images
      // would land in the wrong place. Defer to the canvas fallback for
      // these pages until full rotation math is in. Loses vector quality on
      // rotated pages only.
      const hasSrcRotation = srcPages.some(p => {
        const r = p.getRotation();
        return r && typeof r.angle === "number" && r.angle % 360 !== 0;
      });
      // Phase 7: if we have local rotations, we must use canvas fallback for now.
      if (hasSrcRotation || Object.keys(rotatedPages).length > 0) {
        console.warn("Rotated page detected; falling back to canvas export so overlays land correctly.");
        return await handleDownloadCanvasFallback();
      }

      const hasRotatedFloatingText = floatingBoxes.some(fb =>
        fb.text && Math.abs((fb.angle || 0) % 360) > 0.1
      );
      if (hasRotatedFloatingText) {
        console.warn("Rotated floating text detected; using canvas export so text position/rotation matches the editor.");
        return await handleDownloadCanvasFallback();
      }

      // Phase 6: build a new doc and copyPages from src in the user\'s pageOrder
      // so reorders survive download. When pageOrder is identity this is a no-op
      // beyond the small copyPages overhead. Phase 5 fonts embed on newDoc (not src).
      // Phase 7: filter out deleted pages from the final document.
      const finalPageOrder = pageOrder.filter(pIdx => !deletedPages.has(pages[pIdx].num));
      const doc = await PDFDocument.create();
      doc.registerFontkit(fontkit);
      const noto = await loadNotoFontBytes();
      const fonts = {
        helv: await doc.embedFont(noto["noto-sans-regular"], { subset: true }),
        helvB: await doc.embedFont(noto["noto-sans-bold"], { subset: true }),
        helvI: await doc.embedFont(noto["noto-sans-italic"], { subset: true }),
        helvBI: await doc.embedFont(noto["noto-sans-bold-italic"], { subset: true }),
        times: await doc.embedFont(noto["noto-serif-regular"], { subset: true }),
        timesB: await doc.embedFont(noto["noto-serif-bold"], { subset: true }),
        courier: await doc.embedFont(noto["noto-sans-mono-regular"], { subset: true }),
      };
      for (let displayIdx = 0; displayIdx < finalPageOrder.length; displayIdx++) {
        const pg = pages[finalPageOrder[displayIdx]];
        if (!pg) continue;
        try {
          const [copiedPage] = await doc.copyPages(srcDoc, [finalPageOrder[displayIdx]]);
          doc.addPage(copiedPage);
        } catch (copyErr) {
          console.warn(`Page ${displayIdx + 1} copy failed, rasterizing:`, copyErr.message);
          const dataUrl = await rasterizePage(pg);
          const pngBytes = await (await fetch(dataUrl)).arrayBuffer();
          const pngImg = await doc.embedPng(pngBytes);
          const rotation = rotatedPages[pg.num] || 0;
          const rasterPage = doc.addPage([pg.width / SCALE, pg.height / SCALE]);
          rasterPage.setRotation(degrees(rotation));
          rasterPage.drawImage(pngImg, { x: 0, y: 0, width: pg.width / SCALE, height: pg.height / SCALE });
          continue;
        }

        try {
          const pdfPage = doc.getPages()[displayIdx];
          if (!pdfPage) continue;
          const { width: pdfW, height: pdfH } = pdfPage.getSize();
          const sx = pdfW / pg.width;
          const sy = pdfH / pg.height;

          // 1. Edited original text — white rectangle over the original area + new text on top
          const edits = (textBlocks[pg.num] || []).filter(w => w.edited);
        for (const e of edits) {
          const text = e.text || "";
          const lines = text.split(/\r?\n/);
          const numLines = Math.max(1, lines.length);
          const lhCanvas = e.fontSize * 1.22;
          const useBaselines = e.lineBaselines && e.lineBaselines.length === lines.length;
          let whiteHCanvas;
          if (useBaselines && lines.length > 1) {
            const bs = e.lineBaselines;
            whiteHCanvas = Math.max(e.height + 12, Math.max(...bs) - Math.min(...bs) + lhCanvas + 16);
          } else {
            whiteHCanvas = Math.max(e.height + 12, numLines * lhCanvas + 14);
          }
          const padX = 4;
          const whiteW = (e.width + padX * 2) * sx;
          const whiteH = whiteHCanvas * sy;
          const whiteX = (e.x - padX) * sx;
          const yTopCanvas = e.y - 4;
          const yBottomPdf = pdfH - (yTopCanvas + whiteHCanvas) * sy;
          pdfPage.drawRectangle({
            x: whiteX,
            y: yBottomPdf,
            width: whiteW,
            height: whiteH,
            color:
              e.bgColor && e.bgColor !== "transparent"
                ? hexToRgb(e.bgColor)
                : rgb(1, 1, 1),
          });

          if (lines.some(l => l.length > 0)) {
            const font = pickPdfLibFont(fonts, e.fontFamily, e.isBold, e.isItalic);
            const fs = e.fontSize * sy;
            lines.forEach((ln, i) => {
              if (!ln) return;
              const baselineCanvas = (useBaselines && e.lineBaselines[i] != null)
                ? e.lineBaselines[i]
                : (e.baselineY + i * lhCanvas);
              const yPdf = pdfH - baselineCanvas * sy;
              try {
                pdfPage.drawText(ln, {
                  x: e.x * sx,
                  y: yPdf,
                  size: fs,
                  font,
                  color: hexToRgb(e.color || "#000000"),
                });
              } catch { /* ignore */ }
            });
          }
        }

        // Pre-embed floating images for this page (async must happen before the sorted loop)
        const pdfEmbeddedImgs = new Map();
        for (const fi of floatingImages.filter(f => f.page === pg.num && !(f.isHighlight && f.hlRect))) {
          const isJpg = /^data:image\/jpe?g/i.test(fi.dataUrl);
          const data = await (await fetch(fi.dataUrl)).arrayBuffer();
          let img;
          try { img = isJpg ? await doc.embedJpg(data) : await doc.embedPng(data); }
          catch { try { img = await doc.embedPng(data); } catch { continue; } }
          pdfEmbeddedImgs.set(fi.id, img);
        }

        // Draw all floating items in z-sorted order (creation order) so layering matches the editor
        // fb.x/fb.y are the CENTER of the box in canvas pixels (FloatingBox uses translate(-50%,-50%))
        const pdfItems = [
          ...floatingBoxes.filter(f => f.page === pg.num).map(f => ({ ...f, _kind: 'box' })),
          ...floatingImages.filter(f => f.page === pg.num).map(f => ({ ...f, _kind: 'image' })),
          ...floatingShapes.filter(s => s.page === pg.num).map(s => ({ ...s, _kind: 'shape' })),
        ].sort((a, b) => (a.z || 50) - (b.z || 50));

        for (const item of pdfItems) {
          if (item._kind === 'box') {
            const fb = item;
            const text = fb.text || "";
            if (!text) continue;
            const font = pickPdfLibFont(fonts, fb.fontFamily, fb.isBold, fb.isItalic);
            const fs = fb.fontSize * sy;
            const lhCanvas = fb.fontSize * 1.5;
            const lines = text.split(/\r?\n/);
            const color = hexToRgb(fb.color || "#000000");
            const halfH = lines.length * lhCanvas / 2;
            const topYCanvas = fb.y - halfH;
            const cx_pdf = fb.x * sx;
            const cy_pdf = pdfH - fb.y * sy;
            const fbAngle = fb.angle || 0;
            const angle_rad = fbAngle * Math.PI / 180;
            const cos_a = Math.cos(angle_rad);
            const sin_a = Math.sin(angle_rad);
            if (fb.bgColor && fb.bgColor !== "transparent") {
              let maxLineW = 0;
              for (const ln of lines) {
                try { maxLineW = Math.max(maxLineW, font.widthOfTextAtSize(ln || " ", fs)); }
                catch { maxLineW = Math.max(maxLineW, (ln || " ").length * fs * 0.6); }
              }
              const padX = 4 * sx, padY = 3 * sy;
              const rectW = maxLineW + padX * 2;
              const rectH = lines.length * lhCanvas * sy + padY * 2;
              const dx_bl = -(maxLineW / 2 + padX);
              const dy_bl = -(halfH * sy + padY);
              const rdx_bl = dx_bl * cos_a - dy_bl * sin_a;
              const rdy_bl = dx_bl * sin_a + dy_bl * cos_a;
              pdfPage.drawRectangle({ x: cx_pdf + rdx_bl, y: cy_pdf + rdy_bl, width: rectW, height: rectH, color: hexToRgb(fb.bgColor), rotate: degrees(fbAngle) });
            }
            lines.forEach((ln, i) => {
              if (!ln) return;
              let lw = 0;
              try { lw = font.widthOfTextAtSize(ln, fs); } catch { lw = (ln || " ").length * fs * 0.6; }
              const dx = -lw / 2;
              const dy = halfH * sy - i * lhCanvas * sy - fb.fontSize * 0.85 * sy;
              const rdx = dx * cos_a - dy * sin_a;
              const rdy = dx * sin_a + dy * cos_a;
              try { pdfPage.drawText(ln, { x: cx_pdf + rdx, y: cy_pdf + rdy, size: fs, font, color, rotate: degrees(fbAngle) }); } catch { /* ignore */ }
            });
          } else if (item._kind === 'image') {
            const fi = item;
            if (fi.isHighlight && fi.hlRect) {
              const r = fi.hlRect;
              pdfPage.drawRectangle({ x: r.x * sx, y: pdfH - (r.y + r.h) * sy, width: r.w * sx, height: r.h * sy, color: hexToRgb(r.color), opacity: 0.4, borderWidth: 0 });
            } else {
              const img = pdfEmbeddedImgs.get(fi.id);
              if (!img) continue;
              pdfPage.drawImage(img, { x: fi.x * sx, y: pdfH - (fi.y + fi.h) * sy, width: fi.w * sx, height: fi.h * sy, rotate: degrees(fi.angle || 0) });
            }
          } else {
            const shape = item;
            const sc = hexToRgb(shape.shapeColor);
            const { x: sx2, y: sy2, w: sw, h: sh } = { x: shape.x * sx, y: pdfH - (shape.y + shape.h) * sy, w: shape.w * sx, h: shape.h * sy };
            if (shape.shapeType === 'circle') {
              pdfPage.drawEllipse({ x: sx2 + sw/2, y: sy2 + sh/2, xScale: sw/2, yScale: sh/2, ...(shape.shapeFill ? { color: sc } : { borderColor: sc, borderWidth: 1.5 }) });
            } else if (shape.shapeType === 'square') {
              pdfPage.drawRectangle({ x: sx2, y: sy2, width: sw, height: sh, ...(shape.shapeFill ? { color: sc } : { borderColor: sc, borderWidth: 1.5 }) });
            } else {
              const lw = Math.max(1, Math.min(sw, sh) * 0.07);
              const pt = (rx, ry) => ({ x: sx2 + sw * rx, y: sy2 + sh * (1 - ry) });
              if (shape.shapeType === 'checkmark') {
                pdfPage.drawLine({ start: pt(0.1, 0.6), end: pt(0.38, 0.85), thickness: lw, color: sc });
                pdfPage.drawLine({ start: pt(0.38, 0.85), end: pt(0.9, 0.18), thickness: lw, color: sc });
              } else if (shape.shapeType === 'cross') {
                pdfPage.drawLine({ start: pt(0.12, 0.12), end: pt(0.88, 0.88), thickness: lw, color: sc });
                pdfPage.drawLine({ start: pt(0.88, 0.12), end: pt(0.12, 0.88), thickness: lw, color: sc });
              } else if (shape.shapeType === 'line') {
                pdfPage.drawLine({ start: pt(0.05, 0.5), end: pt(0.95, 0.5), thickness: lw, color: sc });
              } else if (shape.shapeType === 'arrow') {
                pdfPage.drawLine({ start: pt(0.05, 0.5), end: pt(0.82, 0.5), thickness: lw, color: sc });
                pdfPage.drawLine({ start: pt(0.6, 0.22), end: pt(0.92, 0.5), thickness: lw, color: sc });
                pdfPage.drawLine({ start: pt(0.92, 0.5), end: pt(0.6, 0.78), thickness: lw, color: sc });
              }
            }
          }
        }
        } catch (overlayErr) {
          console.warn(`Page ${displayIdx + 1} overlay failed, rasterizing:`, overlayErr.message);
          const dataUrl = await rasterizePage(pg);
          const pngBytes = await (await fetch(dataUrl)).arrayBuffer();
          const pngImg = await doc.embedPng(pngBytes);
          const rotation = rotatedPages[pg.num] || 0;
          const pages_ = doc.getPages();
          const pdfPage_ = pages_[displayIdx];
          const { width: pw, height: ph } = pdfPage_.getSize();
          pdfPage_.drawImage(pngImg, { x: 0, y: 0, width: pw, height: ph, rotate: degrees(rotation) });
        }
      }

      const bytes = await doc.save();
      triggerPdfDownload(bytes);

    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed: " + err.message);
    }
  }

  async function handleDownloadImages() {
    if (!pages.length) { alert("No PDF loaded."); return; }
    const baseName = (fileName || "document").replace(/\.pdf$/i, "");
    const finalPageOrder = pageOrder.filter(pIdx => !deletedPages.has(pages[pIdx].num));
    for (let displayIdx = 0; displayIdx < finalPageOrder.length; displayIdx++) {
      const pg = pages[finalPageOrder[displayIdx]];
      if (!pg) continue;
      if (displayIdx > 0) await new Promise(r => setTimeout(r, 80));
      const dataUrl = await rasterizePage(pg);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = finalPageOrder.length === 1 ? `${baseName}.png` : `${baseName}_page_${displayIdx + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    triggerSupportPrompt();
  }

  // Split modal: download each group as a separate PDF
  async function handleSplitDownload(groups) {
    const baseName = (fileName || "document").replace(/\.pdf$/i, "");
    for (let gi = 0; gi < groups.length; gi++) {
      const doc = await PDFDocument.create();
      for (const pIdx of groups[gi]) {
        const pg = pages[pIdx];
        if (!pg) continue;
        const dataUrl = await rasterizePage(pg);
        const pngBytes = await (await fetch(dataUrl)).arrayBuffer();
        const img = await doc.embedPng(pngBytes);
        const rot = rotatedPages[pg.num] || 0;
        const swp = rot === 90 || rot === 270;
        const pw = (swp ? pg.height : pg.width) / SCALE;
        const ph = (swp ? pg.width : pg.height) / SCALE;
        const p = doc.addPage([pw, ph]);
        p.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
      }
      const outBytes = await doc.save();
      const blob = new Blob([outBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = groups.length === 1 ? `${baseName}.pdf` : `${baseName}_part_${gi + 1}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (gi < groups.length - 1) await new Promise(r => setTimeout(r, 120));
    }
    triggerSupportPrompt();
  }

  // Split modal: download selected pages as a single PDF
  async function handleExtractDownload(pageIndices) {
    const baseName = (fileName || "document").replace(/\.pdf$/i, "");
    const doc = await PDFDocument.create();
    for (const pIdx of pageIndices) {
      const pg = pages[pIdx];
      if (!pg) continue;
      const dataUrl = await rasterizePage(pg);
      const pngBytes = await (await fetch(dataUrl)).arrayBuffer();
      const img = await doc.embedPng(pngBytes);
      const rot = rotatedPages[pg.num] || 0;
      const swp = rot === 90 || rot === 270;
      const pw = (swp ? pg.height : pg.width) / SCALE;
      const ph = (swp ? pg.width : pg.height) / SCALE;
      const p = doc.addPage([pw, ph]);
      p.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
    }
    const outBytes = await doc.save();
    const blob = new Blob([outBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}_pages.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerSupportPrompt();
  }

  function triggerSupportPrompt() {
    setShowSupportPrompt(true);
  }

  function triggerPdfDownload(bytes) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (fileName || "document").replace(/\.pdf$/i, "") + "_edited.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerSupportPrompt();
  }

  async function handleDownloadCanvasFallback() {
    const doc = await PDFDocument.create();
    const finalPageOrder = pageOrder.filter(pIdx => !deletedPages.has(pages[pIdx].num));
    for (const i of finalPageOrder) {
      const pg = pages[i];
      if (!pg) continue;
      const rot = rotatedPages[pg.num] || 0;
      const swap = rot === 90 || rot === 270;
      const pw = (swap ? pg.height : pg.width) / SCALE;
      const ph = (swap ? pg.width : pg.height) / SCALE;
      const dataUrl = await rasterizePage(pg);
      const pngBytes = await (await fetch(dataUrl)).arrayBuffer();
      const pngImg = await doc.embedPng(pngBytes);
      const pdfPage = doc.addPage([pw, ph]);
      pdfPage.drawImage(pngImg, { x: 0, y: 0, width: pw, height: ph });
    }
    const bytes = await doc.save();
    triggerPdfDownload(bytes);
  }

  const isNoFile = pages.length === 0;
  const visiblePages = pageOrder
    .map(pIdx => pages[pIdx])
    .filter(pg => pg && !deletedPages.has(pg.num));

  const pageActionBtn = {
    ...pageBtn,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };

  // Area-selection Ctrl+C/X/V — placed here so visiblePages is in scope
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const isTyping = t => { const tag = t?.tagName?.toLowerCase(); return tag === 'input' || tag === 'textarea' || tag === 'select' || !!t?.isContentEditable; };
    const onKeyDown = async (e) => {
      if (isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 'c' && areaSelection) { e.preventDefault(); await copySelectedArea(); return; }
      if (key === 'x' && areaSelection) { e.preventDefault(); await cutSelectedArea(); return; }
      if (key === 'v' && internalClipboardRef.current?.type === 'area-image') { e.preventDefault(); pasteSelectedArea(); return; }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [areaSelection, pages, deletedPages, visiblePages]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`editor-container ${isNoFile ? "editor-relative" : "editor-fixed"}`}
         style={{ userSelect: dragging ? "none" : "auto" }}
         onClick={handleBgClick}>
      {isNoFile ? (
        <Homepage
          onFile={handleFile}
          onDropFile={handleDroppedFile}
          onCreateBlank={createBlankPdf}
          navigate={navigate}
        />
      ) : (
        <>
          <EditorToolbar
            goHome={goHome}
            handleFile={handleFile}
            handleAppendFile={handleAppendFile}
            undo={undo}
            historyLength={history.length}
            handleDownload={handleDownload}
            handleDownloadImages={handleDownloadImages}
            openSplitModal={() => setIsSplitModalOpen(true)}
            drawMode={drawMode}
            setDrawMode={setDrawMode}
            sidebarOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(v => !v)}
          />

          <EditorHeader
            tabsList={tabsList}
            activeTabId={activeTabId}
            switchTab={switchTab}
            closeTab={closeTab}
            handleFile={handleFile}
          />
          <div className="mobile-editor-hint">For best editing use a desktop. Slide toolbar to download</div>


<div
            style={{
              display: "flex",
              flex: 1,
              minHeight: 0,
              width: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
            {/* Left Sidebar */}
<aside
      className={`editor-sidebar${sidebarOpen ? '' : ' editor-sidebar-hidden'}`}
      style={{
        width: "clamp(220px, 22vw, 340px)",
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: "clamp(220px, 22vw, 340px)",
        minHeight: 0,
        background: "rgba(255,253,248,0.97)",
        borderRight: `1px solid rgba(116,86,44,0.18)`,
        borderTop: `1px solid rgba(116,86,44,0.10)`,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >              <div style={{ position: 'sticky', top: 0, zIndex: 10, background: "rgba(255,253,248,0.97)", padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(116,86,44,0.14)' }}>
                <button onClick={() => setIsGridView(g => !g)} title={isGridView ? "Exit Grid" : "Grid View"} style={{ width: 32, height: 32, border: `1px solid rgba(116,86,44,0.22)`, borderRadius: '4px', background: "transparent", color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GridIcon />
                </button>
                <label title="Add PDF or Image" style={{ width: 32, height: 32, border: `1px solid rgba(116,86,44,0.22)`, borderRadius: '4px', background: "transparent", color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600 }}>
                  +
                  <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleAppendFile} style={hiddenFileInput} />
                </label>
              </div>
              
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visiblePages.map((pg, i) => {
                const rotation = rotatedPages[pg.num] || 0;
                const swap = rotation === 90 || rotation === 270;
                return (
                  <div key={`side-${pg.num}`}
                       draggable={true}
                       onClick={() => {
                         if (isGridView) setIsGridView(false);
                         setTimeout(() => {
                           const container = containerRef.current;
                           const el = container?.querySelector(`[data-pgwrap="${pg.num}"]`);
                           if (container && el) container.scrollTo({ top: el.offsetTop - 40, behavior: 'smooth' });
                         }, 50);
                       }}
                       onDragStart={e => {
                         e.dataTransfer.effectAllowed = "move";
                         setTimeout(() => setDraggedPageNum(pg.num), 0);
                       }}
                       onDragOver={e => {
                         if (draggedPageNum !== null && draggedPageNum !== pg.num) {
                           e.preventDefault();
                           e.dataTransfer.dropEffect = "move";
                           setDragOverPageNum(pg.num);
                         }
                       }}
                       onDragLeave={() => {
                         if (dragOverPageNum === pg.num) setDragOverPageNum(null);
                       }}
                       onDrop={e => {
                         if (draggedPageNum !== null) {
                           e.preventDefault();
                           movePageTo(draggedPageNum, i);
                           setDraggedPageNum(null);
                           setDragOverPageNum(null);
                         }
                       }}
                       onDragEnd={() => {
                         setDraggedPageNum(null);
                         setDragOverPageNum(null);
                       }}
                       style={{
                         opacity: draggedPageNum === pg.num ? 0.5 : 1,
                         borderBottom: dragOverPageNum === pg.num ? `4px solid ${LACQUER}` : "none",
                         transition: 'opacity 0.2s'
                       }}>
                    <div style={{
                      position: 'relative', background: '#fff', boxShadow: '0 2px 8px rgba(40,24,8,0.08)', border: `1px solid rgba(116,86,44,0.22)`, cursor: 'pointer',
                      aspectRatio: swap ? `${pg.height} / ${pg.width}` : `${pg.width} / ${pg.height}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                      <img src={pg.dataUrl} alt={`Page ${i+1}`} 
                        style={{ 
                          transform: `rotate(${rotation}deg)`, 
                          width: swap ? 'auto' : '100%', 
                          height: swap ? '100%' : 'auto',
                          display: 'block' 
                        }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ fontFamily: CINZEL, fontSize: 10, color: LACQUER, fontWeight: 600 }}>{i + 1}</span>
                      <button onClick={(e) => { e.stopPropagation(); rotatePage(pg.num); }} style={{ width: 26, height: 26, border: '1px solid rgba(116,86,44,0.22)', borderRadius: '4px', background: "transparent", color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Rotate">
                        <RotateIcon size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); addBlankPage(pg.num); }} style={{ width: 26, height: 26, border: '1px solid rgba(116,86,44,0.22)', borderRadius: '4px', background: "transparent", color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Add blank page after">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="12" y2="19"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deletePage(pg.num); }} style={{ width: 26, height: 26, border: '1px solid rgba(116,86,44,0.22)', borderRadius: '4px', background: "transparent", color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }} title="Delete">X</button>
                    </div>
                    
                    {i < visiblePages.length - 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                        <label style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: LACQUER, color: "#fff", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                          +
                          <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleAppendFile} style={hiddenFileInput} />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}

              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '20px 10px', border: `1px dashed ${LACQUER}`, background: 'rgba(139,26,26,0.05)', color: LACQUER, cursor: 'pointer', marginTop: 12 }}>
                <span style={{ fontSize: 20 }}>+</span>
                <span style={{ fontFamily: CINZEL, fontSize: 10, letterSpacing: 1, fontWeight: 600 }}>Add PDF, image files</span>
                <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleAppendFile} style={hiddenFileInput} />
              </label>
              </div>
            </aside>

            {/* Right Main Area */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <EditorNotices
                pages={pages}
                hasTextLayer={hasTextLayer}
                textLayerNoticeDismissed={textLayerNoticeDismissed}
                setTextLayerNoticeDismissed={setTextLayerNoticeDismissed}
                isEncrypted={isEncrypted}
                encryptionNoticeDismissed={encryptionNoticeDismissed}
                setEncryptionNoticeDismissed={setEncryptionNoticeDismissed}
                ocrState={ocrState}
                ocrProgress={ocrProgress}
                ocrError={ocrError}
                onActivateOCR={handleActivateOCR}
                onCancelOCR={handleCancelOCR}
                onDismissOCRDone={() => setOcrState(null)}
              />

              <div ref={containerRef} className="main-scroll-area" style={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative', overflow: 'auto', padding: '40px 60px 80px 60px', background: "#f0ece3", display: isGridView ? "grid" : "flex", gridTemplateColumns: isGridView ? "repeat(auto-fill, minmax(240px, 1fr))" : undefined, flexDirection: isGridView ? undefined : "column", alignItems: isGridView ? "start" : "center", gap: isGridView ? 20 : 48, boxSizing: "border-box" }}>
              {visiblePages.map((pg, displayIdx) => {
                if (!pg) return null;
                const rotation = rotatedPages[pg.num] || 0;
                const swap = rotation === 90 || rotation === 270;
                const scale = isGridView ? Math.min(240 / (swap ? pg.height : pg.width), 0.5) : zoom;
                const dispW = (swap ? pg.height : pg.width) * scale;
                const dispH = (swap ? pg.width : pg.height) * scale;
                return (
                  <div key={pg.num}
                       draggable={isGridView}
                       onDragStart={e => {
                         if (isGridView) {
                           e.dataTransfer.effectAllowed = "move";
                           setTimeout(() => setDraggedPageNum(pg.num), 0);
                         }
                       }}
                       onDragOver={e => {
                         if (isGridView && draggedPageNum !== null && draggedPageNum !== pg.num) {
                           e.preventDefault();
                           e.dataTransfer.dropEffect = "move";
                           setDragOverPageNum(pg.num);
                           return;
                         }
                         if (e.dataTransfer.types.includes('Files')) {
                           e.preventDefault();
                           e.dataTransfer.dropEffect = "copy";
                           setDragOverImagePage(pg.num);
                         }
                       }}
                       onDragLeave={() => {
                         if (dragOverPageNum === pg.num) setDragOverPageNum(null);
                         if (dragOverImagePage === pg.num) setDragOverImagePage(null);
                       }}
                       onDrop={e => {
                         if (isGridView && draggedPageNum !== null) {
                           e.preventDefault();
                           movePageTo(draggedPageNum, displayIdx);
                           setDraggedPageNum(null);
                           setDragOverPageNum(null);
                           return;
                         }
                         if (e.dataTransfer.files?.length) {
                           e.preventDefault();
                           setDragOverImagePage(null);
                           const file = e.dataTransfer.files[0];
                           if (!file.type.startsWith('image/')) return;
                           const reader = new FileReader();
                           reader.onload = ev => {
                             saveHistory();
                             floatingIdCounter++;
                             setFloatingImages(prev => [...prev, {
                               id: `drop-${floatingIdCounter}`,
                               page: pg.num,
                               z: 50 + floatingIdCounter,
                               x: Math.max(0, (pg.width || 600) / 2 - 100),
                               y: Math.max(0, (pg.height || 800) / 2 - 75),
                               w: 200, h: 150,
                               dataUrl: ev.target.result,
                             }]);
                           };
                           reader.readAsDataURL(file);
                         }
                       }}
                       onDragEnd={() => {
                         setDraggedPageNum(null);
                         setDragOverPageNum(null);
                         setDragOverImagePage(null);
                       }}
                       style={{
                         opacity: draggedPageNum === pg.num ? 0.5 : 1,
                         border: (dragOverPageNum === pg.num || dragOverImagePage === pg.num) ? `2px dashed ${LACQUER}` : "2px solid transparent",
                         padding: isGridView ? 4 : 0,
                         boxSizing: "border-box",
                         borderRadius: dragOverImagePage === pg.num ? 4 : 0,
                       }}>
                  {!isGridView && (() => {
                    const tb = { width: 34, height: 34, border: "1px solid rgba(139,26,26,0.25)", borderRadius: 4, background: "transparent", color: LACQUER, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 };
                    const tbActive = { ...tb, background: "rgba(139,26,26,0.12)", outline: "1px solid #8B1A1A", outlineOffset: 1 };
                    const sep = <div style={{ width: 1, height: 20, background: "rgba(139,26,26,0.2)", margin: "0 3px", flexShrink: 0 }} />;
                    return (
                    <div onClick={e => e.stopPropagation()} style={{ position: "sticky", top: 8, zIndex: 50, display: "flex", alignItems: "center", gap: 3, marginBottom: 10, maxWidth: "100%", overflowX: "auto", flexWrap: "nowrap", paddingBottom: 4, WebkitOverflowScrolling: "touch", background: "rgba(240,236,227,0.92)", backdropFilter: "blur(6px)", borderRadius: 6, padding: "4px 6px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>

                      {/* Page label */}
                      <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 3, fontWeight: 700, whiteSpace: "nowrap", padding: "0 4px", flexShrink: 0 }}>{displayIdx + 1}</span>

                      {/* Move To */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); setMoveToPanelPage(p => p === pg.num ? null : pg.num); }} style={moveToPanelPage === pg.num ? tbActive : tb} title="Move page to position" aria-label="Move page to position">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 16 3 12 7 8"/><line x1="3" y1="12" x2="21" y2="12"/><polyline points="17 8 21 12 17 16"/></svg>
                        </button>
                        {moveToPanelPage === pg.num && (
                          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, background: "#fffdf8", border: "1px solid rgba(116,86,44,0.20)", borderRadius: 6, padding: "6px", zIndex: 9999, display: "flex", flexDirection: "column", gap: 3, boxShadow: "0 8px 24px rgba(40,24,8,0.12)", maxHeight: 200, overflowY: "auto", minWidth: 64 }}>
                            {visiblePages.map((_, i) => (
                              <button key={i} onClick={() => { if (i !== displayIdx) movePageTo(pg.num, i); setMoveToPanelPage(null); }}
                                style={{ ...pageBtn, padding: "4px 12px", background: i === displayIdx ? "rgba(139,26,26,0.1)" : "transparent", fontWeight: i === displayIdx ? 700 : 400, borderRadius: 4 }}>
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Zoom */}
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(139,26,26,0.3)", borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                        <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} style={{ ...tb, border: "none", borderRight: "1px solid rgba(139,26,26,0.2)", width: 28, borderRadius: 0, fontSize: 15, fontWeight: 700 }} title="Zoom out" aria-label="Zoom out">−</button>
                        <span style={{ fontFamily: CINZEL, fontSize: 10, color: LACQUER, minWidth: 38, textAlign: "center", letterSpacing: 1, padding: "0 2px", fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
                        <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))} style={{ ...tb, border: "none", borderLeft: "1px solid rgba(139,26,26,0.2)", width: 28, borderRadius: 0, fontSize: 15, fontWeight: 700 }} title="Zoom in" aria-label="Zoom in">+</button>
                      </div>

                      {sep}

                      {/* Undo */}
                      <button onClick={e => { e.stopPropagation(); undo(); }} disabled={!history.length} aria-label="Undo" title="Undo" style={{ ...tb, opacity: history.length ? 1 : 0.3, fontSize: 18 }}>&#8630;</button>

                      {/* Rotate */}
                      <button onClick={e => { e.stopPropagation(); rotatePage(pg.num); }} aria-label="Rotate page" title="Rotate page" style={tb}>
                        <RotateIcon size={14} />
                      </button>

                      {/* Add blank page */}
                      <button onClick={e => { e.stopPropagation(); addBlankPage(pg.num); }} aria-label="Add blank page after" title="Add blank page after" style={tb}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="12" y2="19"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
                      </button>

                      {/* Delete */}
                      <button onClick={e => { e.stopPropagation(); deletePage(pg.num); }} aria-label="Delete page" title="Delete page" style={tb}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>

                      {sep}

                      {/* Select area */}
                      <button
                        onClick={e => { e.stopPropagation(); const next = !selectMode; setSelectMode(next); if (next) { setDrawMode(false); setDrawPanelOpen(false); setShapePanelPage(null); setSelected(null); setActivePopup(null); setAreaSelection(null); } }}
                        style={{ ...(selectMode ? tbActive : tb), fontSize: 16, lineHeight: 1 }} title="Select" aria-label="Select area"
                      >↖</button>

                      {/* Sign */}
                      <button onClick={e => { e.stopPropagation(); setSelected(null); setActivePopup(null); setDrawMode(false); setDrawPanelOpen(false); setShapePanelPage(null); setSelectMode(false); setAreaSelection(null); setSignatureTargetPageNum(pg.num); setIsSignModalOpen(true); }} style={tb} title="Sign" aria-label="Add signature">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(180deg)" }}>
                          <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                          <path d="M2 2l7.586 7.586"/>
                          <circle cx="11" cy="11" r="2"/>
                        </svg>
                      </button>

                      {/* Add Text */}
                      <button onClick={e => { e.stopPropagation(); setDrawMode(false); setDrawPanelOpen(false); setShapePanelPage(null); setSelectMode(false); setAreaSelection(null); addFloatingBox(pg.num); }} style={{ ...tb, fontSize: 16, fontWeight: 700, lineHeight: 1 }} title="Add text" aria-label="Add text box">T</button>

                      {/* Draw */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); const next = !drawMode; setSelected(null); setActivePopup(null); setDrawMode(next); setDrawPanelOpen(next); if (next) { setShapePanelPage(null); setSelectMode(false); setAreaSelection(null); } }}
                          style={drawMode ? tbActive : tb} title="Freehand draw" aria-label="Freehand draw"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>
                        </button>
                        {drawPanelOpen && (
                          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, display: "flex", flexDirection: "column", gap: 6, background: "#fffdf8", border: "1px solid rgba(116,86,44,0.20)", borderRadius: 6, padding: "10px", zIndex: 9999, boxShadow: "0 8px 24px rgba(40,24,8,0.12)", minWidth: 136 }}>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => setDrawTool('pencil')} style={{ flex: 1, padding: "3px 6px", fontFamily: CINZEL, fontSize: 9, letterSpacing: 1, cursor: "pointer", border: `1px solid ${GOLD}`, borderRadius: 2, background: drawTool === 'pencil' ? LACQUER : "transparent", color: drawTool === 'pencil' ? "#fff" : LACQUER, fontWeight: 700 }}>PENCIL</button>
                              <button onClick={() => { setDrawTool('highlighter'); if (drawWidth < 10) setDrawWidth(14); }} style={{ flex: 1, padding: "3px 6px", fontFamily: CINZEL, fontSize: 9, letterSpacing: 1, cursor: "pointer", border: `1px solid ${GOLD}`, borderRadius: 2, background: drawTool === 'highlighter' ? LACQUER : "transparent", color: drawTool === 'highlighter' ? "#fff" : LACQUER, fontWeight: 700 }}>HIGHLIGHT</button>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                              {DRAW_COLORS.map(c => (
                                <button key={c} onClick={() => { setDrawColor(c); setDrawPanelOpen(false); }} title={c} style={{ width: 26, height: 26, background: c, border: drawColor === c ? `2px solid ${LACQUER}` : "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", padding: 0 }} />
                              ))}
                            </div>
                            <HexColorInput value={drawColor} onChange={setDrawColor} onDone={() => setDrawPanelOpen(false)} swatchSize={26} />
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 9, color: LACQUER, fontFamily: CINZEL, letterSpacing: 1 }}>SIZE</span>
                              <select value={FB_SIZES.includes(drawWidth) ? drawWidth : FB_SIZES.reduce((a, b) => Math.abs(b - drawWidth) < Math.abs(a - drawWidth) ? b : a)} onChange={e => setDrawWidth(+e.target.value)} style={{ flex: 1, fontSize: 11, background: "#fff", border: `1px solid ${GOLD}`, borderRadius: 2, padding: "1px 2px", height: 23 }}>
                                {FB_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Shapes */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <button onClick={e => { e.stopPropagation(); setSelected(null); setActivePopup(null); setDrawMode(false); setDrawPanelOpen(false); setSelectMode(false); setAreaSelection(null); setShapePanelPage(p => p === pg.num ? null : pg.num); }} style={shapePanelPage === pg.num ? tbActive : tb} title="Add shape" aria-label="Add shape">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="5"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>
                        </button>
                        {shapePanelPage === pg.num && (
                          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: "#fffdf8", border: "1px solid rgba(116,86,44,0.20)", borderRadius: 6, padding: "12px 14px", zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 8px 24px rgba(40,24,8,0.12)", minWidth: 160 }}>
                            <div style={{ fontFamily: CINZEL, fontSize: 10, color: LACQUER, letterSpacing: 3, fontWeight: 700 }}>SHAPE COLOR</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                              {DRAW_COLORS.map(c => (
                                <button key={c} type="button" onClick={e => { e.stopPropagation(); setShapePanelColor(c); }} style={{ width: 22, height: 22, background: c, border: shapePanelColor === c ? `2px solid ${LACQUER}` : "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", padding: 0 }} />
                              ))}
                            </div>
                            <HexColorInput value={shapePanelColor} onChange={v => { setShapePanelColor(v); }} />
                            <label style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: CINZEL, fontSize: 10, color: LACQUER, cursor: "pointer", letterSpacing: 2 }}>
                              <input type="checkbox" checked={shapePanelFill} onChange={e => setShapePanelFill(e.target.checked)} style={{ accentColor: LACQUER }} />
                              FILLED
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                              {[
                                { type: 'circle', label: 'CIRCLE', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/></svg> },
                                { type: 'square', label: 'SQUARE', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/></svg> },
                                { type: 'checkmark', label: 'CHECK', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,13 9,19 21,6"/></svg> },
                                { type: 'cross', label: 'CROSS', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="4" x2="20" y2="20"/><line x1="20" y1="4" x2="4" y2="20"/></svg> },
                                { type: 'line', label: 'LINE', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg> },
                                { type: 'arrow', label: 'ARROW', svg: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="19" y2="12"/><polyline points="14,7 21,12 14,17"/></svg> },
                              ].map(({ type, label, svg }) => (
                                <button key={type} onClick={() => handleAddShape(pg.num, type)} style={{ ...pageActionBtn, flexDirection: "column", gap: 3, padding: "8px 4px" }} title={`Add ${label.toLowerCase()}`}>
                                  {svg}
                                  <span style={{ fontSize: 8, letterSpacing: 1.5 }}>{label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Add Image */}
                      <label style={{ ...tb, cursor: "pointer" }} title="Add image" aria-label="Add image" onClick={() => { setDrawMode(false); setDrawPanelOpen(false); setShapePanelPage(null); }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <input type="file" accept="image/*" onChange={e => handleAddImage(e, pg.num)} style={hiddenFileInput} />
                      </label>

                    </div>
                    );
                  })()}
                  {isGridView && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                       <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Page {displayIdx + 1}</span>
                       <div style={{ display: "flex", gap: 4 }}>
                         <button onClick={e => { e.stopPropagation(); addBlankPage(pg.num); }} title="Add blank page after" style={{ ...pageBtn, padding: "2px 6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="12" y2="19"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
                         </button>
                         <button onClick={e => { e.stopPropagation(); deletePage(pg.num); }} aria-label={`Delete page ${displayIdx + 1}`} title="Delete page" style={{ ...pageBtn, padding: "2px 6px", fontSize: 10 }}>X</button>
                       </div>
                    </div>
                  )}
                  <div data-pgwrap={pg.num} onClick={e => {
                    e.stopPropagation();
                    focusedPageNumRef.current = pg.num;
                    if (isGridView) {
                      setIsGridView(false);
                      setTimeout(() => {
                        const container = containerRef.current;
                        const el = container?.querySelector(`[data-pgwrap="${pg.num}"]`);
                        if (container && el) container.scrollTo({ top: el.offsetTop - 40, behavior: 'smooth' });
                      }, 50);
                    } else {
                      setSelected(null);
                      setActivePopup(null);
                    }
                  }} style={{ position: "relative", width: dispW, height: dispH, maxWidth: "100%", boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 24px 64px rgba(0,0,0,0.6)", overflow: "visible", cursor: isGridView ? "pointer" : "default" }}>
                    <div style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: pg.width * scale,
                      height: pg.height * scale,
                      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                      transformOrigin: "center center"
                    }}>
                      <canvas ref={(el) => { if (el) canvasRefs.current[pg.num] = el; else delete canvasRefs.current[pg.num]; }} style={{ display: "block", width: pg.width * scale, height: pg.height * scale }} />
                      {!isGridView && (
                        <canvas
                          ref={el => { if (el) drawCanvasRefs.current[pg.num] = el; else delete drawCanvasRefs.current[pg.num]; }}
                          width={pg.width}
                          height={pg.height}
                          style={{ position: 'absolute', left: 0, top: 0, width: pg.width * scale, height: pg.height * scale, zIndex: 2000, cursor: drawMode ? 'crosshair' : 'default', pointerEvents: drawMode && !isGridView ? 'all' : 'none' }}
                          onMouseDown={e => handleDrawStart(e, pg.num, scale)}
                          onMouseMove={e => handleDrawMove(e, pg.num, scale)}
                          onMouseUp={() => handleDrawEnd(pg.num, pg)}
                          onMouseLeave={() => handleDrawEnd(pg.num, pg)}
                          onTouchStart={e => handleDrawStart(e, pg.num, scale)}
                          onTouchMove={e => handleDrawMove(e, pg.num, scale)}
                          onTouchEnd={() => handleDrawEnd(pg.num, pg)}
                          onTouchCancel={() => handleDrawEnd(pg.num, pg)}
                        />
                      )}
                      {/* Area selection overlay */}
                      {!isGridView && selectMode && (
                        <div
                          style={{ position: 'absolute', left: 0, top: 0, width: pg.width * scale, height: pg.height * scale, zIndex: 2500, cursor: 'crosshair' }}
                          onMouseDown={e => handleSelMouseDown(e, pg.num, scale)}
                          onMouseMove={e => handleSelMouseMove(e, pg.num, scale)}
                          onMouseUp={e => handleSelMouseUp(e, pg.num, scale)}
                          onMouseLeave={e => handleSelMouseUp(e, pg.num, scale)}
                        >
                          {areaSelection?.pageNum === pg.num && (
                            <div style={{
                              position: 'absolute',
                              left: areaSelection.x0 * scale,
                              top: areaSelection.y0 * scale,
                              width: (areaSelection.x1 - areaSelection.x0) * scale,
                              height: (areaSelection.y1 - areaSelection.y0) * scale,
                              border: '2px dashed rgba(139,26,26,0.85)',
                              background: 'rgba(139,26,26,0.06)',
                              boxSizing: 'border-box',
                              pointerEvents: 'none',
                            }} />
                          )}
                        </div>
                      )}
                      {/* Area selection action popup */}
                      {!isGridView && areaSelection?.pageNum === pg.num && !areaSelection.live && (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            left: areaSelection.x0 * scale,
                            top: (areaSelection.y1 * scale) + 6,
                            zIndex: 4000,
                            display: 'flex', gap: 4,
                            background: '#fffdf8',
                            border: `1px solid rgba(116,86,44,0.25)`,
                            borderRadius: 4, padding: '5px 8px',
                            boxShadow: '0 4px 16px rgba(40,24,8,0.14)',
                          }}
                        >
                          {[
                            { label: 'Copy', title: 'Copy area to clipboard', fn: () => copySelectedArea() },
                            { label: 'Cut', title: 'Copy to clipboard and fill with white', fn: () => cutSelectedArea() },
                            { label: '✕', title: 'Cancel selection', fn: () => setAreaSelection(null) },
                          ].map(({ label, title, fn }) => (
                            <button key={label} onClick={fn} title={title} style={{
                              fontFamily: CINZEL, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase',
                              background: label === '✕' ? 'transparent' : LACQUER,
                              color: label === '✕' ? LACQUER : '#fff',
                              border: label === '✕' ? `1px solid rgba(139,26,26,0.35)` : 'none',
                              borderRadius: 3, padding: '4px 10px', cursor: 'pointer',
                            }}>{label}</button>
                          ))}
                        </div>
                      )}
                      {!isGridView && (textBlocks[pg.num] || []).map(tb => {
                        const isOpen = activePopup?.blockId === tb.id;
                        return (
                          <div key={tb.id} style={{
                            position: "absolute", left: tb.x * scale, top: tb.y * scale,
                            width: Math.max(tb.width * scale, 8),
                            height: Math.max(tb.height * scale, tb.fontSize * scale * 0.9),
                            // When the popup is open, lift the whole wrapper above floating images
                            // (which use z = 50 + counter, ~1000 when selected) so the popup renders on top.
                            zIndex: isOpen ? 3000 : 10, cursor: "text",
                          }} onClick={e => clickTextBlock(tb, e)}>
                            {isOpen && (
                              <EditPopup
  block={tb}
  zoom={scale}
  rotation={rotation}
  offsetX={activePopup.offsetX ?? 0}
  offsetY={activePopup.offsetY ?? 0}
  onOffsetChange={(ox, oy) =>
    setActivePopup(ap =>
      ap && ap.blockId === tb.id ? { ...ap, offsetX: ox, offsetY: oy } : ap
    )
  }
  onCommit={(newText, ox, oy, fmt) => commitEdit(tb.id, tb.page, newText, ox, oy, fmt)}
  onCancel={cancelEdit}
  onDraftChange={(text, fmt) => { pendingEditRef.current = { text, fmt }; }}
/>
                            )}
                          </div>
                        );
                      })}
                      {!isGridView && floatingBoxes.filter(fb => fb.page === pg.num).map(fb => (
                        <FloatingBox key={fb.id} fb={fb} isSel={selected === fb.id}
                          zoom={scale}
                          rotation={rotation}
                          onSelect={() => setSelected(fb.id)}
                          onStartDrag={e => startDragFloat(e, fb)}
                          onStartResize={(e, axis) => startResizeFb(e, fb, axis)}
                          onStartRotate={e => startRotateFb(e, fb)}
                          onUpdate={u => updateFloatingBox(fb.id, u)}
                          onCommit={() => setSelected(null)}
                          onDelete={() => deleteFloatingBox(fb.id)} />
                      ))}
                      {!isGridView && floatingImages.filter(fi => fi.page === pg.num).map(fi => (
                        <FloatingImage key={fi.id} fi={fi} isSel={selected === fi.id} zoom={scale}
                          onSelect={() => setSelected(fi.id)}
                          onDeselect={() => setSelected(null)}
                          onStartDrag={e => startDragImg(e, fi)}
                          onStartResize={(e, corner) => startResizeImg(e, fi, corner)}
                          onDelete={() => deleteFloatingImage(fi.id)} />
                      ))}
                      {!isGridView && floatingShapes.filter(s => s.page === pg.num).map(shape => (
                        <FloatingShape key={shape.id} shape={shape} isSel={selected === shape.id} zoom={scale} rotation={rotation}
                          onSelect={() => setSelected(shape.id)}
                          onDeselect={() => setSelected(null)}
                          onStartDrag={e => startDragShape(e, shape)}
                          onStartResize={(e, axis) => startResizeShape(e, shape, axis)}
                          onDelete={() => deleteFloatingShape(shape.id)}
                          onUpdate={u => updateFloatingShape(shape.id, u)} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            </div>
          </div>
        </>
      )}
      {isSplitModalOpen && (
        <SplitModal
          pages={pages}
          pageOrder={pageOrder}
          deletedPages={deletedPages}
          onSplitDownload={handleSplitDownload}
          onExtractDownload={handleExtractDownload}
          onClose={() => setIsSplitModalOpen(false)}
        />
      )}

      {isSignModalOpen && (
        <SignatureModal
          onClose={() => {
            setSignatureTargetPageNum(null);
            setIsSignModalOpen(false);
          }}
          onInsert={handleInsertSignature}
          color={signatureColor}
          setColor={setSignatureColor}
        />
      )}

      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
             onClick={() => setShowLeaveConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fffdf8", border: "1px solid rgba(116,86,44,0.2)", borderRadius: 8, padding: "32px 36px", maxWidth: 420, width: "90%", textAlign: "center", boxShadow: "0 16px 48px rgba(40,24,8,0.18)" }}>
            <p style={{ fontFamily: CINZEL, fontSize: 13, letterSpacing: 3, color: LACQUER, fontWeight: 800, margin: "0 0 14px", textTransform: "uppercase" }}>Unsaved Changes</p>
            <p style={{ fontFamily: FELL, fontSize: 15.5, color: "rgba(24,19,13,0.78)", margin: "0 0 26px", lineHeight: 1.62 }}>
              Going back will discard all your edits. Download your PDF first to keep them.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "stretch" }}>
              <button onClick={() => { setShowLeaveConfirm(false); handleDownload(); }} style={{ padding: "11px 20px", background: LACQUER, color: "#fff", border: "none", borderRadius: 3, fontFamily: CINZEL, fontSize: 13, letterSpacing: 2, cursor: "pointer", fontWeight: 800, boxShadow: "0 4px 14px rgba(139,26,26,0.22)" }}>
                Download First
              </button>
              <button onClick={() => { setShowLeaveConfirm(false); doGoHome(); }} style={{ padding: "10px 20px", background: "transparent", color: LACQUER, border: `1px solid rgba(139,26,26,0.48)`, borderRadius: 3, fontFamily: CINZEL, fontSize: 13, letterSpacing: 2, cursor: "pointer", fontWeight: 700 }}>
                Leave Anyway
              </button>
              <button onClick={() => setShowLeaveConfirm(false)} style={{ padding: "10px 20px", background: "transparent", color: "rgba(24,19,13,0.45)", border: "1px solid rgba(116,86,44,0.2)", borderRadius: 3, fontFamily: CINZEL, fontSize: 13, letterSpacing: 2, cursor: "pointer" }}>
                Stay
              </button>
            </div>
          </div>
        </div>
      )}

      <DownloadSupportPrompt
        visible={showSupportPrompt}
        onClose={() => setShowSupportPrompt(false)}
      />
    </div>
  );
}

