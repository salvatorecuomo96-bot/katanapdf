import { GOLD, INK, CINZEL, LACQUER, hiddenFileInput } from "../utils/constant";

export default function EditorHeader({
  tabsList,
  activeTabId,
  switchTab,
  closeTab,
  handleFile
}) {
  if (tabsList.length === 0) return null;

  return (
    <div onClick={e => e.stopPropagation()} style={{
      background: "transparent", borderBottom: `1px solid rgba(139,26,26,0.25)`,
      padding: "8px 16px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
    }}>
      {tabsList.map(t => {
        const isActive = t.id === activeTabId;
        return (
          <div key={t.id} onClick={() => switchTab(t.id)} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 10px 5px 14px",
            border: `1px solid ${isActive ? GOLD : "rgba(139,26,26,0.3)"}`,
            background: isActive ? INK : "rgba(255,255,255,0.5)",
            color: isActive ? GOLD : INK,
            fontFamily: CINZEL, fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
            cursor: "pointer", maxWidth: 220,
          }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.fileName.replace(/\.pdf$/i, "")}
            </span>
            <span onClick={e => { e.stopPropagation(); closeTab(t.id); }}
              title="Close" style={{
                cursor: "pointer", padding: "0 4px", fontWeight: 700,
                opacity: 0.7,
              }}>X</span>
          </div>
        );
      })}
      <label style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 30, height: 26,
        border: `1px solid ${LACQUER}`, color: LACQUER, background: "rgba(255,255,255,0.5)",
        fontFamily: CINZEL, fontSize: 16, fontWeight: 600, cursor: "pointer",
      }} title="Open another PDF or Image in a new tab">
        +
        <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleFile} style={hiddenFileInput} />
      </label>
    </div>
  );
}
