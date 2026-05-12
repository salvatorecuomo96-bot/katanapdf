import { CINZEL, GOLD, INK } from "../utils/constant";

export default function Footer() {
  const linkStyle = { color: GOLD, fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: "0 14px", textDecoration: "none", fontWeight: 500 };
  return (
    <footer style={{ background: INK, padding: "26px 20px", textAlign: "center", borderTop: `1px solid rgba(196,150,58,0.3)` }}>
      <div style={{ height: 0.5, background: "rgba(196,150,58,0.5)", maxWidth: 600, margin: "0 auto 16px" }} />
      <div style={{ marginBottom: 14 }}>
        <a href="#about" style={linkStyle}>About</a>
        <a href="#privacy" style={linkStyle}>Privacy Policy</a>
        <a href="#terms" style={linkStyle}>Terms</a>
      </div>
      <div style={{ color: GOLD, fontFamily: CINZEL, fontSize: 10, letterSpacing: 2, opacity: 0.7 }}>
        (c) {new Date().getFullYear()} katanapdf - Free PDF editor in your browser.
      </div>
    </footer>
  );
}

