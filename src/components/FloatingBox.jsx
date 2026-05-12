import { useRef, useEffect } from "react";

const FB_SIZES = [6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72,80,96,120];

export default function FloatingBox({ fb, isSel, zoom = 1, onSelect, onStartDrag, onStartResize, onStartRotate, onUpdate, onDelete, onCommit }) {
  const stopAll = e => e.stopPropagation();
  const taRef = useRef(null);

  useEffect(() => {
    if (isSel && taRef.current) {
      taRef.current.focus();
      if (fb.text === "New text") taRef.current.select();
    }
  }, [isSel, fb.text]);

  const handleKeyDown = (e) => {
    if (e.key === "Tab" || e.key === "Escape") { e.preventDefault(); onCommit(); }
  };

  if (!isSel) {
    return (
      <div onClick={e => { e.stopPropagation(); onSelect(); }}
        style={{
          position: "absolute", left: fb.x * zoom, top: fb.y * zoom,
          transform: `rotate(${fb.angle || 0}deg)`, transformOrigin: "center center",
          minWidth: 20 * zoom, zIndex: fb.z || 50, cursor: "pointer",
          padding: `${2 * zoom}px ${4 * zoom}px`,
          fontSize: fb.fontSize * zoom, fontFamily: fb.fontFamily,
          fontWeight: fb.isBold ? "bold" : "normal", fontStyle: fb.isItalic ? "italic" : "normal",
          color: fb.color || "#000", lineHeight: 1.5, whiteSpace: "pre-wrap", background: "transparent",
        }}>
        {fb.text || " "}
      </div>
    );
  }

  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: "absolute", left: fb.x * zoom, top: fb.y * zoom, minWidth: 140,
      zIndex: 1000, border: "2px solid #8B1A1A",
      transform: `rotate(${fb.angle || 0}deg)`, transformOrigin: "center center",
      borderRadius: 4, background: "transparent", boxShadow: "0 4px 20px rgba(0,0,0,0.25)", boxSizing: "border-box",
    }}>
      {/* Lollipop Rotate Handle */}
      <div onMouseDown={onStartRotate} style={{ position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)", width: 12, height: 12, background: "#8B1A1A", cursor: "grab", borderRadius: "50%", border: "2px solid #fff" }} />
      <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", width: 2, height: 10, background: "#8B1A1A" }} />
      
      <div onMouseDown={onStartDrag} style={{
        background: "#8B1A1A", padding: "4px 6px", fontSize: 11, color: "#fff",
        cursor: "grab", display: "flex", alignItems: "center", gap: 5,
        userSelect: "none", borderRadius: "2px 2px 0 0", flexWrap: "nowrap",
      }}>
        <span style={{ fontWeight: 700, marginRight: 2, cursor: "grab" }}>✥</span>
        <select value={FB_SIZES.includes(fb.fontSize) ? fb.fontSize : 14} onChange={e => onUpdate({ fontSize: +e.target.value })} onMouseDown={stopAll} onClick={stopAll} style={{ fontSize: 11, background: "#5a0f0f", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", width: 46 }}>
          {FB_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span onMouseDown={stopAll} onClick={e => { stopAll(e); onUpdate({ isBold: !fb.isBold }); }} style={{ cursor: "pointer", fontWeight: 900, opacity: fb.isBold ? 1 : 0.4 }}>B</span>
        <span onMouseDown={stopAll} onClick={e => { stopAll(e); onUpdate({ isItalic: !fb.isItalic }); }} style={{ cursor: "pointer", fontStyle: "italic", opacity: fb.isItalic ? 1 : 0.4 }}>I</span>
        <input type="color" value={fb.color || "#000000"} onChange={e => onUpdate({ color: e.target.value })} onMouseDown={stopAll} style={{ width: 16, height: 16, border: "none", padding: 0, background: "none", cursor: "pointer", flexShrink: 0 }} />
        <span onMouseDown={stopAll} onClick={e => { stopAll(e); onDelete(); }} style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700 }}>✕</span>
      </div>
      <textarea ref={taRef} value={fb.text} onChange={e => onUpdate({ text: e.target.value })} onMouseDown={stopAll} onClick={stopAll} onKeyDown={handleKeyDown} rows={2} style={{
        display: "block", width: "100%", minWidth: 120, border: "none", outline: "none", resize: "none", background: "transparent",
        padding: "5px 8px", fontSize: fb.fontSize * zoom, fontFamily: fb.fontFamily,
        fontWeight: fb.isBold ? "bold" : "normal", fontStyle: fb.isItalic ? "italic" : "normal",
        color: fb.color || "#000", lineHeight: 1.5, cursor: "text", boxSizing: "border-box",
      }} />
      <div style={{ fontSize: 10, color: "#666", padding: "2px 8px 4px", fontFamily: "sans-serif", borderTop: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.85)", borderRadius: "0 0 2px 2px" }}>
        Tab to save · drag corner to resize · drag top circle to rotate
      </div>
      <div onMouseDown={onStartResize} style={{ position: "absolute", bottom: -8, right: -8, width: 16, height: 16, background: "#8B1A1A", cursor: "nwse-resize", borderRadius: "50%", border: "2px solid #fff" }} />
    </div>
  );
}