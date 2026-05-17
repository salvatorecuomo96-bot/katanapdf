import { useState, useEffect } from "react";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const EyedropperIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41-6.6 6.6A2 2 0 0 0 5 16v3h3a2 2 0 0 0 1.42-.59l6.6-6.6 1.41 1.42 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 0 0 0-1.65z"/>
  </svg>
);

export default function HexColorInput({ value, onChange, onDone, swatchSize = 22 }) {
  const [draft, setDraft] = useState(value);
  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

  useEffect(() => { setDraft(value); }, [value]);

  const commit = (hex) => { if (HEX_RE.test(hex)) onChange(hex); };

  const pickFromScreen = async () => {
    try {
      const result = await new window.EyeDropper().open();
      onChange(result.sRGBHex);
      setDraft(result.sRGBHex);
    } catch { /* cancelled */ }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
      <label style={{ width: swatchSize, height: swatchSize, borderRadius: 3, border: "1px solid rgba(0,0,0,0.25)", background: HEX_RE.test(value) ? value : "#ffffff", cursor: "pointer", position: "relative", flexShrink: 0 }}>
        <input
          type="color"
          value={HEX_RE.test(value) ? value : "#ffffff"}
          onChange={e => { onChange(e.target.value); setDraft(e.target.value); }}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }}
        />
      </label>
      <input
        type="text"
        value={draft}
        onChange={e => { setDraft(e.target.value); commit(e.target.value); }}
        onBlur={() => { if (!HEX_RE.test(draft)) setDraft(value); }}
        onKeyDown={e => { if (e.key === "Enter") { commit(draft); if (onDone) onDone(); } }}
        style={{ width: 72, fontSize: 11, fontFamily: "monospace", border: "1px solid rgba(0,0,0,0.2)", borderRadius: 3, padding: "2px 5px", height: 22, boxSizing: "border-box", outline: "none", letterSpacing: 1 }}
        spellCheck={false}
        maxLength={7}
        placeholder="#000000"
      />
      {hasEyeDropper && (
        <button
          type="button"
          title="Pick colour from screen"
          onClick={pickFromScreen}
          style={{ width: 22, height: 22, border: "1px solid rgba(0,0,0,0.2)", borderRadius: 3, background: "rgba(255,255,255,0.8)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, flexShrink: 0, color: "#555" }}
        >
          <EyedropperIcon />
        </button>
      )}
    </div>
  );
}
