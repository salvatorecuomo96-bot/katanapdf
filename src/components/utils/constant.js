// Shared design tokens and inline style objects for katanapdf.
export const SCALE = 2;

// Legacy — kept for EditPopup/FloatingBox editing toolbars (always LACQUER red)
export const PARCHMENT = "#F5EDD6";
export const PARCHMENT_2 = "#EDE0BC";
export const INK = "#1a1208";
export const CROSSHATCH = "";

// Brand constants — never change between themes
export const LACQUER = "#8B1A1A";
export const GOLD = "#C4963A";
export const CINZEL = '"Cinzel", "Times New Roman", serif';
export const FELL = '"Lora", Georgia, "Times New Roman", serif';

// CSS variable references — use these for theme-aware colors in inline styles
export const C = {
  bg:           "var(--bg)",
  surface:      "var(--surface)",
  card:         "var(--card)",
  text:         "var(--text)",
  textMuted:    "var(--text-muted)",
  border:       "var(--border)",
  borderStrong: "var(--border-strong)",
  toolbarBg:    "var(--toolbar-bg)",
  tabBg:        "var(--tab-bg)",
  tabActiveBg:  "var(--tab-active-bg)",
  inputBg:      "var(--input-bg)",
  pageAreaBg:   "var(--page-area-bg)",
  footerBg:     "var(--footer-bg)",
  footerText:   "var(--footer-text)",
};

// iOS-friendly hidden file input
export const hiddenFileInput = { position: "absolute", width: 0.1, height: 0.1, opacity: 0, overflow: "hidden", pointerEvents: "none" };

// Editor top toolbar button styles (white toolbar)
export const tbBtn = { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid var(--border-strong)", fontSize: 11, background: "transparent", color: "var(--text)", cursor: "pointer", userSelect: "none", fontFamily: CINZEL, letterSpacing: 2, textTransform: "uppercase", borderRadius: 3 };
export const tbIconBtn = { width: 28, height: 28, border: "1px solid var(--border)", fontSize: 13, background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CINZEL, padding: 0, borderRadius: 3 };
export const tbSelect = { padding: "4px 8px", border: "1px solid var(--border-strong)", fontSize: 12, background: "var(--input-bg)", color: "var(--text)", cursor: "pointer", fontFamily: CINZEL, letterSpacing: 1, borderRadius: 3 };
export const pageBtn = { padding: "7px 16px", border: `1px solid var(--border-strong)`, fontFamily: CINZEL, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, background: "transparent", color: LACQUER, cursor: "pointer", userSelect: "none", borderRadius: 3 };

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
