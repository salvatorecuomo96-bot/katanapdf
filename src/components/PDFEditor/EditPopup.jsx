import { useEffect, useRef, useState } from "react";
import { INK, LACQUER, GOLD, PARCHMENT, FB_SIZES, FONT_FAMILIES, SCALE, CINZEL } from "../utils/constant";

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
  const [format, setFormat] = useState({
    fontFamily: block.fontFamily || "Arial, sans-serif",
    fontSize: Math.round((block.fontSize || 14) / SCALE),
    color: block.color || "#000000",
    isBold: block.isBold || false,
    isItalic: block.isItalic || false,
    bgColor: block.bgColor || "#ffffff",
    angle: block.angle || 0,
  });

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
      el.select();
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

  const startResizeText = e => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startFontSize = format.fontSize;

    const move = moveEvent => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      const delta = (dx + dy) / 2;

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

  const editorW = Math.max(
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
            background: LACQUER,
            padding: "2px 4px",
            cursor: "default",
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 3,
            userSelect: "none",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
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
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
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
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
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
            value={FB_SIZES.includes(format.fontSize) ? format.fontSize : 14}
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
            {FB_SIZES.map(s => (
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
              border: "1px solid rgba(255,255,255,0.2)",
              background: format.isBold ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
              color: "#fff",
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
              border: "1px solid rgba(255,255,255,0.2)",
              background: format.isItalic ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.08)",
              color: "#fff",
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

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setFormat(prev => ({ ...prev, bgColor: "#fff59d" }));
              refocusText();
            }}
            onMouseDown={keepInsideEditor}
            style={{
              minWidth: 26,
              height: 23,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.2)",
              background: format.bgColor === "#fff59d" ? "#fff59d" : "rgba(255,255,255,0.08)",
              color: format.bgColor === "#fff59d" ? INK : "#fff",
              fontWeight: "bold",
              fontSize: 10,
              cursor: "pointer",
              padding: "1px 5px",
            }}
            title="Highlight"
          >
            HL
          </button>

          <div
            title="Text colour"
            onPointerDown={keepInsideEditor}
            onMouseDown={keepInsideEditor}
            onClick={keepInsideEditor}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px solid #ddd",
              position: "relative",
              flex: "0 0 auto",
            }}
          >
            <input
              type="color"
              value={format.color}
              onChange={e => {
                setFormat(prev => ({ ...prev, color: e.target.value }));
                refocusText();
              }}
              style={{
                position: "absolute",
                top: -10,
                left: -10,
                width: 40,
                height: 40,
                cursor: "pointer",
                border: "none",
              }}
            />
          </div>

          <div
            title="Background colour"
            onPointerDown={keepInsideEditor}
            onMouseDown={keepInsideEditor}
            onClick={keepInsideEditor}
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              overflow: "hidden",
              border: "1px dashed #aaa",
              position: "relative",
              flex: "0 0 auto",
            }}
          >
            <input
              type="color"
              value={
                format.bgColor === "transparent"
                  ? "#ffffff"
                  : format.bgColor || "#ffffff"
              }
              onChange={e => {
                setFormat(prev => ({ ...prev, bgColor: e.target.value }));
                refocusText();
              }}
              style={{
                position: "absolute",
                top: -10,
                left: -10,
                width: 40,
                height: 40,
                cursor: "pointer",
                border: "none",
              }}
            />
          </div>

          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setFormat(prev => ({ ...prev, bgColor: "transparent" }));
              refocusText();
            }}
            onMouseDown={keepInsideEditor}
            style={{
              fontSize: 9,
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 2,
              padding: "1px 4px",
              cursor: "pointer",
              height: 23,
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
              background: "rgba(255,255,255,0.18)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 3,
              padding: "1px 6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 11,
              height: 23,
            }}
            title="Close and keep text"
          >
            X
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

        <div
          onMouseDown={startResizeText}
          title="Hold and drag to resize text"
          style={{
            position: "absolute",
            bottom: -6,
            right: -6,
            width: 12,
            height: 12,
            background: LACQUER,
            cursor: "nwse-resize",
            borderRadius: "50%",
            border: "2px solid #fff",
            zIndex: 20,
          }}
        />
      </div>
    </>
  );
}