// Shared design tokens and inline style objects for katanapdf.
export const SCALE = 2;

export const PARCHMENT = "#F5EDD6";
export const PARCHMENT_2 = "#EDE0BC";
export const LACQUER = "#8B1A1A";
export const GOLD = "#C4963A";
export const INK = "#1a1208";

export const CINZEL = '"Cinzel", "Times New Roman", serif';
export const FELL = '"Lora", Georgia, "Times New Roman", serif';

export const CROSSHATCH = `repeating-linear-gradient(45deg, transparent 0 9px, rgba(26,18,8,0.035) 9px 10px), repeating-linear-gradient(-45deg, transparent 0 9px, rgba(26,18,8,0.035) 9px 10px)`;

// iOS-friendly hidden file input - display:none breaks file picker on some iOS Safari versions.
export const hiddenFileInput = { position: "absolute", width: 0.1, height: 0.1, opacity: 0, overflow: "hidden", pointerEvents: "none" };

export const tbBtn = { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid rgba(196,150,58,0.4)", fontSize: 11, background: "transparent", color: GOLD, cursor: "pointer", userSelect: "none", fontFamily: CINZEL, letterSpacing: 2, textTransform: "uppercase" };
export const tbIconBtn = { width: 28, height: 28, border: "1px solid rgba(196,150,58,0.4)", fontSize: 13, background: "transparent", color: GOLD, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CINZEL, padding: 0 };
export const tbSelect = { padding: "4px 8px", border: "1px solid rgba(196,150,58,0.4)", fontSize: 12, background: INK, color: PARCHMENT, cursor: "pointer", fontFamily: CINZEL, letterSpacing: 1 };
export const pageBtn = { padding: "7px 16px", border: `1px solid ${GOLD}`, fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, background: "transparent", color: LACQUER, cursor: "pointer", userSelect: "none" };

export const DRAW_COLORS = [
  '#000000', '#ffffff', '#9e9e9e',
  '#f44336', '#ff9800', '#ffeb3b',
  '#4caf50', '#2196f3', '#9c27b0',
  '#e91e63', '#00bcd4', '#795548',
  '#607d8b', '#ff5722', '#8bc34a',
];

export const FB_SIZES = [6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72,80,96,120];
export const FONT_FAMILIES = [
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Arial Unicode MS", value: '"Arial Unicode MS", Arial, sans-serif' },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Courier", value: '"Courier New", Courier, monospace' },
  { label: "Comic Sans MS", value: '"Comic Sans MS", "Comic Sans", cursive' },
  { label: "Times New Roman", value: "Times New Roman, serif" },
  { label: "Lohit Marathi", value: '"Lohit Marathi", "Noto Sans Devanagari", sans-serif' },
  { label: "Lohit Devanagari", value: '"Lohit Devanagari", "Noto Sans Devanagari", sans-serif' },
];
