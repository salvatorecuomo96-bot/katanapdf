import { useEffect, useRef } from "react";
import { INK, LACQUER, GOLD, PARCHMENT, FB_SIZES } from "../utils/constant";

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

export default function FloatingBox({
  fb,
  isSel,
  zoom = 1,
  rotation = 0,
  onSelect,
  onStartDrag,
  onStartResize,
  onStartRotate,
  onUpdate,
  onCommit,
  onDelete,
}) {
  const taRef = useRef(null);

  useEffect(() => {
    if (!isSel || !taRef.current) return;

    const el = taRef.current;
    const timer = setTimeout(() => {
      el.focus();
      if (fb.text === "") el.select();
      else el.setSelectionRange(el.value.length, el.value.length);
    }, 30);

    return () => clearTimeout(timer);

  }, [isSel]);  const stopAll = e => {
    e.stopPropagation();
  };

  const closeOrDelete = e => {
    e.preventDefault();
    e.stopPropagation();

    if ((fb.text || "").trim() === "") onDelete();
    else onCommit();
  };

  const angle = (fb.angle || 0) - rotation;

  const text = fb.text || "";
  const lines = text.split(/\r?\n/);
  const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);

  const scaledFont = Math.max(8, fb.fontSize * zoom);
  const lineHeight = scaledFont * 1.28;
  const charWidth = scaledFont * 0.58;

  const editorW = Math.max(
    text ? 50 : 90,
    Math.min(900, longestLine * charWidth + 14)
  );

  const editorH = Math.max(
    lineHeight + 8,
    lines.length * lineHeight + 8
  );

  if (!isSel) {
    return (
      <div
        onClick={e => {
          e.stopPropagation();
          onSelect();
        }}
        style={{
          position: "absolute",
          left: fb.x * zoom,
          top: fb.y * zoom,
          willChange: "transform, left, top",
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          transformOrigin: "center center",
          zIndex: fb.z || 50,
          cursor: "pointer",
          padding: `${2 * zoom}px ${4 * zoom}px`,
          fontSize: fb.fontSize * zoom,
          fontFamily: fb.fontFamily,
          color: fb.color || "#000",
          background: fb.bgColor || "transparent",
          lineHeight: 1.28,
          whiteSpace: "pre-wrap",
          border: "1px dashed transparent",
        }}
      >
        {fb.text || ""}
      </div>
    );
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "absolute",
        left: fb.x * zoom,
        top: fb.y * zoom,
        width: editorW,
        height: editorH,
        zIndex: 1000,
        border: `1px dashed ${GOLD}`,
        borderRadius: 3,
        background:
          fb.bgColor && fb.bgColor !== "transparent"
            ? fb.bgColor
            : "transparent",
        boxShadow: "none",
        boxSizing: "border-box",
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        transformOrigin: "center center",
        overflow: "visible",
      }}
    >
      <div
        onMouseDown={onStartDrag}
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
      >
        <button
          type="button"
          onMouseDown={e => {
            e.preventDefault();
            e.stopPropagation();
            onStartRotate(e);
          }}
          title="Drag to rotate"
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
          }}
        >
          <RotateIcon />
        </button>

        <select
          value={fb.fontFamily}
          onChange={e => onUpdate({ fontFamily: e.target.value })}
          onMouseDown={stopAll}
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
          value={FB_SIZES.includes(fb.fontSize) ? fb.fontSize : 14}
          onChange={e => onUpdate({ fontSize: Number(e.target.value) })}
          onMouseDown={stopAll}
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
          onMouseDown={e => e.stopPropagation()}
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
            value={fb.color || "#000000"}
            onChange={e => onUpdate({ color: e.target.value })}
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
          onMouseDown={e => e.stopPropagation()}
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
              fb.bgColor === "transparent"
                ? "#ffffff"
                : fb.bgColor || "#ffffff"
            }
            onChange={e => onUpdate({ bgColor: e.target.value })}
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
            onUpdate({ bgColor: "transparent" });
          }}
          onMouseDown={e => e.stopPropagation()}
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
          onMouseDown={closeOrDelete}
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
          title="Close"
        >
          X
        </button>
      </div>

      <textarea
        ref={taRef}
        value={fb.text}
        onChange={e => onUpdate({ text: e.target.value })}
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            if (fb.text === "") onDelete();
            else onCommit();
          } else if (e.key === "Tab") {
            e.preventDefault();
            e.stopPropagation();
            onCommit();
          }
        }}
        rows={Math.max(1, lines.length)}
        style={{
          width: editorW,
          height: editorH,
          border: "none",
          outline: "none",
          background:
            fb.bgColor === "transparent" || !fb.bgColor
              ? "transparent"
              : fb.bgColor,
          padding: "2px 4px",
          fontSize: scaledFont,
          fontFamily: fb.fontFamily,
          color: fb.color || "#000",
          resize: "none",
          overflow: "hidden",
          display: "block",
          boxSizing: "border-box",
          lineHeight: `${lineHeight}px`,
          borderRadius: 3,
        }}
      />

      <div
        onMouseDown={onStartResize}
        style={{
          position: "absolute",
          bottom: -6,
          right: -6,
          width: 12,
          height: 12,
          background: INK,
          cursor: "nwse-resize",
          borderRadius: "50%",
          border: "2px solid #fff",
          zIndex: 20,
        }}
      />
    </div>
  );
}