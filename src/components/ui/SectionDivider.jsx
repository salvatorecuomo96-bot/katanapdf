import { CINZEL, GOLD, LACQUER } from "../utils/constant";

export default function SectionDivider({ label }) {
  // letter-spacing leaves a trailing gap to the right of the last character, which
  // shifts the visible text left of the geometric centre. Match it with paddingLeft
  // so the label looks visually centred between the gold rules.
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "36px auto 18px", maxWidth: 1600, padding: "0 20px" }}>
      <div style={{ flex: 1, height: 1, background: GOLD }} />
      <span style={{ fontFamily: CINZEL, fontSize: 13, letterSpacing: 4, paddingLeft: 4, textTransform: "uppercase", color: LACQUER, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: GOLD }} />
    </div>
  );
}

