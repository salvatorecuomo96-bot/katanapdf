import { useEffect } from "react";
import { CINZEL } from "../utils/constant";

const CORNERS = [
  { id: 'nw', top: -6, left: -6,   cursor: 'nwse-resize' },
  { id: 'ne', top: -6, right: -6,  cursor: 'nesw-resize' },
  { id: 'sw', bottom: -6, left: -6,  cursor: 'nesw-resize' },
  { id: 'se', bottom: -6, right: -6, cursor: 'nwse-resize' },
];
const MOBILE_CORNERS = [
  { id: 'nw', top: -12, left: -12,   cursor: 'nwse-resize' },
  { id: 'ne', top: -12, right: -12,  cursor: 'nesw-resize' },
  { id: 'sw', bottom: -12, left: -12,  cursor: 'nesw-resize' },
  { id: 'se', bottom: -12, right: -12, cursor: 'nwse-resize' },
];

export default function FloatingImage({ fi, isSel, zoom = 1, onSelect, onStartDrag, onStartResize, onDelete, onDeselect }) {
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 767;
  const corners = isMobile ? MOBILE_CORNERS : CORNERS;
  const handleSize = isMobile ? 24 : 14;

  useEffect(() => {
    if (!isSel) return;
    const handler = (e) => { if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); onDeselect(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSel, onDeselect]);

  return (
    <div
      onClick={e => { if (fi.isDrawStroke) return; e.stopPropagation(); onSelect(); }}
      style={{
        position: "absolute",
        left: fi.x * zoom,
        top: fi.y * zoom,
        width: fi.w * zoom,
        height: fi.h * zoom,
        zIndex: isSel ? 1000 : (fi.z || 50),
        willChange: "transform, left, top",
        border: isSel ? "2px solid #8B1A1A" : "none",
        boxSizing: "border-box",
        boxShadow: isSel ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
        cursor: fi.isDrawStroke ? "default" : (isSel ? "default" : "pointer"),
        pointerEvents: fi.isDrawStroke ? "none" : "auto",
        transform: `rotate(${fi.angle || 0}deg)`,
      }}
    >
      <img
        src={fi.dataUrl}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "fill", pointerEvents: "none", userSelect: "none", opacity: fi.isEraser && isSel ? 0.8 : 1 }}
      />

      {isSel && !fi.isDrawStroke && <>
        {/* Title bar — on mobile, capped to viewport so toolbar stays reachable on huge images */}
        <div
          onMouseDown={e => e.stopPropagation()}
          style={isMobile ? {
            position: "absolute", top: -42, left: 0, right: "auto",
            width: "min(320px, calc(100vw - 32px))",
            maxWidth: "calc(100vw - 32px)",
            overflowX: "auto", overflowY: "visible",
            WebkitOverflowScrolling: "touch",
            background: "#8B1A1A", padding: "6px 8px",
            fontSize: 10, color: "#fff", cursor: "default",
            display: "flex", alignItems: "center", gap: 6,
            borderRadius: "4px 4px 0 0", touchAction: "pan-x",
          } : { position: "absolute", top: -26, left: 0, right: 0, background: "#8B1A1A", padding: "4px 8px", fontSize: 10, color: "#fff", cursor: "default", display: "flex", alignItems: "center", gap: 6, borderRadius: "4px 4px 0 0" }}
        >
          <button
            type="button"
            onMouseDown={e => { e.stopPropagation(); onStartDrag(e); }}
            onTouchStart={e => { e.stopPropagation(); const t = e.touches[0]; onStartDrag({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => {}, stopPropagation: () => {} }); }}
            title="Drag to move"
            style={{ height: isMobile ? 28 : 18, minWidth: isMobile ? 28 : undefined, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2, background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 9, cursor: "grab", padding: "1px 4px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 2, userSelect: "none", flexShrink: 0 }}
          >
            <svg width={isMobile ? 14 : 9} height={isMobile ? 14 : 9} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
              <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
              <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
            </svg>
          </button>
          <span style={{ fontWeight: 700, flexShrink: 0 }}>{fi.isEraser ? "ERASER" : "IMAGE"}</span>
          <span onClick={e => { e.stopPropagation(); onDelete(); }} style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700, minWidth: isMobile ? 28 : undefined, height: isMobile ? 28 : undefined, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>X</span>
        </div>

        {/* Corner resize handles — aspect-ratio locked. Mobile: larger + touch support. */}
        {corners.map(({ id, cursor, ...pos }) => (
          <div
            key={id}
            onMouseDown={e => { e.stopPropagation(); onStartResize(e, id); }}
            onTouchStart={e => {
              e.preventDefault(); e.stopPropagation();
              const t = e.touches[0];
              onStartResize({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => {}, stopPropagation: () => {} }, id);
            }}
            style={{
              position: "absolute",
              ...pos,
              width: handleSize,
              height: handleSize,
              background: "#ff2222",
              cursor,
              borderRadius: "50%",
              border: "2px solid #fff",
              touchAction: "none",
            }}
          />
        ))}
      </>}
    </div>
  );
}
