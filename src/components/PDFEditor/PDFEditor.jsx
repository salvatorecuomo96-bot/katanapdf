import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument, degrees, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import Homepage from "../Homepage";
import StaticPage from "../StaticPage";
import EditPopup from "./EditPopup";
import FloatingBox from "./FloatingBox";
import FloatingImage from "./FloatingImage";
import SignatureModal from "./SignatureModal";
import EditorNotices from "./EditorNotices";
import EditorHeader from "./EditorHeader";
import EditorToolbar from "./EditorToolbar";
import FloatingShape from "./FloatingShape";
import { GridIcon, RotateIcon } from "./PageSidebar";
import { convertImageToPdfBytes, extractPagesAndTextFromPdfBytes } from "../utils/pdfLoadUtils";
import { pickPdfLibFont, hexToRgb, loadPdfForExport } from "../utils/pdfExportUtils";
import { loadNotoFontBytes } from "../utils/fonts";
import { makeTabId, pageWordsToTextBlocks, pdfjsLib, redrawPage } from "../utils/pdfUtils";
import { CINZEL, DRAW_COLORS, FB_SIZES, FELL, GOLD, hiddenFileInput, INK, LACQUER, pageBtn, PARCHMENT, PARCHMENT_2, SCALE } from "../utils/constant";

import "./PDFEditor.css";

let floatingIdCounter = 0;


export default function PDFEditor() {
  const [pdfBytes, setPdfBytes] = useState(null);
  const [route, setRoute] = useState(() => {
    const h = (typeof window !== "undefined" && window.location.hash.slice(1)) || "home";
    return ["privacy", "terms", "about"].includes(h) ? h : "home";
  });
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1) || "home";
      setRoute(["privacy", "terms", "about"].includes(h) ? h : "home");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Dynamic title + meta description per hash route
  useEffect(() => {
    const PAGE_META = {
      "":              { title: "katanapdf — Free PDF Editor Online",         desc: "Edit, merge, sign, annotate and reorder PDF pages directly in your browser — no upload, no account." },
      "merge":         { title: "Merge PDF Files Free – katanapdf",           desc: "Combine multiple PDF files into one instantly in your browser. No upload, no account required." },
      "reorder":       { title: "Reorder PDF Pages Free – katanapdf",         desc: "Drag and drop to rearrange pages in your PDF for free, right in your browser." },
      "sign":          { title: "Sign PDF Online Free – katanapdf",           desc: "Add your handwritten signature to any PDF in seconds. No upload, no account." },
      "image-to-pdf":  { title: "Image to PDF Converter – katanapdf",        desc: "Convert JPG or PNG images to PDF instantly in your browser. Free, no upload needed." },
      "draw":          { title: "Draw & Annotate PDF Free – katanapdf",      desc: "Freehand draw, highlight and annotate your PDF directly in the browser. Free, no upload." },
      "shapes":        { title: "Add Shapes to PDF Free – katanapdf",        desc: "Add circles, rectangles and shapes to your PDF for free, right in your browser." },
      "about":         { title: "About – katanapdf",                          desc: "Learn about katanapdf, the free browser-based PDF editor with no upload and no account." },
      "privacy":       { title: "Privacy Policy – katanapdf",                 desc: "katanapdf privacy policy. Your files never leave your browser." },
      "terms":         { title: "Terms of Service – katanapdf",               desc: "katanapdf terms of service." },
    };
    const update = () => {
      const h = window.location.hash.slice(1) || "";
      const meta = PAGE_META[h] || PAGE_META[""];
      document.title = meta.title;
      const el = document.querySelector('meta[name="description"]');
      if (el) el.setAttribute("content", meta.desc);
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

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
  const [signatureColor, setSignatureColor] = useState("#000000");
  const [signatureTargetPageNum, setSignatureTargetPageNum] = useState(null);
  const [draggedPageNum, setDraggedPageNum] = useState(null);
  const [dragOverPageNum, setDragOverPageNum] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [drawPanelOpen, setDrawPanelOpen] = useState(false);
  const [drawColor, setDrawColor] = useState('#e53e3e');
  const [drawWidth, setDrawWidth] = useState(6);
  const [drawTool, setDrawTool] = useState('pencil');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [floatingShapes, setFloatingShapes] = useState([]);
  const [shapePanelPage, setShapePanelPage] = useState(null);
  const [shapePanelColor, setShapePanelColor] = useState('#000000');
  const [shapePanelFill, setShapePanelFill] = useState(false);
  const [moveToPanelPage, setMoveToPanelPage] = useState(null);
  const [draggingShape, setDraggingShape] = useState(null);
  const [resizingShape, setResizingShape] = useState(null);
  const pendingEditRef = useRef(null);
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
    return { pageData, words };
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
      rotatedPages, deletedPages,
    };
  });

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

  async function createBlankPdf() {
    snapshotCurrentTab();
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]); // US Letter
    const bytes = await doc.save();
    setFileName("blank.pdf");
    await loadPdfFromBytes(bytes);
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
    const rotation = rotatedPages[pageNum] || 0;

    let initialY = pg.height * 0.15;
    if (containerRef.current) {
      const el = containerRef.current.querySelector(`[data-pgwrap="${pageNum}"]`);
      if (el) {
        const scrollWithinPage = Math.max(0, containerRef.current.scrollTop - el.offsetTop);
        const visibleY = scrollWithinPage / zoom + 60;
        initialY = Math.min(Math.max(visibleY, 40), pg.height * 0.75);
      }
    }

    setFloatingBoxes(prev => [...prev, {
      id, page: pageNum,
      z: 50 + floatingIdCounter,
      x: pg.width / 2, y: initialY, text: "",
      fontSize: 14, fontFamily: "Arial, sans-serif",
      isBold: false, isItalic: false, color: "#000000",
      bgColor: "#ffffff",
      angle: 0, // 0 means horizontal on screen (FloatingBox.jsx handles counter-rotation)
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
    shapeDragOrigin.current = { mx: e.clientX, my: e.clientY, x: shape.x, y: shape.y };
    setDraggingShape({ id: shape.id });
  }

  function startResizeShape(e, shape) {
    e.preventDefault();
    e.stopPropagation();
    shapeResizeOrigin.current = { mx: e.clientX, my: e.clientY, w: shape.w, h: shape.h };
    setResizingShape({ id: shape.id });
  }
  function handleDrawStart(e, pgNum, scale) {
    if (!drawMode) return;
    e.preventDefault();
    isDrawingRef.current = true;
    const canvas = drawCanvasRefs.current[pgNum];
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
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
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
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
    setDrawMode(false);
    setDrawPanelOpen(false);
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

  function startResizeImg(e, fi) {
    e.preventDefault();
    e.stopPropagation();
    saveHistory();
    imgResizeOrigin.current = { mx: e.clientX, my: e.clientY, w: fi.w, h: fi.h };
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
      setFloatingImages(prev => prev.map(fi => fi.id === resizingImg.id
        ? { ...fi, w: Math.max(40, o.w + e.clientX - o.mx), h: Math.max(40, o.h + e.clientY - o.my) }
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
      setFloatingShapes(prev => prev.map(s => s.id === draggingShape.id
        ? { ...s, x: Math.max(0, o.x + (e.clientX - o.mx) / zoom), y: Math.max(0, o.y + (e.clientY - o.my) / zoom) }
        : s
      ));
    }
    if (resizingShape) {
      const o = shapeResizeOrigin.current;
      if (!o) return;
      setFloatingShapes(prev => prev.map(s => s.id === resizingShape.id
        ? { ...s, w: Math.max(40, o.w + (e.clientX - o.mx) / zoom), h: Math.max(40, o.h + (e.clientY - o.my) / zoom) }
        : s
      ));
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
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  async function rasterizePage(pg) {
    const canvas = document.createElement("canvas");
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
      const lineCount = Math.max(1, lines.length);
      const useBaselines = e.lineBaselines && e.lineBaselines.length === lines.length;
      ctx.font = `${e.isItalic ? "italic " : ""}${e.isBold ? "bold " : ""}${e.fontSize}px ${e.fontFamily}`;
      let maxLineW = e.width;
      for (const ln of lines) maxLineW = Math.max(maxLineW, ctx.measureText(ln || " ").width);
      let whiteH;
      if (useBaselines && lines.length > 1) {
        const bs = e.lineBaselines;
        whiteH = Math.max(e.height + 12, Math.max(...bs) - Math.min(...bs) + lh + 16);
      } else {
        whiteH = Math.max(e.height + 12, lineCount * lh + 14);
      }
      ctx.fillStyle = e.bgColor && e.bgColor !== "transparent" ? e.bgColor : "#fff";
      ctx.fillRect(e.x - 2, e.y - 2, maxLineW + 14, whiteH + 8);
      ctx.fillStyle = e.color || "#000";
      ctx.textBaseline = "alphabetic";
      if (useBaselines) lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.lineBaselines[i]));
      else lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.baselineY + i * lh));
    }
    for (const fb of floatingBoxes.filter(f => f.page === pg.num)) {
      const lines = fb.text.split(/\r?\n/);
      ctx.font = `${fb.isItalic ? "italic " : ""}${fb.isBold ? "bold " : ""}${fb.fontSize}px ${fb.fontFamily}`;
      ctx.textBaseline = "top";
      if (fb.bgColor && fb.bgColor !== "transparent") {
        let maxW = 0;
        for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln || " ").width);
        const lh = fb.fontSize * 1.5;
        ctx.fillStyle = fb.bgColor;
        ctx.fillRect(fb.x - 4, fb.y - 3, maxW + 8, lines.length * lh + 6);
      }
      ctx.fillStyle = fb.color || "#000";
      lines.forEach((ln, i) => ctx.fillText(ln, fb.x, fb.y + i * fb.fontSize * 1.5));
    }
    for (const fi of floatingImages.filter(f => f.page === pg.num)) {
      await new Promise(resolve => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, fi.x, fi.y, fi.w, fi.h); resolve(); };
        img.src = fi.dataUrl;
      });
    }
    for (const shape of floatingShapes.filter(s => s.page === pg.num)) {
      ctx.beginPath();
      ctx.strokeStyle = shape.shapeColor;
      ctx.fillStyle = shape.shapeColor;
      ctx.lineWidth = 3;
      if (shape.shapeType === "circle") {
        ctx.ellipse(shape.x + shape.w / 2, shape.y + shape.h / 2, shape.w / 2, shape.h / 2, 0, 0, Math.PI * 2);
      } else {
        ctx.rect(shape.x, shape.y, shape.w, shape.h);
      }
      if (shape.shapeFill) ctx.fill(); else ctx.stroke();
    }
    return canvas.toDataURL("image/png");
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

        // 2. New floating text boxes
        for (const fb of floatingBoxes.filter(f => f.page === pg.num)) {
          const text = fb.text || "";
          if (!text) continue;
          const font = pickPdfLibFont(fonts, fb.fontFamily, fb.isBold, fb.isItalic);
          const fs = fb.fontSize * sy;
          const lhCanvas = fb.fontSize * 1.5;
          const lines = text.split(/\r?\n/);
          const color = hexToRgb(fb.color || "#000000");

          if (fb.bgColor && fb.bgColor !== "transparent") {
            let maxLineW = 0;

            for (const ln of lines) {
              try {
                maxLineW = Math.max(
                  maxLineW,
                  font.widthOfTextAtSize(ln || " ", fs)
                );
              } catch {
                maxLineW = Math.max(maxLineW, (ln || " ").length * fs * 0.6);
              }
            }

            const padX = 4 * sx;
            const padY = 3 * sy;
            const bgW = maxLineW + padX * 2;
            const bgH = lines.length * lhCanvas * sy + padY * 2;
            const bgX = fb.x * sx - padX;
            const bgY = pdfH - (fb.y + lines.length * lhCanvas) * sy - padY;

            pdfPage.drawRectangle({
              x: bgX,
              y: bgY,
              width: bgW,
              height: bgH,
              color: hexToRgb(fb.bgColor),
            });
          }

          lines.forEach((ln, i) => {
            if (!ln) return;
            // baseline ~ y_top + fontSize (alphabetic)
            const baselineCanvas = fb.y + i * lhCanvas + fb.fontSize * 0.85;
            const yPdf = pdfH - baselineCanvas * sy;
            try {
              pdfPage.drawText(ln, { x: fb.x * sx, y: yPdf, size: fs, font, color });
            } catch { /* ignore */ }
          });
        }

        // 3. Floating images
        for (const fi of floatingImages.filter(f => f.page === pg.num)) {
          if (fi.isHighlight && fi.hlRect) {
            const r = fi.hlRect;
            pdfPage.drawRectangle({
              x: r.x * sx,
              y: pdfH - (r.y + r.h) * sy,
              width: r.w * sx,
              height: r.h * sy,
              color: hexToRgb(r.color),
              opacity: 0.4,
              borderWidth: 0,
            });
            continue;
          }
          const isJpg = /^data:image\/jpe?g/i.test(fi.dataUrl);
          const data = await (await fetch(fi.dataUrl)).arrayBuffer();
          let img;
          try {
            img = isJpg ? await doc.embedJpg(data) : await doc.embedPng(data);
          } catch {
            try { img = await doc.embedPng(data); } catch { continue; }
          }
          const x = fi.x * sx;
          const w = fi.w * sx;
          const h = fi.h * sy;
          const yPdf = pdfH - (fi.y + fi.h) * sy;
          pdfPage.drawImage(img, { x: x, y: yPdf, width: w, height: h, rotate: degrees(fi.angle || 0) });
        }

        // 4. Shapes
        for (const shape of floatingShapes.filter(s => s.page === pg.num)) {
          const sc = hexToRgb(shape.shapeColor);
          if (shape.shapeType === 'circle') {
            pdfPage.drawEllipse({
              x: (shape.x + shape.w / 2) * sx,
              y: pdfH - (shape.y + shape.h / 2) * sy,
              xScale: (shape.w / 2) * sx,
              yScale: (shape.h / 2) * sy,
              ...(shape.shapeFill ? { color: sc } : { borderColor: sc, borderWidth: 1.5 }),
            });
          } else {
            pdfPage.drawRectangle({
              x: shape.x * sx,
              y: pdfH - (shape.y + shape.h) * sy,
              width: shape.w * sx,
              height: shape.h * sy,
              ...(shape.shapeFill ? { color: sc } : { borderColor: sc, borderWidth: 1.5 }),
            });
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
      const rotation = rotatedPages[pg.num] || 0;
      const canvas = document.createElement("canvas");
      canvas.width = pg.width;
      canvas.height = pg.height;
      const ctx = canvas.getContext("2d");
      await new Promise(resolve => { const img = new Image(); img.onload = () => { ctx.drawImage(img, 0, 0); resolve(); }; img.src = pg.dataUrl; });
      const edits = (textBlocks[pg.num] || []).filter(w => w.edited);
      for (const e of edits) {
        const lines = e.text.split(/\r?\n/);
        const lh = e.fontSize * 1.22;
        const useBaselines = e.lineBaselines && e.lineBaselines.length === lines.length;
        ctx.font = `${e.isItalic ? "italic " : ""}${e.isBold ? "bold " : ""}${e.fontSize}px ${e.fontFamily}`;
        let maxLineW = e.width;
        for (const ln of lines) maxLineW = Math.max(maxLineW, ctx.measureText(ln || " ").width);
        const whiteH = useBaselines && lines.length > 1 ? Math.max(e.height + 12, Math.max(...e.lineBaselines) - Math.min(...e.lineBaselines) + lh + 16) : Math.max(e.height + 12, lines.length * lh + 14);
        ctx.fillStyle = e.bgColor && e.bgColor !== "transparent" ? e.bgColor : "#fff";
        ctx.fillRect(e.x - 2, e.y - 2, maxLineW + 14, whiteH + 8);
        ctx.fillStyle = e.color || "#000";
        ctx.textBaseline = "alphabetic";
        if (useBaselines) lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.lineBaselines[i]));
        else lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.baselineY + i * lh));
      }
      for (const fb of floatingBoxes.filter(f => f.page === pg.num)) {
        const lines = fb.text.split(/\r?\n/);
        ctx.font = `${fb.isItalic ? "italic " : ""}${fb.isBold ? "bold " : ""}${fb.fontSize}px ${fb.fontFamily}`;
        ctx.textBaseline = "top";
        if (fb.bgColor && fb.bgColor !== "transparent") {
          let maxW = 0;
          for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln || " ").width);
          ctx.fillStyle = fb.bgColor;
          ctx.fillRect(fb.x - 4, fb.y - 3, maxW + 8, lines.length * fb.fontSize * 1.5 + 6);
        }
        ctx.fillStyle = fb.color || "#000";
        lines.forEach((ln, i) => ctx.fillText(ln, fb.x, fb.y + i * fb.fontSize * 1.5));
      }
      for (const fi of floatingImages.filter(f => f.page === pg.num)) {
        await new Promise(resolve => { const img = new Image(); img.onload = () => { ctx.drawImage(img, fi.x, fi.y, fi.w, fi.h); resolve(); }; img.src = fi.dataUrl; });
      }
      for (const shape of floatingShapes.filter(s => s.page === pg.num)) {
        ctx.beginPath();
        ctx.strokeStyle = shape.shapeColor;
        ctx.fillStyle = shape.shapeColor;
        ctx.lineWidth = 3;
        if (shape.shapeType === 'circle') ctx.ellipse(shape.x + shape.w / 2, shape.y + shape.h / 2, shape.w / 2, shape.h / 2, 0, 0, Math.PI * 2);
        else ctx.rect(shape.x, shape.y, shape.w, shape.h);
        if (shape.shapeFill) ctx.fill(); else ctx.stroke();
      }
      if (displayIdx > 0) await new Promise(r => setTimeout(r, 80));
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = finalPageOrder.length === 1 ? `${baseName}.png` : `${baseName}_page_${displayIdx + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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
  }

  async function handleDownloadCanvasFallback() {
    const doc = await PDFDocument.create();
    const finalPageOrder = pageOrder.filter(pIdx => !deletedPages.has(pages[pIdx].num));
    for (const i of finalPageOrder) {
      const pg = pages[i];
      if (!pg) continue;
      const rotation = rotatedPages[pg.num] || 0;
      const dataUrl = await rasterizePage(pg);
      const pngBytes = await (await fetch(dataUrl)).arrayBuffer();
      const pngImg = await doc.embedPng(pngBytes);
      const pdfPage = doc.addPage([pg.width / SCALE, pg.height / SCALE]);
      pdfPage.setRotation(degrees(rotation));
      pdfPage.drawImage(pngImg, { x: 0, y: 0, width: pg.width / SCALE, height: pg.height / SCALE });
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

  return (
    <div className={`editor-container ${isNoFile ? "editor-relative" : "editor-fixed"}`}
         style={{ userSelect: dragging ? "none" : "auto" }}
         onClick={handleBgClick}>
      {route !== "home" ? (
        <StaticPage route={route} />
      ) : isNoFile ? (
        <Homepage
          onFile={handleFile}
          onDropFile={handleDroppedFile}
          onCreateBlank={createBlankPdf}
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
          <div className="mobile-editor-hint">For best editing, use a desktop or tablet</div>


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
        background: "#e8e0d0",
        borderRight: `1px solid rgba(139,26,26,0.35)`,
        borderTop: `1px solid rgba(139,26,26,0.15)`,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >              <div style={{ position: 'sticky', top: 0, zIndex: 10, background: "#e8e0d0", padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(139,26,26,0.1)' }}>
                <button onClick={() => setIsGridView(g => !g)} title={isGridView ? "Exit Grid" : "Grid View"} style={{ width: 32, height: 32, border: `1px solid rgba(196,150,58,0.4)`, borderRadius: '4px', background: PARCHMENT, color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GridIcon />
                </button>
                <label title="Add PDF or Image" style={{ width: 32, height: 32, border: `1px solid rgba(196,150,58,0.4)`, borderRadius: '4px', background: PARCHMENT, color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600 }}>
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
                      position: 'relative', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: `1px solid ${GOLD}`, cursor: 'pointer',
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{ fontFamily: CINZEL, fontSize: 10, color: LACQUER, fontWeight: 600 }}>{i + 1}</span>
                      <button onClick={(e) => { e.stopPropagation(); rotatePage(pg.num); }} style={{ width: 26, height: 26, border: '1px solid rgba(196,150,58,0.4)', borderRadius: '4px', background: PARCHMENT, color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Rotate">
                        <RotateIcon size={14} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deletePage(pg.num); }} style={{ width: 26, height: 26, border: '1px solid rgba(196,150,58,0.4)', borderRadius: '4px', background: PARCHMENT, color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }} title="Delete">X</button>
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
                         }
                       }}
                       onDragLeave={() => {
                         if (dragOverPageNum === pg.num) setDragOverPageNum(null);
                       }}
                       onDrop={e => {
                         if (isGridView && draggedPageNum !== null) {
                           e.preventDefault();
                           movePageTo(draggedPageNum, displayIdx);
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
                         border: dragOverPageNum === pg.num ? `2px dashed ${LACQUER}` : "2px solid transparent",
                         padding: isGridView ? 4 : 0,
                         boxSizing: "border-box"
                       }}>
                  {!isGridView && (
                    <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, width: dispW, maxWidth: "100%", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Page {displayIdx + 1}</span>
                        {/* Phase 6: reorder controls — custom popup instead of native select */}
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={e => { e.stopPropagation(); setMoveToPanelPage(p => p === pg.num ? null : pg.num); }}
                            style={{ ...pageBtn, display: "flex", alignItems: "center", gap: 4, padding: "4px 8px" }}
                            title="Move page to position"
                          >
                            <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 2, fontWeight: 600 }}>MOVE TO</span>
                          </button>
                          {moveToPanelPage === pg.num && (
                            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", left: 0, marginTop: 4, background: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 6, padding: "6px", zIndex: 9999, display: "flex", flexDirection: "column", gap: 3, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", maxHeight: 200, overflowY: "auto", minWidth: 64 }}>
                              {visiblePages.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => { if (i !== displayIdx) movePageTo(pg.num, i); setMoveToPanelPage(null); }}
                                  style={{ ...pageBtn, padding: "4px 12px", background: i === displayIdx ? "rgba(139,26,26,0.1)" : "transparent", fontWeight: i === displayIdx ? 700 : 400, borderRadius: 4 }}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Per-page zoom controls */}
                        <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", border: `1px solid ${GOLD}`, borderRadius: 3, overflow: "hidden" }}>
                          <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} style={{ ...pageBtn, padding: "7px 11px", border: "none", borderRight: `1px solid ${GOLD}`, fontSize: 14, lineHeight: 1, fontWeight: 700 }} title="Zoom out">−</button>
                          <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, minWidth: 42, textAlign: "center", letterSpacing: 1, padding: "7px 4px", fontWeight: 600 }}>{Math.round(zoom * 100)}%</span>
                          <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))} style={{ ...pageBtn, padding: "7px 11px", border: "none", borderLeft: `1px solid ${GOLD}`, fontSize: 14, lineHeight: 1, fontWeight: 700 }} title="Zoom in">+</button>
                        </div>
                        <button onClick={e => { e.stopPropagation(); rotatePage(pg.num); }} aria-label={`Rotate page ${displayIdx + 1}`} title="Rotate page 90deg" style={{ ...pageBtn, padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <RotateIcon size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deletePage(pg.num); }} aria-label={`Delete page ${displayIdx + 1}`} title="Delete page" style={{ ...pageBtn, padding: "4px 8px" }}>X</button>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {/* Sign */}
                        <button
                          onClick={e => { e.stopPropagation(); setDrawMode(false); setDrawPanelOpen(false); setSignatureTargetPageNum(pg.num); setIsSignModalOpen(true); }}
                          style={pageActionBtn} title="Sign"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 L18 10 L12 22 L6 10 Z"/><line x1="12" y1="22" x2="12" y2="10" strokeWidth="1.2"/><line x1="6" y1="10" x2="18" y2="10" strokeWidth="1" opacity="0.5"/></svg>
                          <span className="page-action-label">Sign</span>
                        </button>

                        {/* Draw + controls dropdown */}
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              const next = !drawMode;
                              setDrawMode(next);
                              setDrawPanelOpen(next);
                              if (next) setShapePanelPage(null);
                            }}
                            style={{ ...pageActionBtn, background: drawMode ? 'rgba(139,26,26,0.12)' : 'transparent', outline: drawMode ? '1px solid #8B1A1A' : 'none', outlineOffset: 2 }}
                            title="Freehand draw"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>
                            <span className="page-action-label">Draw</span>
                          </button>
                          {drawPanelOpen && (
                            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, display: "flex", flexDirection: "column", gap: 6, background: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 4, padding: "8px", zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", minWidth: 136 }}>
                              {/* Pencil / Highlight toggle — closes panel on click */}
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => setDrawTool('pencil')} style={{ flex: 1, padding: "3px 6px", fontFamily: CINZEL, fontSize: 9, letterSpacing: 1, cursor: "pointer", border: `1px solid ${GOLD}`, borderRadius: 2, background: drawTool === 'pencil' ? LACQUER : "transparent", color: drawTool === 'pencil' ? "#fff" : LACQUER, fontWeight: 700 }}>PENCIL</button>
                                <button onClick={() => { setDrawTool('highlighter'); if (drawWidth < 10) setDrawWidth(14); }} style={{ flex: 1, padding: "3px 6px", fontFamily: CINZEL, fontSize: 9, letterSpacing: 1, cursor: "pointer", border: `1px solid ${GOLD}`, borderRadius: 2, background: drawTool === 'highlighter' ? LACQUER : "transparent", color: drawTool === 'highlighter' ? "#fff" : LACQUER, fontWeight: 700 }}>HIGHLIGHT</button>
                              </div>
                              {/* 4×4 color grid — closes panel on color select */}
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                                {DRAW_COLORS.map(c => (
                                  <button key={c} onClick={() => { setDrawColor(c); setDrawPanelOpen(false); }} title={c} style={{ width: 26, height: 26, background: c, border: drawColor === c ? `2px solid ${LACQUER}` : "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", padding: 0 }} />
                                ))}
                                <label title="Custom color" style={{ width: 26, height: 26, border: `1px solid rgba(0,0,0,0.2)`, borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", position: "relative", overflow: "hidden" }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={LACQUER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                                  <input type="color" value={drawColor}
                                    onChange={e => setDrawColor(e.target.value)}
                                    onBlur={() => setDrawPanelOpen(false)}
                                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
                                </label>
                              </div>
                              {/* Width — same size list as text */}
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
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={e => { e.stopPropagation(); setDrawMode(false); setDrawPanelOpen(false); setShapePanelPage(p => p === pg.num ? null : pg.num); }}
                            style={{ ...pageActionBtn, background: shapePanelPage === pg.num ? 'rgba(139,26,26,0.12)' : 'transparent', outline: shapePanelPage === pg.num ? '1px solid #8B1A1A' : 'none', outlineOffset: 2 }}
                            title="Add shape"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="5"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>
                            <span className="page-action-label">Shapes</span>
                          </button>
                          {shapePanelPage === pg.num && (
                            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, background: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 6, padding: "12px 14px", zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", minWidth: 160 }}>
                              <div style={{ fontFamily: CINZEL, fontSize: 10, color: LACQUER, letterSpacing: 3, fontWeight: 700 }}>SHAPE COLOR</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input type="color" value={shapePanelColor} onChange={e => setShapePanelColor(e.target.value)} style={{ width: 28, height: 28, cursor: "pointer", border: `1px solid ${GOLD}`, borderRadius: 4, padding: 2 }} />
                                <label style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: CINZEL, fontSize: 10, color: LACQUER, cursor: "pointer", letterSpacing: 2 }}>
                                  <input type="checkbox" checked={shapePanelFill} onChange={e => setShapePanelFill(e.target.checked)} style={{ accentColor: LACQUER }} />
                                  FILLED
                                </label>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => handleAddShape(pg.num, 'circle')} style={{ ...pageActionBtn, flex: 1, flexDirection: "column", gap: 4, padding: "10px 8px" }} title="Add circle">
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/></svg>
                                  <span style={{ fontSize: 9, letterSpacing: 2 }}>CIRCLE</span>
                                </button>
                                <button onClick={() => handleAddShape(pg.num, 'square')} style={{ ...pageActionBtn, flex: 1, flexDirection: "column", gap: 4, padding: "10px 8px" }} title="Add square">
                                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
                                  <span style={{ fontSize: 9, letterSpacing: 2 }}>SQUARE</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Add Text */}
                        <button
                          onClick={e => { e.stopPropagation(); setDrawMode(false); setDrawPanelOpen(false); addFloatingBox(pg.num); }}
                          style={pageActionBtn} title="Add text box"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="12" y1="6" x2="12" y2="20"/><line x1="9" y1="20" x2="15" y2="20"/></svg>
                          <span className="page-action-label">Add text</span>
                        </button>

                        {/* Add Image */}
                        <label style={pageActionBtn} title="Add image" onClick={() => { setDrawMode(false); setDrawPanelOpen(false); }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <span className="page-action-label">Add image</span>
                          <input type="file" accept="image/*" onChange={e => handleAddImage(e, pg.num)} style={hiddenFileInput} />
                        </label>
                      </div>
                    </div>
                  )}
                  {isGridView && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                       <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Page {displayIdx + 1}</span>
                       <button onClick={e => { e.stopPropagation(); deletePage(pg.num); }} aria-label={`Delete page ${displayIdx + 1}`} title="Delete page" style={{ ...pageBtn, padding: "2px 6px", fontSize: 10 }}>X</button>
                    </div>
                  )}
                  <div data-pgwrap={pg.num} onClick={e => { 
                    e.stopPropagation(); 
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
                        />
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
                          onStartResize={e => startResizeImg(e, fi)}
                          onDelete={() => deleteFloatingImage(fi.id)} />
                      ))}
                      {!isGridView && floatingShapes.filter(s => s.page === pg.num).map(shape => (
                        <FloatingShape key={shape.id} shape={shape} isSel={selected === shape.id} zoom={scale}
                          onSelect={() => setSelected(shape.id)}
                          onDeselect={() => setSelected(null)}
                          onStartDrag={e => startDragShape(e, shape)}
                          onStartResize={e => startResizeShape(e, shape)}
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
          <div onClick={e => e.stopPropagation()} style={{ background: PARCHMENT, border: `1px solid ${GOLD}`, padding: "28px 32px", maxWidth: 400, width: "90%", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.28)" }}>
            <p style={{ fontFamily: CINZEL, fontSize: 14, letterSpacing: 2, color: LACQUER, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase" }}>Unsaved changes</p>
            <p style={{ fontFamily: FELL, fontSize: 15, color: INK, margin: "0 0 22px", lineHeight: 1.55 }}>
              Going back will discard all your edits. Download your PDF first to keep them.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => { setShowLeaveConfirm(false); handleDownload(); }} style={{ padding: "9px 20px", background: LACQUER, color: "#fff", border: `1px solid ${GOLD}`, fontFamily: CINZEL, fontSize: 11, letterSpacing: 2, cursor: "pointer", fontWeight: 700 }}>
                DOWNLOAD FIRST
              </button>
              <button onClick={() => { setShowLeaveConfirm(false); doGoHome(); }} style={{ padding: "9px 20px", background: "transparent", color: LACQUER, border: `1px solid ${LACQUER}`, fontFamily: CINZEL, fontSize: 11, letterSpacing: 2, cursor: "pointer", fontWeight: 700 }}>
                LEAVE ANYWAY
              </button>
              <button onClick={() => setShowLeaveConfirm(false)} style={{ padding: "9px 20px", background: "transparent", color: INK, border: `1px solid rgba(26,18,8,0.3)`, fontFamily: CINZEL, fontSize: 11, letterSpacing: 2, cursor: "pointer" }}>
                STAY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

