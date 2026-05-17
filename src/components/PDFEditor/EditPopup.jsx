import { useEffect, useRef, useState } from "react";
import { INK, LACQUER, GOLD, PARCHMENT, FB_SIZES, FONT_FAMILIES, SCALE, CINZEL, DRAW_COLORS } from "../utils/constant";
import HexColorInput from "./HexColorInput";

const RotateIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

export default function EditPopup({
  block,
  zoom,
  rotation = 0,
  onCommit,
  onCancel,
  onDraftChange,
}) {
  const [text, setText] = useState(block.text || "");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const rawSize = Math.round((block.fontSize || 14) / SCALE);
  // For OCR blocks keep the exact detected size; for normal blocks snap to the grid
  const snapSize = block.ocr
    ? rawSize
    : FB_SIZES.reduce((prev, curr) =>
        Math.abs(curr - rawSize) < Math.abs(prev - rawSize) ? curr : prev
      );
  // Size dropdown includes the OCR-detected size even if it's not in the standard list
  const sizeOptions = (block.ocr && !FB_SIZES.includes(snapSize))
    ? [...FB_SIZES, snapSize].sort((a, b) => a - b)
    : FB_SIZES;

  const [format, setFormat] = useState({
    fontFamily: block.fontFamily || "Arial, sans-serif",
    fontSize: snapSize,
    color: block.color || "#000000",
    isBold: block.isBold || false,
    isItalic: block.isItalic || false,
    bgColor: block.bgColor || "#ffffff",
    angle: block.angle || 0,
  });

  const [openPanel, setOpenPanel] = useState(null); // 'textColor' | 'bgColor' | null
  const dragOrigin = useRef(null);
  const taRef = useRef(null);
  const boxRef = useRef(null);

  // Always-fresh commit function so the document listener below never stales
  const commitRef = useRef(null);
  commitRef.current = () => onCommit(text, offset.x, offset.y, format);

  // Delay activation so the opening click doesn't immediately commit
  const mountedRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { mountedRef.current = true; }, 50);
    return () => clearTimeout(t);
  }, []);

  // Click-outside → commit (capture phase bypasses any stopPropagation in the tree)
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!mountedRef.current) return;
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        commitRef.current();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown, true);
    return () => document.removeEventListener("mousedown", onDocMouseDown, true);
  }, []);

  useEffect(() => {
    onDraftChange?.(text, format);
  }, [text, format]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;

    const timer = setTimeout(() => {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 30);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const move = e => {
      if (!dragging || !dragOrigin.current) return;

      const dx = e.clientX - dragOrigin.current.mx;
      const dy = e.clientY - dragOrigin.current.my;

      const rad = -(rotation || 0) * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const localDx = dx * cos - dy * sin;
      const localDy = dx * sin + dy * cos;

      setOffset({
        x: dragOrigin.current.ox + localDx / zoom,
        y: dragOrigin.current.oy + localDy / zoom,
      });
    };

    const up = () => setDragging(false);

    if (dragging) {
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    }

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, rotation, zoom]);

  const keepInsideEditor = e => {
    e.stopPropagation();
  };

  const refocusText = () => {
    setTimeout(() => {
      const el = taRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 0);
  };

  const commit = e => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    onCommit(text, offset.x, offset.y, format);
  };

  const startRotate = e => {
    e.preventDefault();
    e.stopPropagation();

    const box = boxRef.current;

    if (!box) return;

    const rect = box.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startMouseAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const startBoxAngle = format.angle || 0;

    const move = moveEvent => {
      const currentMouseAngle = Math.atan2(
        moveEvent.clientY - cy,
        moveEvent.clientX - cx
      );

      const delta = (currentMouseAngle - startMouseAngle) * 180 / Math.PI;

      setFormat(prev => ({
        ...prev,
        angle: startBoxAngle + delta,
      }));
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

 window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const startResizeText = (e, axis = 'both') => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startFontSize = format.fontSize;

    const move = moveEvent => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const delta = axis === 'x' ? dx : axis === '-x' ? -dx : (dx + dy) / 2;

      const nextFontSize = Math.max(
        6,
        Math.min(200, Math.round(startFontSize + delta * 0.05))
      );

      setFormat(prev => ({
        ...prev,
        fontSize: nextFontSize,
      }));
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      refocusText();
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const cssFontSize = Math.max(8, format.fontSize * SCALE * zoom);
  const lineHeight = cssFontSize * 1.28;
  const lines = (text || "").split(/\r?\n/);

  let measuredTextW = 0;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = `${format.isItalic ? "italic " : ""}${format.isBold ? "bold " : ""}${cssFontSize}px ${format.fontFamily}`;
    measuredTextW = lines.reduce(
      (max, line) => Math.max(max, ctx.measureText(line || " ").width),
      0
    );
  } else {
    measuredTextW = Math.max(...lines.map(line => line.length)) * cssFontSize * 0.5;
  }

  const bboxMinW = block.ocr ? Math.round(block.width * zoom) : 0;
  const editorW = Math.max(
    bboxMinW,
    text.trim() ? 70 : 90,
    Math.min(900, measuredTextW + 14)
  );

  const editorH = Math.max(
    lineHeight + 8,
    lines.length * lineHeight + 8
  );

  return (
    <>
      {dragging && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            cursor: "grabbing",
          }}
        />
      )}

      <div
        ref={boxRef}
        data-edit-popup-box
        onPointerDown={keepInsideEditor}
        onMouseDown={keepInsideEditor}
        onClick={keepInsideEditor}
        style={{
          position: "absolute",
          left: offset.x * zoom,
          top: offset.y * zoom,
          width: editorW,
          height: editorH,
          zIndex: 3000,
          border: `1px dashed ${GOLD}`,
          borderRadius: 3,
          background:
            format.bgColor && format.bgColor !== "transparent"
              ? format.bgColor
              : "transparent",
          boxShadow: "none",
          boxSizing: "border-box",
          overflow: "visible",
          transform: `rotate(${format.angle || 0}deg)`,
          transformOrigin: "center center",
        }}
      >
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: "absolute",
            left: 0,
            top: -36,
            height: 30,
            width: "max-content",
            maxWidth: 560,
            background: "#fffdf8",
            padding: "2px 4px",
            cursor: "default",
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 3,
            userSelect: "none",
            border: "1px solid rgba(116,86,44,0.25)",
            boxShadow: "0 4px 16px rgba(40,24,8,0.12)",
            boxSizing: "border-box",
          }}
        >


          <button
            type="button"
            onMouseDown={e => {
              e.stopPropagation();
              dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y };
              setDragging(true);
            }}
            title="Drag to move"
            style={{
              minWidth: 26,
              height: 23,
              borderRadius: 2,
              border: "1px solid rgba(116,86,44,0.22)",
              background: "rgba(139,26,26,0.04)",
              color: INK,
              fontSize: 10,
              cursor: "grab",
              padding: "1px 5px",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
          </button>

          <select
            value={format.fontFamily}
            onPointerDown={keepInsideEditor}
            onMouseDown={keepInsideEditor}
            onClick={keepInsideEditor}
            onChange={e => {
              e.stopPropagation();
              setFormat(prev => ({ ...prev, fontFamily: e.target.value }));
              refocusText();
            }}
            style={{
              fontSize: 11,
              background: "#fff",
              border: "none",
              borderRadius: 2,
              padding: "1px 2px",
              width: 132,
              height: 23,
            }}
          >
            {FONT_FAMILIES.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>

          <select
            value={sizeOptions.includes(format.fontSize) ? format.fontSize : snapSize}
            onPointerDown={keepInsideEditor}
            onMouseDown={keepInsideEditor}
            onClick={keepInsideEditor}
            onChange={e => {
              e.stopPropagation();
              setFormat(prev => ({ ...prev, fontSize: Number(e.target.value) }));
              refocusText();
            }}
            style={{
              fontSize: 11,
              background: "#fff",
              border: "none",
              borderRadius: 2,
              padding: "1px 2px",
              width: 48,
              height: 23,
            }}
          >
            {sizeOptions.map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setFormat(prev => ({ ...prev, isBold: !prev.isBold }));
              refocusText();
            }}
            onMouseDown={keepInsideEditor}
            style={{
              minWidth: 23,
              height: 23,
              borderRadius: 2,
              border: format.isBold ? `1px solid rgba(139,26,26,0.5)` : "1px solid rgba(116,86,44,0.22)",
              background: format.isBold ? "rgba(139,26,26,0.1)" : "rgba(139,26,26,0.04)",
              color: INK,
              fontWeight: "bold",
              fontSize: 11,
              cursor: "pointer",
              padding: "1px 5px",
            }}
            title="Bold"
          >
            B
          </button>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setFormat(prev => ({ ...prev, isItalic: !prev.isItalic }));
              refocusText();
            }}
            onMouseDown={keepInsideEditor}
            style={{
              minWidth: 23,
              height: 23,
              borderRadius: 2,
              border: format.isItalic ? `1px solid rgba(139,26,26,0.5)` : "1px solid rgba(116,86,44,0.22)",
              background: format.isItalic ? "rgba(139,26,26,0.1)" : "rgba(139,26,26,0.04)",
              color: INK,
              fontStyle: "italic",
              fontWeight: "bold",
              fontSize: 11,
              cursor: "pointer",
              padding: "1px 5px",
            }}
            title="Italic"
          >
            I
          </button>

          {/* Text colour — swatch opens 4×4 grid */}
          <div style={{ position: "relative", flex: "0 0 auto" }} onMouseDown={keepInsideEditor} onClick={keepInsideEditor} onPointerDown={keepInsideEditor}>
            <button
              type="button"
              title="Text colour"
              onClick={e => { e.stopPropagation(); setOpenPanel(o => o === 'textColor' ? null : 'textColor'); }}
              style={{ width: 18, height: 18, borderRadius: "50%", background: format.color, border: "2px solid rgba(116,86,44,0.4)", cursor: "pointer", padding: 0, display: "block" }}
            />
            {openPanel === 'textColor' && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, display: "flex", flexDirection: "column", background: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 4, padding: 5, zIndex: 10000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                  {DRAW_COLORS.map(c => (
                    <button key={c} type="button" onClick={e => { e.stopPropagation(); setFormat(prev => ({ ...prev, color: c })); setOpenPanel(null); refocusText(); }}
                      style={{ width: 20, height: 20, background: c, border: format.color === c ? `2px solid ${LACQUER}` : "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", padding: 0 }} />
                  ))}
                </div>
                <HexColorInput value={format.color} onChange={v => setFormat(prev => ({ ...prev, color: v }))} onDone={() => { setOpenPanel(null); refocusText(); }} />
              </div>
            )}
          </div>

          {/* Background colour — same grid as text colour */}
          <div style={{ position: "relative", flex: "0 0 auto" }} onMouseDown={keepInsideEditor} onClick={keepInsideEditor} onPointerDown={keepInsideEditor}>
            <button
              type="button"
              title="Background colour"
              onClick={e => { e.stopPropagation(); setOpenPanel(o => o === 'bgColor' ? null : 'bgColor'); }}
              style={{
                width: 18, height: 18, borderRadius: "50%",
                background: format.bgColor === "transparent" || !format.bgColor ? "#ffffff" : format.bgColor,
                border: format.bgColor === "transparent" || !format.bgColor ? "1.5px dashed rgba(0,0,0,0.35)" : "1.5px solid rgba(0,0,0,0.35)",
                cursor: "pointer", padding: 0, display: "block",
              }}
            />
            {openPanel === 'bgColor' && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, display: "flex", flexDirection: "column", background: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 4, padding: 5, zIndex: 10000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
                  {DRAW_COLORS.map(c => (
                    <button key={c} type="button" onClick={e => { e.stopPropagation(); setFormat(prev => ({ ...prev, bgColor: c })); setOpenPanel(null); refocusText(); }}
                      style={{ width: 20, height: 20, background: c, border: format.bgColor === c ? `2px solid ${LACQUER}` : "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", padding: 0 }} />
                  ))}
                </div>
                <HexColorInput value={format.bgColor === "transparent" ? "#ffffff" : format.bgColor || "#ffffff"} onChange={v => setFormat(prev => ({ ...prev, bgColor: v }))} onDone={() => { setOpenPanel(null); refocusText(); }} />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setFormat(prev => ({ ...prev, bgColor: "transparent" }));
              setOpenPanel(null);
              refocusText();
            }}
            onMouseDown={keepInsideEditor}
            style={{
              fontSize: 9,
              background: "rgba(139,26,26,0.04)",
              color: INK,
              border: "1px solid rgba(116,86,44,0.22)",
              borderRadius: 2,
              padding: "1px 4px",
              cursor: "pointer",
              height: 23,
              fontFamily: CINZEL,
              letterSpacing: 1,
            }}
            title="No background"
          >
            No BG
          </button>

          <button
            type="button"
            onClick={commit}
            onMouseDown={keepInsideEditor}
            style={{
              background: LACQUER,
              color: "#fff",
              border: `1px solid ${LACQUER}`,
              borderRadius: 3,
              padding: "1px 8px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 11,
              height: 23,
              fontFamily: CINZEL,
              letterSpacing: 1,
            }}
            title="Save text"
          >
            Save
          </button>
        </div>

        <textarea
          ref={taRef}
          value={text}
          onChange={e => {
            e.stopPropagation();
            setText(e.target.value);
          }}
          onMouseDown={keepInsideEditor}
          onClick={keepInsideEditor}
          onKeyDown={e => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              onCancel();
            }
          }}
          rows={Math.max(1, lines.length)}
          style={{
            width: editorW,
            height: editorH,
            border: "none",
            outline: "none",
            background:
              format.bgColor === "transparent" || !format.bgColor
                ? "transparent"
                : format.bgColor,
            padding: "2px 4px",
            fontSize: cssFontSize,
            fontFamily: format.fontFamily,
            fontWeight: format.isBold ? "700" : "400",
            fontStyle: format.isItalic ? "italic" : "normal",
            color: format.color,
            resize: "none",
            overflow: "hidden",
            display: "block",
            boxSizing: "border-box",
            lineHeight: `${lineHeight}px`,
            borderRadius: 3,
          }}
 />

        <div onMouseDown={e => startResizeText(e, 'both')} title="Drag to resize text" style={{ position: "absolute", bottom: -4, right: -4, width: 8, height: 8, background: "rgba(139,26,26,0.35)", cursor: "nwse-resize", borderRadius: "50%", border: "1px solid rgba(139,26,26,0.5)", zIndex: 20 }} />
        <div onMouseDown={e => startResizeText(e, 'x')} title="Drag to resize text" style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 7, height: 7, background: "rgba(139,26,26,0.25)", cursor: "ew-resize", borderRadius: "50%", border: "1px solid rgba(139,26,26,0.4)", zIndex: 20 }} />
        <div onMouseDown={e => startResizeText(e, '-x')} title="Drag to resize text" style={{ position: "absolute", left: -4, top: "50%", transform: "translateY(-50%)", width: 7, height: 7, background: "rgba(139,26,26,0.25)", cursor: "ew-resize", borderRadius: "50%", border: "1px solid rgba(139,26,26,0.4)", zIndex: 20 }} />
      </div>
    </>
  );
}