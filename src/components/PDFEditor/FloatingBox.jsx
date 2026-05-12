import { useEffect, useRef } from "react";
import { GOLD, FB_SIZES } from "../utils/constant";

const RotateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);

export default function FloatingBox({ fb, isSel, zoom = 1, rotation = 0, onSelect, onStartDrag, onStartResize, onStartRotate, onUpdate, onCommit, onDelete }) {
  const taRef = useRef(null);

  useEffect(() => { 
    if (isSel && taRef.current) { 
      const el = taRef.current;
      const timer = setTimeout(() => {
        el.focus(); 
        if (fb.text === "") el.select();
        else {
          el.setSelectionRange(el.value.length, el.value.length);
        }
      }, 30);
      return () => clearTimeout(timer);
    } 
  }, [isSel]);

  const stopAll = e => e.stopPropagation();
  const angle = (fb.angle || 0) - rotation;

  if (!isSel) {
    return (
      <div onClick={e => { e.stopPropagation(); onSelect(); }}
        style={{ position: "absolute", left: fb.x * zoom, top: fb.y * zoom, willChange: "transform, left, top", transform: `translate(-50%, -50%) rotate(${angle}deg)`, transformOrigin: "center center", minWidth: 20 * zoom, zIndex: fb.z || 50, cursor: "pointer", padding: `${2 * zoom}px ${4 * zoom}px`, fontSize: fb.fontSize * zoom, fontFamily: fb.fontFamily, color: fb.color || "#000", background: fb.bgColor || "transparent", lineHeight: 1.5, whiteSpace: "pre-wrap", border: "1px dashed transparent" }}>
        {fb.text || ""}
      </div>
    );
  }

  return (
    <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: fb.x * zoom, top: fb.y * zoom, minWidth: 180, zIndex: 1000, border: `1px solid ${GOLD}`, borderRadius: 4, background: "#fff", boxShadow: "0 4px 15px rgba(0,0,0,0.2)", boxSizing: "border-box", transform: `translate(-50%, -50%) rotate(${angle}deg)`, transformOrigin: "center center", overflow: "visible" }}>
       <div onMouseDown={onStartRotate} style={{ position: "absolute", top: -14, right: -14, width: 28, height: 28, background: "#222", cursor: "crosshair", borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", zIndex: 20 }} title="Drag to Rotate">
          <RotateIcon />
       </div>

       <div onMouseDown={onStartDrag} style={{ background: "#222", padding: "4px 8px", cursor: "grab", display: "flex", alignItems: "center", gap: 6, borderRadius: "3px 3px 0 0", userSelect: "none" }}>
          <select value={fb.fontFamily} onChange={e => onUpdate({ fontFamily: e.target.value })} onMouseDown={stopAll} style={{ fontSize: 10, background: "#fff", border: "none", borderRadius: 2, padding: "1px 2px", width: 65 }}><option value="Arial, sans-serif">Arial</option><option value="Times New Roman, serif">Times</option></select>
          <select value={FB_SIZES.includes(fb.fontSize) ? fb.fontSize : 14} onChange={e => onUpdate({ fontSize: Number(e.target.value) })} onMouseDown={stopAll} style={{ fontSize: 10, background: "#fff", border: "none", borderRadius: 2, padding: "1px 2px", width: 40 }}>{FB_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select>
          <div title="Text Color" style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", border: "1px solid #ddd", position: "relative" }}><input type="color" value={fb.color || "#000000"} onChange={e => onUpdate({ color: e.target.value })} onMouseDown={stopAll} style={{ position: "absolute", top: -10, left: -10, width: 40, height: 40, cursor: "pointer", border: "none" }} /></div>
          <div title="Background Color" style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", border: "1px dashed #aaa", position: "relative", marginLeft: 4 }}><input type="color" value={fb.bgColor === "transparent" ? "#ffffff" : (fb.bgColor || "#ffffff")} onChange={e => onUpdate({ bgColor: e.target.value })} onMouseDown={stopAll} style={{ position: "absolute", top: -10, left: -10, width: 40, height: 40, cursor: "pointer", border: "none" }} /></div>
          <button onClick={async () => { if ("EyeDropper" in window) { try { const result = await new window.EyeDropper().open(); onUpdate({ bgColor: result.sRGBHex }); } catch (e) {} } }} onMouseDown={stopAll} style={{ fontSize: 9, background: "none", color: "#ddd", border: "1px solid #555", borderRadius: 2, padding: "1px 4px", cursor: "pointer", display: "EyeDropper" in window ? "inline-block" : "none" }} title="Pick background color">Pick BG</button>
          <button onClick={() => onUpdate({ bgColor: "transparent" })} onMouseDown={stopAll} style={{ fontSize: 9, background: "none", color: "#ddd", border: "1px solid #555", borderRadius: 2, padding: "1px 4px", cursor: "pointer" }} title="No background">No BG</button>
          <button onClick={() => onDelete()} onMouseDown={stopAll} style={{ marginLeft: "auto", background: "none", border: "none", color: "#ff4444", cursor: "pointer", fontWeight: "bold", fontSize: 12 }}>X</button>
       </div>

       <textarea ref={taRef} value={fb.text} onChange={e => onUpdate({ text: e.target.value })} onMouseDown={stopAll} onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); if (fb.text === "") onDelete(); else onCommit(); } else if (e.key === "Tab") { e.preventDefault(); e.stopPropagation(); onCommit(); } }} style={{ width: "100%", border: "none", outline: "none", background: fb.bgColor === "transparent" ? "transparent" : fb.bgColor, padding: "8px", fontSize: fb.fontSize * zoom, fontFamily: fb.fontFamily, color: fb.color, resize: "none", minHeight: Math.max(40, fb.fontSize * zoom * 1.2), display: "block", boxSizing: "border-box", borderRadius: "0 0 3px 3px" }} />

       <div onMouseDown={onStartResize} style={{ position: "absolute", bottom: -8, right: -8, width: 16, height: 16, background: "#222", cursor: "nwse-resize", borderRadius: "50%", border: "2px solid #fff", zIndex: 20 }} />
    </div>
  );
}