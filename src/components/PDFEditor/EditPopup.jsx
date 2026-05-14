import { useEffect, useRef, useState } from "react";
import { INK, LACQUER, GOLD, PARCHMENT, FB_SIZES, SCALE } from "../utils/constant";

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
}) {
  const [text, setText] = useState(block.text || "");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [format, setFormat] = useState({
    fontFamily: block.fontFamily || "Arial, sans-serif",
    fontSize: Math.round((block.fontSize || 14) / SCALE),
    color: block.color || "#000000",
    bgColor: block.bgColor || "transparent",
    angle: block.angle || 0,
  });

  const dragOrigin = useRef(null);
  const taRef = useRef(null);
  const boxRef = useRef(null);

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

  const cssFontSize = Math.max(8, format.fontSize * SCALE * zoom);
  const lineHeight = cssFontSize * 1.28;
  const lines = (text || "").split(/\r?\n/);

  let measuredTextW = 0;
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = `${cssFontSize}px ${format.fontFamily}`;
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
          onMouseDown={e => {
            e.stopPropagation();

            const interactive = e.target.closest(
              "button, select, input, textarea, option"
            );

            if (interactive) return;

            dragOrigin.current = {
              mx: e.clientX,
              my: e.clientY,
              ox: offset.x,
              oy: offset.y,
            };
            setDragging(true);
          }}
          style={{
            position: "absolute",
            left: 0,
            top: -36,
            height: 30,
            width: "max-content",
            maxWidth: 520,
            background: INK,
            padding: "2px 4px",
            cursor: "grab",
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 3,
            userSelect: "none",
            border: `1px solid ${GOLD}`,
            boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
            boxSizing: "border-box",
          }}
          title="Drag toolbar to move"
        >
          <button
            type="button"
            onMouseDown={startRotate}
            title="Hold and drag to rotate"
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: `1px solid ${GOLD}`,
              background: "transparent",
              color: PARCHMENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "crosshair",
              padding: 0,
              flex: "0 0 auto",
            }}
          >
            <RotateIcon />
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
              width: 78,
              height: 23,
            }}
          >
            <option value="Arial, sans-serif">Arial</option>
            <option value="Times New Roman, serif">Times</option>
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
              background: "transparent",
              color: PARCHMENT,
              border: `1px solid ${GOLD}`,
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
              background: LACQUER,
              color: PARCHMENT,
              border: `1px solid ${GOLD}`,
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
            } else if (e.key === "Tab") {
              e.preventDefault();
              e.stopPropagation();
              commit(e);
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
            color: format.color,
            resize: "none",
            overflow: "hidden",
            display: "block",
            boxSizing: "border-box",
            lineHeight: `${lineHeight}px`,
            borderRadius: 3,
          }}
        />
      </div>
    </>
  );
}