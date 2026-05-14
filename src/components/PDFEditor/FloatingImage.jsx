import { useEffect } from "react";

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
        <div onMouseDown={onStartDrag} style={{ position: "absolute", top: -24, left: 0, right: 0, background: "#8B1A1A", padding: "4px 8px", fontSize: 10, color: "#fff", cursor: "grab", display: "flex", alignItems: "center", gap: 6, borderRadius: "4px 4px 0 0" }}>
          <span style={{ fontWeight: 700 }}>{fi.isEraser ? "ERASER" : "DRAG"}</span>
          <span style={{ opacity: 0.6, fontSize: 8, letterSpacing: "1.5px", fontFamily: "'Cinzel', serif", textTransform: "uppercase" }}>· Tab ↵</span>
          <span onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(); }} style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700 }}>X</span>
        </div>
        <div onMouseDown={onStartResize} style={{ position: "absolute", bottom: -8, right: -8, width: 16, height: 16, background: "#8B1A1A", cursor: "nwse-resize", borderRadius: "50%", border: "2px solid #fff" }} />
      </>}
    </div>
  );
}