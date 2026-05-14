import { useEffect } from "react";
import { INK, GOLD, CINZEL } from "../utils/constant";

export default function FloatingImage({ fi, isSel, zoom = 1, onSelect, onStartDrag, onStartResize, onDelete, onDeselect }) {
  useEffect(() => {
    if (!isSel) return;
    const handler = (e) => { if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); onDeselect(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSel, onDeselect]);

  return (
    <div onClick={e => { if (fi.isDrawStroke) return; e.stopPropagation(); onSelect(); }} style={{ position: "absolute", left: fi.x * zoom, top: fi.y * zoom, width: fi.w * zoom, height: fi.h * zoom, zIndex: isSel ? 1000 : (fi.z || 50), willChange: "transform, left, top", border: isSel ? "2px solid #8B1A1A" : "none", boxSizing: "border-box", boxShadow: isSel ? "0 4px 20px rgba(0,0,0,0.3)" : "none", cursor: fi.isDrawStroke ? "default" : (isSel ? "default" : "pointer"), pointerEvents: fi.isDrawStroke ? "none" : "auto", transform: `rotate(${fi.angle || 0}deg)` }}>
      <img src={fi.dataUrl} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block", objectFit: "fill", pointerEvents: "none", userSelect: "none", opacity: fi.isEraser && isSel ? 0.8 : 1 }} />
      {isSel && !fi.isDrawStroke && <>
        <div onMouseDown={e => e.stopPropagation()} style={{ position: "absolute", top: -26, left: 0, right: 0, background: "#8B1A1A", padding: "4px 8px", fontSize: 10, color: "#fff", cursor: "default", display: "flex", alignItems: "center", gap: 6, borderRadius: "4px 4px 0 0" }}>
          <button type="button" onMouseDown={e => { e.stopPropagation(); onStartDrag(e); }} title="Drag to move" style={{ height: 18, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 2, background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 9, cursor: "grab", padding: "1px 4px", display: "inline-flex", alignItems: "center", gap: 2, userSelect: "none", flexShrink: 0 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:"block"}}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
          </button>
          <span style={{ fontWeight: 700 }}>{fi.isEraser ? "ERASER" : "IMAGE"}</span>
          <span onClick={e => { e.stopPropagation(); onDelete(); }} style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700 }}>X</span>
        </div>
        <div onMouseDown={onStartResize} style={{ position: "absolute", bottom: -8, right: -8, width: 16, height: 16, background: "#8B1A1A", cursor: "nwse-resize", borderRadius: "50%", border: "2px solid #fff" }} />
      </>}
    </div>
  );
}