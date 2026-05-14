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
import { GridIcon, RotateIcon } from "./PageSidebar";
import { convertImageToPdfBytes, extractPagesAndTextFromPdfBytes } from "../utils/pdfLoadUtils";
import { pickPdfLibFont, hexToRgb, loadPdfForExport } from "../utils/pdfExportUtils";
import { loadNotoFontBytes } from "../utils/fonts";
import { makeTabId, pageWordsToTextBlocks, pdfjsLib, redrawPage } from "../utils/pdfUtils";
import { CINZEL, CROSSHATCH, GOLD, hiddenFileInput, INK, LACQUER, pageBtn, PARCHMENT, PARCHMENT_2, SCALE } from "../utils/constant";

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
  const [draggedPageNum, setDraggedPageNum] = useState(null);
  const [dragOverPageNum, setDragOverPageNum] = useState(null);
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [fontSize, setFontSize] = useState(14);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const imgDragOrigin = useRef(null);
  const imgResizeOrigin = useRef(null);
  const fbResizeOrigin = useRef(null);
  const containerRef = useRef(null);
  const canvasRefs = useRef({});

  async function handleFile(e) {
    const input = e.target;
    const file = input.files && input.files[0];
    // Reset value so the same file can be picked again later
    input.value = "";
    if (!file) return;
    try {
      snapshotCurrentTab();
      await loadPdfFromFile(file);
      const id = makeTabId();
      setTabsList(prev => [...prev, { id, fileName: file.name.match(/\.pdf$/i) ? file.name : file.name.replace(/\.[^/.]+$/, "") + ".pdf" }]);
      setActiveTabId(id);
    } catch (err) {
      console.error("Failed to load PDF/Image:", err);
      alert("Couldn't open this file: " + (err.message || err) + "\n\nTry a different file or refresh the page.");
    }
  }

  async function loadPdfFromFile(file) {
    let bytes;
    if (file.type === "application/pdf") {
      setFileName(file.name);
      const buf = await file.arrayBuffer();
      bytes = new Uint8Array(buf);
    } else if (file.type.startsWith("image/")) {
      setFileName(file.name.replace(/\.[^/.]+$/, "") + ".pdf");
      bytes = await convertImageToPdfBytes(file);
    } else {
      throw new Error("Unsupported file type: " + file.type);
    }
    await loadPdfFromBytes(bytes);
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

  // Mirror live state into a ref so snapshotCurrent always reads fresh values
  useEffect(() => {
    liveStateRef.current = {
      pdfBytes, pages, pageOrder, textBlocks, floatingBoxes, floatingImages, history, fileName, zoom, hasTextLayer, isEncrypted,
      rotatedPages, deletedPages,
    };
  });

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
  function goHome() {
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
      // Phase 7 history
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
    // Phase 7 history
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
        const ff = fmt.fontFamily || fontFamily;
        const fs = (fmt.fontSize || fontSize) * SCALE;
        return { 
          ...w, 
          text: newText, 
          edited: true, 
          fontFamily: ff, 
          fontSize: fs, 
          isBold: fmt.isBold ?? isBold, 
          isItalic: fmt.isItalic ?? isItalic, 
          x: w.x + ox / zoom,
          y: w.y + oy / zoom,
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
    const pg = pages.find(p => p.num === pageNum);
    if (!pg) return;
    saveHistory();
    floatingIdCounter++;
    const id = `float-${floatingIdCounter}`;
    const rotation = rotatedPages[pageNum] || 0;
    setFloatingBoxes(prev => [...prev, {
      id, page: pageNum,
      // z baselines stack newer overlays above older ones; bumped on every
      // create so a text box added after an image lands on top of it.
      z: 50 + floatingIdCounter,
      x: pg.width / 2, y: pg.height / 2, text: "",
      fontSize: 14, fontFamily: "Arial, sans-serif",
      isBold: false, isItalic: false, color: "#000000",
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

  function handleInsertSignature(dataUrl) {
    saveHistory();
    floatingIdCounter++;
    const id = `img-${floatingIdCounter}`;
    let targetPageNum = pages.length ? pageOrder.map(pIdx => pages[pIdx]).filter(pg => pg && !deletedPages.has(pg.num))[0]?.num : null;
    
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
  function startResizeFb(e, fb) {
    e.preventDefault();
    e.stopPropagation();
    saveHistory();
    fbResizeOrigin.current = { mx: e.clientX, my: e.clientY, fs: fb.fontSize };
    setResizingFb({ id: fb.id });
  }

  function startDragFloat(e, fb) {
    e.preventDefault();
    e.stopPropagation();
    saveHistory();
    setSelected(fb.id);
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
      const delta = (dx + dy) / 2;
      const newFs = Math.max(6, Math.min(200, Math.round(o.fs + delta * 0.18)));
      setFloatingBoxes(prev => prev.map(fb => fb.id === resizingFb.id
        ? { ...fb, fontSize: newFs }
        : fb
      ));
    }
  }, [dragging, draggingImg, resizingImg, resizingFb, zoom]);

  const onMouseUp = useCallback(() => {
    setDragging(null);
    setRotating(null);
    setDraggingImg(null);
    setResizingImg(null);
    setResizingFb(null);
  }, []);

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
      const copiedPages = await doc.copyPages(srcDoc, finalPageOrder);
      for (const p of copiedPages) doc.addPage(p);

      for (let displayIdx = 0; displayIdx < copiedPages.length; displayIdx++) {
        const pg = pages[finalPageOrder[displayIdx]];
        const pdfPage = doc.getPages()[displayIdx];
        if (!pdfPage || !pg) continue;
        const { width: pdfW, height: pdfH } = pdfPage.getSize();
        const sx = pdfW / pg.width;
        const sy = pdfH / pg.height;

        // 1. Edited original text <-' white rectangle over the original area + new text on top
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
          pdfPage.drawRectangle({ x: whiteX, y: yBottomPdf, width: whiteW, height: whiteH, color: rgb(1, 1, 1) });

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
                pdfPage.drawText(ln, { x: e.x * sx, y: yPdf, size: fs, font, color: rgb(0, 0, 0) });
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
          lines.forEach((ln, i) => {
            if (!ln) return;
            // baseline ~ y_top + fontSize (alphabetic)
            const baselineCanvas = fb.y + i * lhCanvas + fb.fontSize * 0.85;
            const yPdf = pdfH - baselineCanvas * sy;
            try {
              pdfPage.drawText(ln, { x: fb.x * sx, y: yPdf, size: fs, font, color });
            } catch { /* ignore */ }          });
        }

        // 3. Floating images
        for (const fi of floatingImages.filter(f => f.page === pg.num)) {
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
      }

      const bytes = await doc.save();
      triggerPdfDownload(bytes);

    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed: " + err.message);
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

  // Fallback used when pdf-lib can\'t parse the original PDF (rare): rasterise via canvas.
  async function handleDownloadCanvasFallback() {
    const doc = await PDFDocument.create();
    // Phase 6+7: iterate by pageOrder, filtering deleted, so reorders/deletes apply in the canvas path too.
    const finalPageOrder = pageOrder.filter(pIdx => !deletedPages.has(pages[pIdx].num));

    for (const i of finalPageOrder) {
      const pg = pages[i];
      if (!pg) continue;
      const canvas = canvasRefs.current[pg.num];
      if (!canvas) continue;
      canvas.width = pg.width;
      canvas.height = pg.height;
      const ctx = canvas.getContext("2d");

      const rotation = rotatedPages[pg.num] || 0;
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
        ctx.fillStyle = "#fff";
        ctx.fillRect(e.x - 2, e.y - 2, maxLineW + 14, whiteH + 8);
        ctx.fillStyle = "#000";
        ctx.textBaseline = "alphabetic";
        if (useBaselines) lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.lineBaselines[i]));
        else lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.baselineY + i * lh));
      }
      for (const fb of floatingBoxes.filter(f => f.page === pg.num)) {
        const lines = fb.text.split(/\r?\n/);
        ctx.font = `${fb.isItalic ? "italic " : ""}${fb.isBold ? "bold " : ""}${fb.fontSize}px ${fb.fontFamily}`;
        ctx.fillStyle = fb.color || "#000";
        ctx.textBaseline = "top";
        lines.forEach((ln, i) => ctx.fillText(ln, fb.x, fb.y + i * fb.fontSize * 1.5));
      }
      for (const fi of floatingImages.filter(f => f.page === pg.num)) {
        await new Promise(resolve => {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, fi.x, fi.y, fi.w, fi.h); resolve(); };
          img.src = fi.dataUrl;
        });
      }

      const pngBytes = await (await fetch(canvas.toDataURL("image/png"))).arrayBuffer();
      const pngImg = await doc.embedPng(pngBytes);
      const pdfPage = doc.addPage([pg.width / SCALE, pg.height / SCALE]);
      pdfPage.setRotation(degrees(rotation));
      pdfPage.drawImage(pngImg, { x: 0, y: 0, width: pg.width / SCALE, height: pg.height / SCALE });
    }
    const bytes = await doc.save();
    triggerPdfDownload(bytes);
  }

  const isNoFile = pages.length === 0;
  const visiblePages = pageOrder.map(pIdx => pages[pIdx]).filter(pg => pg && !deletedPages.has(pg.num));

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
            fontFamily={fontFamily} setFontFamily={setFontFamily}
            fontSize={fontSize} setFontSize={setFontSize}
            isBold={isBold} setIsBold={setIsBold}
            isItalic={isItalic} setIsItalic={setIsItalic}
            setIsSignModalOpen={setIsSignModalOpen}
            handleFile={handleFile}
            handleAppendFile={handleAppendFile}
            undo={undo}
            historyLength={history.length}
            zoom={zoom} setZoom={setZoom}
            handleDownload={handleDownload}
          />

          <EditorHeader
            tabsList={tabsList}
            activeTabId={activeTabId}
            switchTab={switchTab}
            closeTab={closeTab}
            handleFile={handleFile}
          />


<div
            style={{
              display: "flex",
              flex: 1,
              minHeight: 0,
              width: "100%",
              position: "relative",
              overflow: "hidden",
            }}
          >            {/* Left Sidebar */}
<aside
      style={{
        width: "340px",
        flex: "0 0 340px",
        height: "calc(100vh - 150px)",
        maxHeight: "calc(100vh - 150px)",
        minHeight: 0,
        background: PARCHMENT_2,
        borderRight: `1px solid rgba(139,26,26,0.5)`,
        borderTop: `1px solid rgba(139,26,26,0.2)`,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        alignSelf: "flex-start",
      }}
    >              <div style={{ position: 'sticky', top: 0, zIndex: 10, background: PARCHMENT_2, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(139,26,26,0.1)' }}>
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
                        <label style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: GOLD, color: PARCHMENT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
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

              <div ref={containerRef} style={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative', overflow: 'auto', padding: '40px 60px 80px 60px', background: PARCHMENT, backgroundImage: CROSSHATCH, display: isGridView ? "grid" : "flex", gridTemplateColumns: isGridView ? "repeat(auto-fill, minmax(240px, 1fr))" : undefined, flexDirection: isGridView ? undefined : "column", alignItems: isGridView ? "start" : "center", gap: isGridView ? 20 : 48, boxSizing: "border-box" }}>
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
                    <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, width: dispW, maxWidth: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Page {displayIdx + 1}</span>
                        {/* Phase 6: reorder controls. Disabled at the ends; reorder mutates pageOrder, not the source PDF, until download. */}
                        <div style={{ ...pageBtn, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 3, fontWeight: 600 }}>MOVE TO:</span>
                          <select 
                            value={displayIdx + 1}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val !== displayIdx + 1) movePageTo(pg.num, val - 1);
                            }}
                            style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, fontWeight: 600, background: "transparent", border: "none" }}
                          >
                            {visiblePages.map((_, i) => (
                              <option key={i} value={i + 1} style={{ background: PARCHMENT, color: INK }}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button onClick={e => { e.stopPropagation(); rotatePage(pg.num); }} aria-label={`Rotate page ${displayIdx + 1}`} title="Rotate page 90deg" style={{ ...pageBtn, padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <RotateIcon size={14} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); deletePage(pg.num); }} aria-label={`Delete page ${displayIdx + 1}`} title="Delete page" style={{ ...pageBtn, padding: "4px 8px" }}>X</button>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => addFloatingBox(pg.num)} style={pageBtn}>+ Add text</button>
                        <label style={pageBtn}>
                          + Add image
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
                              <EditPopup block={tb} zoom={scale} fontSize={fontSize} fontFamily={fontFamily} isBold={isBold} isItalic={isItalic}
                                offsetX={activePopup.offsetX ?? 0} offsetY={activePopup.offsetY ?? 0}
                                onOffsetChange={(ox, oy) => setActivePopup(ap => (ap && ap.blockId === tb.id ? { ...ap, offsetX: ox, offsetY: oy } : ap))}
                                onCommit={newText => commitEdit(tb.id, tb.page, newText)}
                                onCancel={cancelEdit} />
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
                          onStartResize={e => startResizeFb(e, fb)}
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
          onClose={() => setIsSignModalOpen(false)}
          onInsert={handleInsertSignature}
          color={signatureColor}
          setColor={setSignatureColor}
        />
      )}
    </div>
  );
}

