import { CINZEL, FELL, INK, LACQUER } from "../utils/constant";

const GOLD = "rgba(116,86,44,0.25)";

export default function DownloadSupportPrompt({ visible, onClose }) {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 9000,
      background: "#fffdf8",
      border: `1px solid ${GOLD}`,
      borderRadius: 6,
      boxShadow: "0 6px 24px rgba(40,24,8,0.14)",
      padding: "12px 14px 10px",
      width: 260,
      boxSizing: "border-box",
      fontFamily: FELL,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: INK, fontFamily: FELL }}>
          Thank you for using{" "}
          <strong style={{ fontFamily: CINZEL, letterSpacing: 1, fontSize: 11, color: LACQUER }}>KATANAPDF</strong>.
          {" "}If it saved you time, consider supporting with a nigiri.
        </p>
        <button
          onClick={onClose}
          title="Dismiss"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(24,19,13,0.4)", fontSize: 16, lineHeight: 1,
            padding: 0, flexShrink: 0, marginTop: -2,
          }}
        >×</button>
      </div>
      <a
        href="https://ko-fi.com/salvatorecuomo96"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block" }}
        aria-label="Support KATANAPDF on Ko-fi"
      >
        <img
          src="/kofi-nigiri.png"
          alt="Buy me a nigiri on Ko-fi"
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            borderRadius: 4,
            opacity: 0.93,
            transition: "opacity 0.15s, transform 0.15s",
          }}
          onMouseOver={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseOut={e => { e.currentTarget.style.opacity = "0.93"; e.currentTarget.style.transform = ""; }}
        />
      </a>
    </div>
  );
}
