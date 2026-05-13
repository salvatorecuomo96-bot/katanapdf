import { CINZEL, PARCHMENT, INK, GOLD, LACQUER, tbSelect, tbIconBtn, tbBtn, hiddenFileInput } from "../utils/constant";

export default function EditorToolbar({
  goHome,
  fontFamily, setFontFamily,
  fontSize, setFontSize,
  isBold, setIsBold,
  isItalic, setIsItalic,
  setIsSignModalOpen,
  handleFile,
  handleAppendFile,
  undo,
  historyLength,
  zoom, setZoom,
  handleDownload
}) {
  return (
    <div data-edit-toolbar style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 52, background: INK, borderBottom: `1px solid ${GOLD}`, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
      <a href="#home" onClick={(e) => { e.preventDefault(); goHome(); window.location.hash = "#home"; }} style={{ textDecoration: "none" }}>
        <span style={{ fontFamily: CINZEL, fontSize: 14, color: PARCHMENT, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>katanapdf</span>
      </a>
      <div style={{ width: 1, height: 24, background: "rgba(196,150,58,0.4)", margin: "0 4px" }} />
      <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={tbSelect}>
        <option value="Arial, sans-serif">Arial</option>
        <option value="Times New Roman, serif">Times New Roman</option>
        <option value="Courier New, monospace">Courier</option>
        <option value="Georgia, serif">Georgia</option>
      </select>
      <select value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} style={{ ...tbSelect, width: 58, textAlign: "center" }}>
        {[6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72,80,96,120].map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <button onClick={() => setIsBold(b => !b)} style={{ ...tbIconBtn, fontWeight: 900, background: isBold ? LACQUER : "transparent", color: isBold ? PARCHMENT : GOLD, borderColor: isBold ? GOLD : "rgba(196,150,58,0.4)" }}>B</button>
      <button onClick={() => setIsItalic(i => !i)} style={{ ...tbIconBtn, fontStyle: "italic", background: isItalic ? LACQUER : "transparent", color: isItalic ? PARCHMENT : GOLD, borderColor: isItalic ? GOLD : "rgba(196,150,58,0.4)" }}>I</button>
      <button onClick={() => setIsSignModalOpen(true)} style={{ ...tbBtn, padding: "5px 12px" }}>SIGN</button>
      <div style={{ width: 1, height: 24, background: "rgba(196,150,58,0.4)", margin: "0 4px" }} />
      <label style={tbBtn}>Open PDF/Image <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleFile} style={hiddenFileInput} /></label>
      <label style={tbBtn} title="Add a PDF or Image at the end">Merge PDF <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleAppendFile} style={hiddenFileInput} /></label>
      <button onClick={undo} disabled={!historyLength} style={{ ...tbBtn, opacity: historyLength ? 1 : 0.3 }}>&#8630; UNDO</button>
      <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))} style={tbIconBtn}>+</button>
      <span style={{ fontSize: 11, color: "#555", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
      <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} style={tbIconBtn}>-</button>
      <div style={{ flex: 1 }} />
      <button onClick={handleDownload} style={{ padding: "8px 20px", background: LACQUER, color: PARCHMENT, border: `1px solid ${GOLD}`, cursor: "pointer", fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, outline: `1px solid ${LACQUER}`, outlineOffset: 2 }}>Download PDF</button>
    </div>
  );
}
