import { useState, useEffect, useRef } from "react";
import { LACQUER, GOLD, PARCHMENT, FB_SIZES, SCALE } from "../utils/constant";

export default function EditPopup({ block, zoom, rotation = 0, onCommit, onCancel }) {
  const [text, setText] = useState(block.text || "");
  const [offset, setOffset] = useState({ x: 0, y: 0 }); 
  const [dragging, setDragging] = useState(false);
  const [format, setFormat] = useState({
    fontFamily: block.fontFamily || "Arial, sans-serif",
    fontSize: Math.round((block.fontSize || 14) / SCALE), 
    color: block.color || "#000000",
    bgColor: block.bgColor || "transparent"
  });
  
  const dragOrigin = useRef(null);
  const taRef = useRef(null);

  useEffect(() => { if (taRef.current) { taRef.current.focus(); taRef.current.select(); } }, []);

  useEffect(() => {
    const move = (e) => { 
      if (!dragging || !dragOrigin.current) return; 
      const dx = e.clientX - dragOrigin.current.mx;
      const dy = e.clientY - dragOrigin.current.my;
      
      const rad = -(rotation || 0) * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const localDx = dx * cos - dy * sin;
      const localDy = dx * sin + dy * cos;
      
      setOffset({ x: dragOrigin.current.ox + localDx / zoom, y: dragOrigin.current.oy + localDy / zoom }); 
    };
    const up = () => setDragging(false);
    if (dragging) { window.addEventListener("mousemove", move); window.addEventListener("mouseup", up); }
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging, rotation, zoom]);

  const cssFontSize = (format.fontSize * SCALE) * zoom;
  const boxW = Math.max(block.width * zoom + 20, 260);

  return (
    <>
      {dragging && <div style={{ position: "fixed", inset: 0, zIndex: 9999, cursor: "grabbing" }} />}
      <div onClick={e => e.stopPropagation()} style={{ position: "absolute", left: offset.x * zoom, top: offset.y * zoom, zIndex: 2000, border: `1px solid ${GOLD}`, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", width: boxW, borderRadius: 4, boxSizing: "border-box" }}>
        <div onMouseDown={(e) => { e.preventDefault(); dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }; setDragging(true); }} style={{ background: "#222", padding: "6px 8px", cursor: "grab", display: "flex", alignItems: "center", gap: 8, borderRadius: "3px 3px 0 0", userSelect: "none" }} title="Drag to move">
          <select value={format.fontFamily} onChange={e => setFormat({...format, fontFamily: e.target.value})} onMouseDown={e=>e.stopPropagation()} style={{ fontSize: 11, background: "#fff", border: "none", borderRadius: 2, padding: "2px", width: 70 }}>
            <option value="Arial, sans-serif">Arial</option><option value="Times New Roman, serif">Times</option>
          </select>
          <select value={FB_SIZES.includes(format.fontSize) ? format.fontSize : 14} onChange={e => setFormat({...format, fontSize: Number(e.target.value)})} onMouseDown={e=>e.stopPropagation()} style={{ fontSize: 11, background: "#fff", border: "none", borderRadius: 2, padding: "2px", width: 45 }}>
            {FB_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div title="Text Color" style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", border: "1px solid #ddd", position: "relative" }}><input type="color" value={format.color} onChange={e => setFormat({...format, color: e.target.value})} onMouseDown={e=>e.stopPropagation()} style={{ position: "absolute", top: -10, left: -10, width: 40, height: 40, cursor: "pointer", border: "none" }} /></div>
          <div title="Background Color" style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", border: "1px dashed #aaa", position: "relative" }}><input type="color" value={format.bgColor === "transparent" ? "#ffffff" : format.bgColor} onChange={e => setFormat({...format, bgColor: e.target.value})} onMouseDown={e=>e.stopPropagation()} style={{ position: "absolute", top: -10, left: -10, width: 40, height: 40, cursor: "pointer", border: "none" }} /></div>
          <button onClick={async () => { if ("EyeDropper" in window) { try { const result = await new window.EyeDropper().open(); setFormat({...format, bgColor: result.sRGBHex}); } catch (e) {} } }} onMouseDown={e=>e.stopPropagation()} style={{ fontSize: 9, background: "none", color: "#ddd", border: "1px solid #555", borderRadius: 2, padding: "2px 4px", cursor: "pointer", display: "EyeDropper" in window ? "inline-block" : "none" }} title="Pick background color">Pick BG</button>
          <button onClick={() => setFormat({...format, bgColor: "transparent"})} onMouseDown={e=>e.stopPropagation()} style={{ fontSize: 9, background: "none", color: "#ddd", border: "1px solid #555", borderRadius: 2, padding: "2px 4px", cursor: "pointer" }} title="No background">No BG</button>
          <button onClick={() => onCommit(text, offset.x, offset.y, format)} onMouseDown={e=>e.stopPropagation()} style={{ marginLeft: "auto", background: LACQUER, color: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 3, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>Save</button>
        </div>
        <textarea ref={taRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onCancel(); } if (e.key === "Tab") { e.preventDefault(); e.stopPropagation(); onCommit(text, offset.x, offset.y, format); } }} style={{ width: "100%", border: "none", outline: "none", background: format.bgColor === "transparent" ? "transparent" : format.bgColor, padding: "8px", fontSize: cssFontSize, fontFamily: format.fontFamily, color: format.color, resize: "none", overflow: "visible", minHeight: Math.max(block.height * zoom, cssFontSize * 1.5), boxSizing: "border-box", borderRadius: "0 0 3px 3px" }} />
      </div>
    </>
  );
}