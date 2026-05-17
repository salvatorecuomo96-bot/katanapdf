// Shared design tokens and inline style objects for katanapdf.
export const SCALE = 2;

// Brand palette
export const PARCHMENT   = "#F5EDD6";
export const PARCHMENT_2 = "#EDE0BC";
export const INK         = "#1a1208";
export const CROSSHATCH  = "";
export const LACQUER     = "#8B1A1A";
export const GOLD        = "#C4963A";
export const CINZEL      = '"Cinzel", "Times New Roman", serif';
export const FELL        = '"Lora", Georgia, "Times New Roman", serif';

// Hidden file input — covers the label so iOS/Android can trigger the picker
export const hiddenFileInput = { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", overflow: "hidden" };

// Editor toolbar button styles (dark INK toolbar)
export const tbBtn     = { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid rgba(196,150,58,0.35)", fontSize: 11, background: "transparent", color: INK, cursor: "pointer", userSelect: "none", fontFamily: CINZEL, letterSpacing: 2, textTransform: "uppercase", borderRadius: 2 };
export const tbIconBtn = { width: 28, height: 28, border: "1px solid rgba(196,150,58,0.3)", fontSize: 13, background: "transparent", color: "#8B6535", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CINZEL, padding: 0, borderRadius: 2 };
// Selects in editor panels use a clean near-white background
export const tbSelect  = { padding: "4px 8px", border: "1px solid rgba(196,150,58,0.4)", fontSize: 12, background: "#faf9f6", color: INK, cursor: "pointer", fontFamily: CINZEL, letterSpacing: 1, borderRadius: 2 };
export const pageBtn   = { padding: "7px 16px", border: "1px solid rgba(139,26,26,0.3)", fontFamily: CINZEL, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, background: "transparent", color: LACQUER, cursor: "pointer", userSelect: "none", borderRadius: 2 };

export const DRAW_COLORS = [
  '#000000', '#ffffff', '#9e9e9e',
  '#f44336', '#ff9800', '#ffeb3b',
  '#4caf50', '#2196f3', '#9c27b0',
  '#e91e63', '#00bcd4', '#795548',
  '#607d8b', '#ff5722', '#8bc34a',
];

export const FB_SIZES = [6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72,80,96,120];
export const FONT_FAMILIES = [
  { label: "Arial",            value: "Arial, sans-serif" },
  { label: "Arial Unicode MS", value: '"Arial Unicode MS", Arial, sans-serif' },
  { label: "Verdana",          value: "Verdana, Geneva, sans-serif" },
  { label: "Courier",          value: '"Courier New", Courier, monospace' },
  { label: "Comic Sans MS",    value: '"Comic Sans MS", "Comic Sans", cursive' },
  { label: "Times New Roman",  value: "Times New Roman, serif" },
  { label: "Lohit Marathi",    value: '"Lohit Marathi", "Noto Sans Devanagari", sans-serif' },
  { label: "Lohit Devanagari", value: '"Lohit Devanagari", "Noto Sans Devanagari", sans-serif' },
];
