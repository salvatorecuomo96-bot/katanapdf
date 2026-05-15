import { CINZEL, FELL } from "../utils/constant";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(0,0,0,0.08)", background: "#ffffff", padding: "28px 32px", textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {[["About", "#about"], ["Privacy Policy", "#privacy"], ["Terms", "#terms"]].map(([label, href]) => (
          <a key={label} href={href}
             style={{ fontFamily: CINZEL, fontSize: 9.5, letterSpacing: 3, textTransform: "uppercase",
                      color: "rgba(17,17,17,0.45)", textDecoration: "none", padding: "0 10px",
                      borderRight: "1px solid rgba(0,0,0,0.12)" }}>
            {label}
          </a>
        ))}
      </div>
      <div style={{ fontFamily: FELL, fontSize: 12, color: "rgba(17,17,17,0.38)" }}>
        &copy; {new Date().getFullYear()} katanapdf — Free PDF editor in your browser.
      </div>
    </footer>
  );
}
