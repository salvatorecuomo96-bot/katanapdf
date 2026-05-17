import { useState, useEffect } from "react";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export default function HexColorInput({ value, onChange, onDone, swatchSize = 22 }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = (hex) => { if (HEX_RE.test(hex)) onChange(hex); };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
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
    </div>
  );
}
