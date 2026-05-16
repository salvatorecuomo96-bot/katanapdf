import { useState } from "react";
import Footer from "./ui/Footer";
import { CINZEL, FELL, LACQUER, hiddenFileInput } from "./utils/constant";

const RED   = "#8B1A1A";
const INK   = "#18130d";
const MUTED = "rgba(24,19,13,0.58)";
const LINE  = "rgba(116,86,44,0.18)";

function use4KZoom() {
  if (typeof window === "undefined") return 1;
  const dpr = window.devicePixelRatio || 1;
  return (window.screen?.width || window.innerWidth) * dpr >= 2560 ? 1.3 : 1;
}

const FEATURES = [
  { icon: "✎", label: "Edit Text",       detail: "Click any text block to edit it in place. Font, size and colour are pre-filled." },
  { icon: "＋", label: "Add Text",       detail: "Drop new text boxes anywhere on the page at any size." },
  { icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>), label: "Add Images", detail: "Insert photos or logos directly on top of any page." },
  { icon: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 L18 10 L12 22 L6 10 Z"/><line x1="12" y1="22" x2="12" y2="10" strokeWidth="1.4"/><line x1="6" y1="10" x2="18" y2="10" strokeWidth="1" opacity="0.5"/></svg>), label: "Sign", detail: "Draw, type or upload your signature and place it on any page." },
  { icon: "✏", label: "Draw & Annotate", detail: "Freehand pen and highlighter for notes and annotations." },
  { icon: "◇", label: "Shapes",          detail: "Add circles and rectangles with custom colour and fill." },
  { icon: "⇄", label: "Merge & Split",  detail: "Combine multiple PDFs or split a document into separate files." },
  { icon: "⊞", label: "Reorder Pages",  detail: "Drag pages into any order, rotate or delete them instantly." },
];

const NAV = [
  ["About",   "#about"],
  ["FAQs",    "#faqs"],
  ["Privacy", "#privacy"],
  ["Terms",   "#terms"],
];

export default function Homepage({ onFile, onDropFile, onCreateBlank, isDark, onToggleDark }) {
  const [dragOver, setDragOver] = useState(false);
  const zoom4k = use4KZoom();

  const onDragOver  = e => { e.preventDefault(); if (!dragOver) setDragOver(true); };
  const onDragLeave = e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); };
  const onDrop      = e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onDropFile(f); };

  return (
    <div
      className="hp"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{ height: `calc(100dvh / ${zoom4k})`, minHeight: 560, overflow: "hidden", display: "flex", flexDirection: "column", color: INK, fontFamily: FELL, zoom: zoom4k }}
    >
      <style>{`
        .hp {
          background:
            linear-gradient(to bottom, rgba(255,252,246,0.87) 0%, rgba(255,252,246,0.92) 100%),
            url("/background.png") center top / cover no-repeat fixed;
        }

        /* ── Header ─────────────────────────────────── */
        .hp-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(255,253,248,0.92);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid ${LINE};
          height: 60px;
          display: flex; align-items: center;
          padding: 0 36px;
          flex-shrink: 0;
        }
        .hp-header-spacer { flex: 1; }
        .hp-logo { width: min(200px,44vw); height: auto; display: block; }
        .hp-nav {
          flex: 1;
          display: flex; align-items: center; gap: 0; justify-content: flex-end;
        }
        .hp-nav a {
          font-family: ${CINZEL}; font-size: 9px; letter-spacing: 2.5px;
          text-transform: uppercase; font-weight: 700;
          color: rgba(24,19,13,0.5); text-decoration: none;
          padding: 0 14px; border-right: 1px solid ${LINE};
          transition: color .13s;
        }
        .hp-nav a:last-child { border-right: none; }
        .hp-nav a:hover { color: ${RED}; }

        /* ── Hero: 3-column ─────────────────────────── */
        .hp-hero {
          flex: 1; min-height: 0; overflow: hidden;
          width: 100%; box-sizing: border-box;
          padding: 0 36px;
          display: grid;
          grid-template-columns: minmax(0, 360px) 1fr minmax(0, 200px);
          gap: 0 36px;
          align-items: center;
        }

        /* ── Copy (left) ─────────────────────────────── */
        .hp-copy { max-width: 360px; }
        .hp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: ${CINZEL}; font-size: 10px; letter-spacing: 3.5px;
          text-transform: uppercase; color: ${RED}; font-weight: 700;
          margin-bottom: 12px;
        }
        .hp-eyebrow::before, .hp-eyebrow::after {
          content: ""; display: inline-block;
          width: 20px; height: 1px; background: ${RED};
        }
        .hp-h1 {
          font-family: ${FELL};
          font-size: clamp(28px, 3vw, 52px);
          line-height: 1.06; letter-spacing: -0.8px;
          color: ${INK}; font-weight: 600;
          margin: 0 0 14px;
        }
        .hp-h1 em { font-style: normal; color: ${RED}; }
        .hp-sub {
          font-size: 15px; line-height: 1.62;
          color: ${MUTED}; margin: 0 0 22px;
          max-width: 420px;
        }
        .hp-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .hp-btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          height: 40px; padding: 0 26px;
          background: ${RED}; color: #fff;
          font-family: ${CINZEL}; font-size: 10px; letter-spacing: 2px;
          text-transform: uppercase; font-weight: 800;
          border: none; border-radius: 3px; cursor: pointer;
          box-shadow: 0 10px 22px rgba(139,26,26,0.22);
          transition: transform .13s, box-shadow .13s;
        }
        .hp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 20px 38px rgba(139,26,26,0.28); }
        .hp-btn-secondary {
          display: inline-flex; align-items: center; justify-content: center;
          height: 40px; padding: 0 22px;
          background: transparent; color: ${RED};
          font-family: ${CINZEL}; font-size: 10px; letter-spacing: 2px;
          text-transform: uppercase; font-weight: 800;
          border: 1.5px solid rgba(139,26,26,0.48); border-radius: 3px; cursor: pointer;
          transition: border-color .13s, background .13s;
        }
        .hp-btn-secondary:hover { border-color: ${RED}; background: rgba(139,26,26,0.04); }
        .hp-note {
          font-size: 13px; color: ${MUTED}; font-style: italic;
        }

        /* ── Samurai art (center) ────────────────────── */
        .hp-art {
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: stretch;
          padding: 16px 0;
        }
        .hp-art-inner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          box-shadow: 0 0 40px 12px rgba(139,26,26,0.1);
          overflow: hidden;
        }
        .hp-art img {
          display: block;
          width: auto;
          max-width: 100%;
          max-height: min(82vh, 720px);
          object-fit: contain;
        }

        /* ── Feature sidebar (right) ─────────────────── */
        .hp-feats-side {
          display: flex; flex-direction: column;
          border: 1px solid ${LINE};
          border-radius: 5px;
          overflow: visible;
          background: rgba(255,253,248,0.7);
          backdrop-filter: blur(6px);
          box-shadow: 0 4px 18px rgba(40,24,8,0.06);
        }
        .hp-feats-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px;
          border-bottom: 1px solid ${LINE};
          position: relative;
          cursor: default;
          transition: background 0.12s;
        }
        .hp-feats-item:last-child { border-bottom: none; }
        .hp-feats-item:hover { background: rgba(139,26,26,0.04); }
        .hp-feats-item::before {
          content: ""; position: absolute;
          left: 0; top: 0; bottom: 0; width: 2px;
          background: ${RED}; opacity: 0;
          transition: opacity 0.12s;
        }
        .hp-feats-item:hover::before { opacity: 1; }
        .hp-feats-icon {
          width: 20px; height: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; color: ${RED};
          flex-shrink: 0;
        }
        .hp-feats-name {
          font-family: ${CINZEL}; font-size: 7.5px; letter-spacing: 1.2px;
          text-transform: uppercase; font-weight: 800; color: ${INK};
          line-height: 1.3;
        }
        /* Tooltip for right-rail items — pops to the left */
        .hp-feats-item .hp-feat-tooltip {
          visibility: hidden; opacity: 0;
          position: absolute;
          right: calc(100% + 10px); left: auto;
          top: 50%; bottom: auto;
          transform: translateY(-50%);
          background: ${INK}; color: rgba(255,253,248,0.92);
          font-size: 11px; line-height: 1.45;
          padding: 7px 11px; border-radius: 4px;
          width: 190px; text-align: left;
          pointer-events: none; z-index: 200;
          transition: opacity 0.15s;
          white-space: normal;
        }
        .hp-feats-item .hp-feat-tooltip::after {
          content: ""; position: absolute;
          top: 50%; right: -10px; left: auto;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-left-color: ${INK};
          border-top-color: transparent;
        }
        .hp-feats-item:hover .hp-feat-tooltip {
          visibility: visible; opacity: 1;
        }

        /* ── Drop overlay ─────────────────────────────── */
        .hp-drop {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(139,26,26,0.06);
          border: 3px dashed ${RED};
          display: flex; align-items: center; justify-content: center;
          pointer-events: none; backdrop-filter: blur(2px);
        }
        .hp-drop-box {
          background: #fffdf8; padding: 18px 42px;
          border: 1px solid ${RED}; color: ${RED};
          font-family: ${CINZEL}; font-size: 14px;
          letter-spacing: 4px; text-transform: uppercase;
          box-shadow: 0 14px 32px rgba(40,24,8,0.12);
        }

        /* ── Short-screen (720p laptops) ─────────────── */
        @media (max-height: 780px) {
          .hp-art img { max-height: min(78vh, 580px); }
          .hp-hero { padding: 0 28px; gap: 0 24px; }
          .hp-feats-item { padding: 7px 11px; }
          .hp-feats-name { font-size: 7px; }
        }

        /* ── Responsive ─────────────────────────────── */
        @media (max-width: 960px) {
          .hp-hero {
            grid-template-columns: 1fr;
            padding: 20px 28px 16px;
            align-items: start;
            overflow-y: auto;
          }
          .hp-art { order: -1; padding: 0; }
          .hp-art img { max-height: 220px; max-width: min(70vw, 280px); }
          .hp-copy { max-width: 100%; }
          .hp-feats-side { order: 2; flex-direction: row; flex-wrap: wrap; border-radius: 4px; }
          .hp-feats-item { flex: 1 1 45%; border-right: 1px solid ${LINE}; border-bottom: 1px solid ${LINE}; }
          .hp-feats-item:nth-child(even) { border-right: none; }
          .hp-feats-item .hp-feat-tooltip {
            right: auto; left: 50%; top: auto; bottom: calc(100% + 8px);
            transform: translateX(-50%);
            width: 160px; text-align: center;
          }
          .hp-feats-item .hp-feat-tooltip::after {
            right: auto; left: 50%; top: 100%; bottom: auto;
            transform: translateX(-50%);
            border-left-color: transparent;
            border-top-color: ${INK};
          }
        }

        @media (max-width: 580px) {
          .hp-header { height: 60px; padding: 0 16px; }
          .hp-logo { width: min(160px,44vw); }
          .hp-nav a { padding: 0 8px; font-size: 8px; letter-spacing: 1.5px; }
          .hp-hero { padding: 20px 18px 24px; gap: 16px 0; }
          .hp-art img { max-height: 160px; max-width: min(80vw, 220px); }
          .hp-h1 { font-size: clamp(24px,10vw,36px); letter-spacing: -0.5px; }
          .hp-sub { font-size: 13px; }
          .hp-actions { flex-direction: column; align-items: stretch; gap: 10px; }
          .hp-btn-primary, .hp-btn-secondary { width: 100%; height: 50px; }
          .hp-feats-item { flex: 1 1 100%; }
          .hp-feats-item:nth-child(even) { border-right: none; }
        }
      `}</style>

      {/* Drop overlay */}
      {dragOver && (
        <div className="hp-drop">
          <div className="hp-drop-box">Drop your PDF or image here</div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="hp-header">
        <div className="hp-header-spacer" />
        <img src="/logo.png" alt="katanapdf" className="hp-logo" />
        <nav className="hp-nav">
          {NAV.map(([label, href]) => (
            <a key={label} href={href}>{label}</a>
          ))}
        </nav>
      </header>

      {/* ── Hero: copy | samurai | features ── */}
      <section className="hp-hero">

        {/* Left — copy */}
        <div className="hp-copy">
          <div className="hp-eyebrow">100% Free · No Account · No Upload</div>
          <h1 className="hp-h1">
            Free PDF Editor<em>.</em><br />
            <em>Runs in your Browser<em>.</em></em>
          </h1>
          <p className="hp-sub">
            Edit, annotate, sign, merge and split PDFs directly in your browser. No upload, no account, no watermark.
          </p>
          <div className="hp-actions">
            <label className="hp-btn-primary">
              Open PDF or Image
              <input type="file" accept="application/pdf,.pdf,image/*" onChange={onFile} style={hiddenFileInput} />
            </label>
            <button className="hp-btn-secondary" onClick={onCreateBlank}>
              Create Blank PDF
            </button>
          </div>
          <p className="hp-note">or drag a file anywhere on this page</p>
        </div>

        {/* Center — samurai */}
        <div className="hp-art" aria-hidden="true">
          <div className="hp-art-inner">
            <img src="/samurai.png" alt="" draggable={false} />
          </div>
        </div>

        {/* Right — feature list */}
        <nav className="hp-feats-side" aria-label="Features">
          {FEATURES.map(f => (
            <div className="hp-feats-item" key={f.label}>
              {f.detail && <span className="hp-feat-tooltip">{f.detail}</span>}
              <div className="hp-feats-icon">{f.icon}</div>
              <span className="hp-feats-name">{f.label}</span>
            </div>
          ))}
        </nav>

      </section>

      <Footer />
    </div>
  );
}
