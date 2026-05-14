import { CINZEL, PARCHMENT, INK, GOLD, LACQUER, tbIconBtn, tbBtn, hiddenFileInput } from "../utils/constant";

export default function EditorToolbar({
  goHome,
  handleFile,
  handleAppendFile,
  undo,
  historyLength,
  handleDownload,
  drawMode, setDrawMode,
  sidebarOpen, toggleSidebar,
}) {
  return (
    <div data-edit-toolbar style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 52, background: INK, borderBottom: `1px solid ${GOLD}`, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
      <button onClick={toggleSidebar} title={sidebarOpen ? "Hide pages panel" : "Show pages panel"} style={{ ...tbIconBtn, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <a href="#home" onClick={(e) => { e.preventDefault(); goHome(); window.location.hash = "#home"; }} style={{ textDecoration: "none" }}>
        <span style={{ fontFamily: CINZEL, fontSize: 14, color: PARCHMENT, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>katanapdf</span>
      </a>
      <div style={{ width: 1, height: 24, background: "rgba(196,150,58,0.4)", margin: "0 4px" }} />
      <label style={tbBtn}>Open PDF/Image <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleFile} style={hiddenFileInput} /></label>
      <label style={tbBtn} title="Add a PDF or Image at the end">Merge PDF <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleAppendFile} style={hiddenFileInput} /></label>
      <button onClick={undo} disabled={!historyLength} style={{ ...tbBtn, opacity: historyLength ? 1 : 0.3 }}>&#8630; UNDO</button>
      {drawMode && (
        <>
          <div style={{ width: 1, height: 24, background: "rgba(196,150,58,0.4)", margin: "0 4px" }} />
          <span style={{ fontFamily: CINZEL, fontSize: 10, color: GOLD, letterSpacing: 3, fontWeight: 700, opacity: 0.9 }}>&#9998; DRAWING</span>
          <button onClick={() => setDrawMode(false)} style={{ ...tbBtn, fontSize: 10, padding: "4px 10px" }} title="Exit draw mode">&#10005; STOP</button>
        </>
      )}
      <div style={{ flex: 1 }} />
      <button onClick={handleDownload} style={{ padding: "8px 20px", background: LACQUER, color: PARCHMENT, border: `1px solid ${GOLD}`, cursor: "pointer", fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, outline: `1px solid ${LACQUER}`, outlineOffset: 2 }}>Download PDF</button>
    </div>
  );
}
