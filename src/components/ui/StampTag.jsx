import { CINZEL, LACQUER } from "../utils/constant";

export default function StampTag({ children }) {
  return (
    <span style={{
      border: `1px solid ${LACQUER}`,
      padding: "5px 14px",
      color: LACQUER,
      fontFamily: CINZEL,
      fontSize: 11,
      letterSpacing: 3,
      textTransform: "uppercase",
      fontWeight: 500,
      background: "transparent",
    }}>{children}</span>
  );
}

