import { CINZEL, FELL } from "../utils/constant";

const LINE = "rgba(116,86,44,0.18)";
const LACQUER = "#8B1A1A";
const MUTED = "rgba(24,19,13,0.42)";

const TOOLS = [
  ["Free PDF Editor", "/"],
  ["Edit PDF", "/edit-pdf"],
  ["Merge PDF", "/merge-pdf"],
  ["Split PDF", "/split-pdf"],
  ["Sign PDF", "/sign-pdf"],
  ["Annotate PDF", "/annotate-pdf"],
  ["Image to PDF", "/image-to-pdf"],
  ["Reorder Pages", "/reorder-pdf"],
];

const COMPANY = [
  ["About", "/about"],
  ["FAQs", "/faqs"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

const COL_LABEL = { fontFamily: CINZEL, fontSize: 9, letterSpacing: 3, textTransform: "uppercase", fontWeight: 800, color: LACQUER, marginBottom: 10, display: "block" };
const BASE_LINK = { fontFamily: FELL, fontSize: 13, color: MUTED, textDecoration: "none", display: "block", marginBottom: 6, lineHeight: 1.5 };

export default function Footer({ navigate }) {
  const nav = navigate || ((href) => { window.location.href = href; });

  return (
    <footer style={{ borderTop: `1px solid ${LINE}`, background: "rgba(255,253,248,0.97)", padding: "36px 48px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap", marginBottom: 28 }}>
          <div style={{ minWidth: 160 }}>
            <span style={COL_LABEL}>Tools</span>
            {TOOLS.map(([label, href]) => (
              <a key={href} href={href} onClick={e => { e.preventDefault(); nav(href); }} style={BASE_LINK}
                onMouseEnter={e => e.currentTarget.style.color = LACQUER}
                onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ minWidth: 120 }}>
            <span style={COL_LABEL}>Company</span>
            {COMPANY.map(([label, href]) => (
              <a key={href} href={href} onClick={e => { e.preventDefault(); nav(href); }} style={BASE_LINK}
                onMouseEnter={e => e.currentTarget.style.color = LACQUER}
                onMouseLeave={e => e.currentTarget.style.color = MUTED}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={COL_LABEL}>katanapdf</span>
            <p style={{ fontFamily: FELL, fontSize: 13, color: MUTED, margin: 0, lineHeight: 1.65, maxWidth: 320 }}>
              A free PDF editor that runs entirely in your browser. No upload, no account, no watermark. Your files stay on your device.
            </p>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 16, fontFamily: FELL, fontSize: 12, color: MUTED, textAlign: "center" }}>
          &copy; {new Date().getFullYear()} katanapdf — Free PDF editor in your browser.
        </div>
      </div>
    </footer>
  );
}
