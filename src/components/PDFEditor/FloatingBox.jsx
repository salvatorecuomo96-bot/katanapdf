import { useEffect, useRef, useState } from "react";
import { INK, LACQUER, GOLD, PARCHMENT, FB_SIZES, FONT_FAMILIES, CINZEL, DRAW_COLORS } from "../utils/constant";

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
  const [hovered, setHovered] = useState(false);
  const [openPanel, setOpenPanel] = useState(null); // 'textColor' | 'bgColor' | null
  const draggingRef = useRef(false);

  // Reset hover badge when leaving edit mode so it doesn't linger
  useEffect(() => {
    if (!isSel) setHovered(false);
  }, [isSel]);

  useEffect(() => {
    if (!isSel || !taRef.current) return;

    const el = taRef.current;
    const timer = setTimeout(() => {
      el.focus();
      if (fb.text === "") el.select();
      else el.setSelectionRange(el.value.length, el.value.length);
    }, 30);

    return () => clearTimeout(timer);
  }, [isSel]);

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

  const closeOrDelete = e => {
    e.stopPropagation();
    if ((fb.text || "").trim() === "") onDelete();
    else onCommit();
  };

  const angle = fb.angle || 0;

  const text = fb.text || "";
  const lines = text.split(/\r?\n/);
  const scaledFont = Math.max(8, fb.fontSize * zoom);
  const lineHeight = scaledFont * 1.28;

  let measuredTextW = 0;

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    ctx.font = `${fb.isItalic ? "italic " : ""}${fb.isBold ? "bold " : ""}${scaledFont}px ${fb.fontFamily || "Arial, sans-serif"}`;

    measuredTextW = lines.reduce(
      (max, line) => Math.max(max, ctx.measureText(line || " ").width),
      0
    );
  } else {
    measuredTextW = Math.max(...lines.map(line => line.length)) * scaledFont * 0.6;
  }

  const editorW = Math.max(
    text.trim() ? 70 : 90,
    Math.min(1100, measuredTextW + 18)
  );

  const editorH = Math.max(
    lineHeight + 8,
    lines.length * lineHeight + 8
  );

  if (!isSel) {
    const handleMouseDown = e => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      let dragged = false;

      const onMove = mv => {
        if (Math.hypot(mv.clientX - startX, mv.clientY - startY) > 4) {
          dragged = true;
          draggingRef.current = true;
          window.removeEventListener("mousemove", onMove);
          window.removeEventListener("mouseup", onUp);
          const endDrag = () => { draggingRef.current = false; setHovered(false); window.removeEventListener("mouseup", endDrag); };
          window.addEventListener("mouseup", endDrag);
          onStartDrag({ clientX: startX, clientY: startY, preventDefault: () => {}, stopPropagation: () => {} });
        }
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        if (!dragged) onSelect();
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };

    return (
      <div
        onMouseDown={handleMouseDown}
        onPointerDown={e => e.stopPropagation()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!draggingRef.current) setHovered(false); }}
        style={{
          position: "absolute",
          left: fb.x * zoom,
          top: fb.y * zoom,
          willChange: "transform, left, top",
          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          transformOrigin: "center center",
          zIndex: fb.z || 50,
          cursor: "grab",
          padding: `${2 * zoom}px ${4 * zoom}px`,
          fontSize: fb.fontSize * zoom,
          fontFamily: fb.fontFamily,
          color: fb.color || "#000",
          background: fb.bgColor || "transparent",
          fontWeight: fb.isBold ? "700" : "400",
          fontStyle: fb.isItalic ? "italic" : "normal",
          lineHeight: 1.28,
          whiteSpace: "pre-wrap",
          border: hovered ? `1px dashed ${LACQUER}` : "1px dashed transparent",
        }}
      >
        {hovered && (
          <div style={{
            position: "absolute",
            top: -28,
            left: 0,
            background: "transparent",
            color: LACQUER,
            border: `1px solid ${LACQUER}`,
            borderRadius: 2,
            padding: "3px 8px",
            fontSize: 11,
            fontFamily: CINZEL,
            letterSpacing: 2,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 700,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={LACQUER} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}>
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <line x1="12" y1="2" x2="12" y2="22"/>
            </svg>
            DRAG
          </div>
        )}
        {fb.text || ""}
      </div>
    );
  }

  return (
      <div
      onPointerDown={keepInsideEditor}
      onMouseDown={keepInsideEditor}
      onClick={keepInsideEditor}
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
          onMouseDown={e => { e.stopPropagation(); onStartDrag(e); }}
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
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
        </button>

        <button
          type="button"
          onMouseDown={e => {
            e.stopPropagation();
            onStartRotate(e);
          }}
          title="Hold and drag to rotate"
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "1px solid rgba(116,86,44,0.22)",
            background: "rgba(139,26,26,0.04)",
            color: INK,
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
          onChange={e => {
            e.stopPropagation();
            onUpdate({ fontFamily: e.target.value });
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
          value={FB_SIZES.includes(fb.fontSize) ? fb.fontSize : 14}
          onChange={e => {
            e.stopPropagation();
            onUpdate({ fontSize: Number(e.target.value) });
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
            onUpdate({ isBold: !fb.isBold });
            refocusText();
          }}
          style={{
            minWidth: 23,
            height: 23,
            borderRadius: 2,
            border: fb.isBold ? `1px solid rgba(139,26,26,0.5)` : "1px solid rgba(116,86,44,0.22)",
            background: fb.isBold ? "rgba(139,26,26,0.1)" : "rgba(139,26,26,0.04)",
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
            onUpdate({ isItalic: !fb.isItalic });
            refocusText();
          }}
          style={{
            minWidth: 23,
            height: 23,
            borderRadius: 2,
            border: fb.isItalic ? `1px solid rgba(139,26,26,0.5)` : "1px solid rgba(116,86,44,0.22)",
            background: fb.isItalic ? "rgba(139,26,26,0.1)" : "rgba(139,26,26,0.04)",
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
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          <button
            type="button"
            title="Text colour"
            onClick={e => { e.stopPropagation(); setOpenPanel(o => o === 'textColor' ? null : 'textColor'); }}
            style={{ width: 18, height: 18, borderRadius: "50%", background: fb.color || "#000000", border: "1.5px solid rgba(0,0,0,0.35)", cursor: "pointer", padding: 0, display: "block" }}
          />
          {openPanel === 'textColor' && (
            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, background: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 4, padding: 5, zIndex: 10000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              {DRAW_COLORS.map(c => (
                <button key={c} type="button" onClick={e => { e.stopPropagation(); onUpdate({ color: c }); setOpenPanel(null); refocusText(); }}
                  style={{ width: 20, height: 20, background: c, border: (fb.color || "#000000") === c ? `2px solid ${LACQUER}` : "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", padding: 0 }} />
              ))}
              <label title="Custom" style={{ width: 20, height: 20, border: "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", position: "relative", overflow: "hidden" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={LACQUER} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <input type="color" value={fb.color || "#000000"}
                  onChange={e => { e.stopPropagation(); onUpdate({ color: e.target.value }); }}
                  onBlur={() => { setOpenPanel(null); refocusText(); }}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
              </label>
            </div>
          )}
        </div>

        {/* Background colour — same grid as text colour */}
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          <button
            type="button"
            title="Background colour"
            onClick={e => { e.stopPropagation(); setOpenPanel(o => o === 'bgColor' ? null : 'bgColor'); }}
            style={{
              width: 18, height: 18, borderRadius: "50%",
              background: fb.bgColor === "transparent" || !fb.bgColor ? "#ffffff" : fb.bgColor,
              border: fb.bgColor === "transparent" || !fb.bgColor ? "1.5px dashed rgba(0,0,0,0.35)" : "1.5px solid rgba(0,0,0,0.35)",
              cursor: "pointer", padding: 0, display: "block",
            }}
          />
          {openPanel === 'bgColor' && (
            <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, background: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 4, padding: 5, zIndex: 10000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              {DRAW_COLORS.map(c => (
                <button key={c} type="button" onClick={e => { e.stopPropagation(); onUpdate({ bgColor: c }); setOpenPanel(null); refocusText(); }}
                  style={{ width: 20, height: 20, background: c, border: fb.bgColor === c ? `2px solid ${LACQUER}` : "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", padding: 0 }} />
              ))}
              <label title="Custom" style={{ width: 20, height: 20, border: "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", position: "relative", overflow: "hidden" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={LACQUER} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <input type="color" value={fb.bgColor === "transparent" ? "#ffffff" : fb.bgColor || "#ffffff"}
                  onChange={e => { e.stopPropagation(); onUpdate({ bgColor: e.target.value }); }}
                  onBlur={() => { setOpenPanel(null); refocusText(); }}
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
              </label>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onUpdate({ bgColor: "transparent" });
            setOpenPanel(null);
            refocusText();
          }}
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
          onClick={closeOrDelete}
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
          title="Close and keep text"
        >
          Save
        </button>
      </div>

      <textarea
        ref={taRef}
        value={fb.text}
        onChange={e => {
          e.stopPropagation();
          onUpdate({ text: e.target.value });
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
          fontWeight: fb.isBold ? "700" : "400",
          fontStyle: fb.isItalic ? "italic" : "normal",
          color: fb.color || "#000",
          resize: "none",
          overflow: "hidden",
          display: "block",
          boxSizing: "border-box",
          lineHeight: `${lineHeight}px`,
          borderRadius: 3,
        }}
      />

      <div onMouseDown={e => { e.stopPropagation(); onStartResize(e, 'both'); }} title="Drag to resize text" style={{ position: "absolute", bottom: -4, right: -4, width: 8, height: 8, background: "rgba(139,26,26,0.35)", cursor: "nwse-resize", borderRadius: "50%", border: "1px solid rgba(139,26,26,0.5)", zIndex: 20 }} />
      <div onMouseDown={e => { e.stopPropagation(); onStartResize(e, 'x'); }} title="Drag to resize text" style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 7, height: 7, background: "rgba(139,26,26,0.25)", cursor: "ew-resize", borderRadius: "50%", border: "1px solid rgba(139,26,26,0.4)", zIndex: 20 }} />
      <div onMouseDown={e => { e.stopPropagation(); onStartResize(e, '-x'); }} title="Drag to resize text" style={{ position: "absolute", left: -4, top: "50%", transform: "translateY(-50%)", width: 7, height: 7, background: "rgba(139,26,26,0.25)", cursor: "ew-resize", borderRadius: "50%", border: "1px solid rgba(139,26,26,0.4)", zIndex: 20 }} />
    </div>
  );
}
