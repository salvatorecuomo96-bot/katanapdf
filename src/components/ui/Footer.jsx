import { CINZEL, C, LACQUER } from "../utils/constant";

export default function Footer() {
  const linkStyle = { color: C.footerText, fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: "0 14px", textDecoration: "none", fontWeight: 500 };
  return (
    <footer style={{ background: C.footerBg, padding: "26px 20px", textAlign: "center" }}>
      <div style={{ height: 1, background: LACQUER, opacity: 0.25, maxWidth: 600, margin: "0 auto 20px" }} />
      <div style={{ marginBottom: 14 }}>
        <a href="#about" style={linkStyle}>About</a>
        <a href="#privacy" style={linkStyle}>Privacy Policy</a>
        <a href="#terms" style={linkStyle}>Terms</a>
      </div>
      <div style={{ color: C.footerText, fontFamily: CINZEL, fontSize: 10, letterSpacing: 2, opacity: 0.6 }}>
        &copy; {new Date().getFullYear()} katanapdf — Free PDF editor in your browser.
      </div>
    </footer>
  );
}
