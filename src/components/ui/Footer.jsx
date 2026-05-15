import { CINZEL, FELL } from "../utils/constant";

const LINE = "rgba(116,86,44,0.18)";
const LACQUER_F = "#8B1A1A";
const INK_F = "#18130d";

export default function Footer() {
  return (
    <footer style={{
      borderTop: `1px solid ${LINE}`,
      background: "rgba(255,253,248,0.97)",
      padding: "14px 32px",
      textAlign: "center",
    }}>
      <div style={{ fontFamily: FELL, fontSize: 12, color: `rgba(24,19,13,0.42)` }}>
        &copy; {new Date().getFullYear()} katanapdf — Free PDF editor in your browser.
      </div>
    </footer>
  );
}
