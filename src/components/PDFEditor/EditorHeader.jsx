import { INK, LACQUER, CINZEL, hiddenFileInput } from "../utils/constant";

const LINE = "rgba(116,86,44,0.18)";

export default function EditorHeader({ tabsList = [], activeTabId, switchTab, closeTab, handleFile }) {
  if (tabsList.length === 0) return null;

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "rgba(255,253,248,0.97)",
        borderBottom: `1px solid ${LINE}`,
        display: "flex",
        alignItems: "stretch",
        overflowX: "auto",
        overflowY: "hidden",
        flexShrink: 0,
        height: 38,
        scrollbarWidth: "none",
      }}
    >
      {tabsList.map(t => {
        const isActive = t.id === activeTabId;
        return (
          <div
            key={t.id}
            onClick={() => switchTab(t.id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 10px 0 14px",
              cursor: "pointer",
              userSelect: "none",
              fontFamily: CINZEL,
              fontSize: 11.5,
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              color: isActive ? LACQUER : "rgba(24,19,13,0.38)",
              borderRight: `1px solid ${LINE}`,
              borderBottom: isActive ? `2px solid ${LACQUER}` : "2px solid transparent",
              background: isActive ? "rgba(139,26,26,0.04)" : "transparent",
              whiteSpace: "nowrap",
              flexShrink: 0,
              maxWidth: 240,
              fontWeight: isActive ? 700 : 500,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.fileName.replace(/\.pdf$/i, "")}
            </span>
            <span
              onClick={e => { e.stopPropagation(); closeTab(t.id); }}
              title="Close"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 16,
                height: 16,
                fontSize: 10,
                fontWeight: 700,
                borderRadius: "50%",
                cursor: "pointer",
                color: isActive ? LACQUER : "rgba(24,19,13,0.3)",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ✕
            </span>
          </div>
        );
      })}

      <label
        title="Open another PDF or Image"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 34,
          height: "100%",
          cursor: "pointer",
          color: "rgba(139,26,26,0.5)",
          fontSize: 18,
          fontWeight: 300,
          borderRight: `1px solid ${LINE}`,
          flexShrink: 0,
        }}
      >
        +
        <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleFile} style={hiddenFileInput} />
      </label>
    </div>
  );
}
