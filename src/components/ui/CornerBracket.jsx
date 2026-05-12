import { GOLD } from "../utils/constant";

export default function CornerBracket() {
  return (
    <div style={{ position: "absolute", top: 8, right: 8, width: 14, height: 14, borderTop: `1px solid ${GOLD}`, borderRight: `1px solid ${GOLD}`, pointerEvents: "none" }} />
  );
}

