import { CINZEL, FELL, INK, LACQUER } from "../utils/constant";

const GOLD = "rgba(116,86,44,0.25)";

const css = `
.kofi-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
  width: fit-content;
  text-decoration: none;
}
.kofi-img {
  display: block;
  width: 170px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 4px;
  transition: transform 0.18s ease, opacity 0.18s ease;
  opacity: 0.93;
}
.kofi-link:hover .kofi-img {
  transform: translateY(-1px);
  opacity: 1;
}
@media (max-width: 640px) {
  .kofi-img { width: 145px; }
}
`;

export default function DownloadSupportPrompt({ visible, onClose }) {
  if (!visible) return null;

  return (
    <>
      <style>{css}</style>
      <div style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9000,
        background: "#fffdf8",
        border: `1px solid ${GOLD}`,
        borderRadius: 6,
        boxShadow: "0 6px 24px rgba(40,24,8,0.14)",
        padding: "14px 16px 12px",
        maxWidth: 300,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: FELL,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: INK, fontFamily: FELL }}>
            Thank you for using{" "}
            <strong style={{ fontFamily: CINZEL, letterSpacing: 1, fontSize: 11, color: LACQUER }}>KATANAPDF</strong>.
            {" "}If it saved you time, consider supporting the project with a nigiri.
          </p>
          <button
            onClick={onClose}
            title="Dismiss"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(24,19,13,0.4)", fontSize: 16, lineHeight: 1,
              padding: "0 2px", flexShrink: 0, marginTop: -2,
            }}
          >×</button>
        </div>
        <a
          href="https://ko-fi.com/salvatorecuomo96"
          target="_blank"
          rel="noopener noreferrer"
          className="kofi-link"
          aria-label="Support KATANAPDF on Ko-fi"
        >
          <img
            src="/kofi-nigiri.png"
            alt="Buy me a nigiri on Ko-fi"
            className="kofi-img"
          />
        </a>
      </div>
    </>
  );
}
