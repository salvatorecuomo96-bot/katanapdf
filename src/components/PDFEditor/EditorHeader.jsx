import { GOLD, INK, CINZEL, hiddenFileInput } from "../utils/constant";

export default function EditorHeader({ tabsList = [], activeTabId, switchTab, closeTab, handleFile }) {
  if (tabsList.length === 0) return null;

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: INK,
        borderBottom: `1px solid rgba(196,150,58,0.3)`,
        display: "flex",
        alignItems: "stretch",
        overflowX: "auto",
        overflowY: "hidden",
        flexShrink: 0,
        height: 36,
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
              fontSize: 10,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: isActive ? GOLD : "rgba(196,150,58,0.4)",
              borderRight: "1px solid rgba(196,150,58,0.12)",
              borderBottom: isActive ? `2px solid ${GOLD}` : "2px solid transparent",
              background: isActive ? "rgba(196,150,58,0.08)" : "transparent",
              whiteSpace: "nowrap",
              flexShrink: 0,
              maxWidth: 240,
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
                width: 14,
                height: 14,
                fontSize: 9,
                fontWeight: 700,
                borderRadius: "50%",
                cursor: "pointer",
                color: isActive ? GOLD : "rgba(196,150,58,0.35)",
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
          width: 36,
          height: "100%",
          cursor: "pointer",
          color: "rgba(196,150,58,0.4)",
          fontSize: 18,
          fontWeight: 300,
          borderRight: "1px solid rgba(196,150,58,0.12)",
          flexShrink: 0,
        }}
      >
        +
        <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleFile} style={hiddenFileInput} />
      </label>
    </div>
  );
}
