import { CINZEL, LACQUER, INK, hiddenFileInput } from "../utils/constant";

const LINE  = "rgba(116,86,44,0.18)";
const MUTED = "rgba(24,19,13,0.45)";

const btn = {
  display: "inline-flex", alignItems: "center", gap: 5,
  padding: "5px 14px",
  border: `1px solid rgba(139,26,26,0.38)`,
  fontSize: 12, background: "transparent", color: LACQUER,
  cursor: "pointer", userSelect: "none",
  fontFamily: CINZEL, letterSpacing: 2, textTransform: "uppercase",
  fontWeight: 700, borderRadius: 2,
};

const iconBtn = {
  width: 28, height: 28,
  border: `1px solid ${LINE}`,
  background: "transparent", color: INK,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  padding: 0, borderRadius: 2,
};

export default function EditorToolbar({
  goHome,
  handleFile,
  handleAppendFile,
  handleDownload,
  handleDownloadImages,
  openSplitModal,
  drawMode, setDrawMode,
  sidebarOpen, toggleSidebar,
}) {
  return (
    <div
      data-edit-toolbar
      className="editor-top-toolbar"
      onClick={e => e.stopPropagation()}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "0 16px", height: 52,
        background: "rgba(255,253,248,0.97)",
        borderBottom: `1px solid ${LINE}`,
        flexWrap: "nowrap",
      }}
    >
      <button
        onClick={toggleSidebar}
        className="editor-top-icon"
        title={sidebarOpen ? "Hide pages panel" : "Show pages panel"}
        style={{ ...iconBtn, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <a
        href="#home"
        onClick={e => { e.preventDefault(); goHome(); window.location.hash = "#home"; }}
        style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
      >
        <span className="editor-top-logo" style={{ fontFamily: CINZEL, fontSize: 15, letterSpacing: 3, fontWeight: 800, textTransform: "uppercase", userSelect: "none", color: INK }}>
          katana<span style={{ color: LACQUER }}>pdf</span>
        </span>
      </a>

      <div style={{ width: 1, height: 22, background: LINE, margin: "0 4px", flexShrink: 0 }} />

      <label className="editor-top-action" style={btn}>
        Open PDF/Image
        <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleFile} style={hiddenFileInput} />
      </label>

      <label className="editor-top-action" style={btn} title="Add a PDF or Image at the end">
        Merge PDF
        <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleAppendFile} style={hiddenFileInput} />
      </label>

      <button onClick={openSplitModal} className="editor-top-action" title="Split PDF into parts or extract pages" style={btn}>
        Split PDF
      </button>

      {drawMode && (
        <>
          <div style={{ width: 1, height: 22, background: LINE, margin: "0 4px", flexShrink: 0 }} />
          <span style={{ fontFamily: CINZEL, fontSize: 10, color: LACQUER, letterSpacing: 3, fontWeight: 700 }}>
            ✎ Drawing
          </span>
          <button
            onClick={() => setDrawMode(false)}
            style={{ ...btn, fontSize: 10, padding: "4px 10px" }}
            title="Exit draw mode"
          >
            ✕ Stop
          </button>
        </>
      )}

<div className="editor-toolbar-spacer" />
      <button
        onClick={handleDownloadImages}
        className="editor-top-action editor-top-secondary"
        style={{
          ...btn,
          color: MUTED,
          borderColor: LINE,
        }}
      >
        Save as PNG
      </button>

      <button
        onClick={handleDownload}
        className="editor-top-download"
        style={{
          display: "inline-flex", alignItems: "center",
          padding: "7px 20px",
          background: LACQUER, color: "#fff",
          border: "none", borderRadius: 3,
          cursor: "pointer", fontFamily: CINZEL,
          fontSize: 13, letterSpacing: 2,
          textTransform: "uppercase", fontWeight: 800,
          boxShadow: "0 4px 14px rgba(139,26,26,0.22)",
        }}
      >
        Download PDF
      </button>
    </div>
  );
}
