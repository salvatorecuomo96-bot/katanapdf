import { useState } from "react";
import Footer from "./ui/Footer";
import { CINZEL, FELL, LACQUER, hiddenFileInput } from "./utils/constant";

const RED   = "#8B1A1A";
const INK   = "#18130d";
const MUTED = "rgba(24,19,13,0.58)";
const GOLD  = "rgba(180,138,64,0.38)";
const LINE  = "rgba(116,86,44,0.18)";

function use4KZoom() {
  if (typeof window === "undefined") return 1;
  const dpr = window.devicePixelRatio || 1;
  return (window.screen?.width || window.innerWidth) * dpr >= 2560 ? 1.3 : 1;
}

const FEATURES = [
  { icon: "✎", label: "Edit Text",      detail: "Click any text block to edit it in place. Font, size and colour are pre-filled." },
  { icon: "＋", label: "Add Text",      detail: "Drop new text boxes anywhere on the page at any size." },
  { icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>), label: "Add Images", detail: "Insert photos or logos directly on top of any page." },
  { icon: (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 L18 10 L12 22 L6 10 Z"/><line x1="12" y1="22" x2="12" y2="10" strokeWidth="1.2"/><line x1="6" y1="10" x2="18" y2="10" strokeWidth="1" opacity="0.5"/></svg>), label: "Sign", detail: "Draw, type or upload your signature and place it on any page." },
  { icon: "✏", label: "Draw & Annotate", detail: "Freehand pen and highlighter for notes and annotations." },
  { icon: "◇", label: "Shapes",         detail: "Add circles and rectangles with custom colour and fill." },
  { icon: "⇄", label: "Merge & Split", detail: "Combine multiple PDFs or split a document into separate files." },
  { icon: "⊞", label: "Reorder Pages", detail: "Drag pages into any order, rotate or delete them instantly." },
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
      style={{ height: `calc(100dvh / ${zoom4k})`, minHeight: 580, overflow: "hidden", display: "flex", flexDirection: "column", color: INK, fontFamily: FELL, zoom: zoom4k }}
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

        /* ── Hero ─────────────────────────────────── */
        .hp-hero {
          flex: 1; min-height: 0; overflow: hidden;
          max-width: 1400px; margin: 0 auto;
          padding: 12px 32px 20px;
          display: grid;
          grid-template-columns: 1fr minmax(0, 520px);
          align-items: center;
          gap: 0;
          width: 100%; box-sizing: border-box;
        }
        .hp-copy { max-width: 620px; }
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
          font-size: clamp(28px, 3.2vw, 52px);
          line-height: 1.06; letter-spacing: -0.8px;
          color: ${INK}; font-weight: 600;
          margin: 0 0 14px;
        }
        .hp-h1 em { font-style: normal; color: ${RED}; }
        .hp-sub {
          font-size: 15px; line-height: 1.62;
          color: ${MUTED}; margin: 0 0 22px;
          max-width: 480px;
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

        /* ── Samurai art ────────────────────────────── */
        .hp-art {
          position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        /* ── Samurai art ────────────────────────────── */
        .hp-art {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          box-shadow: none;
          border: none;
          padding: 0;
        }

        .hp-art::before {
          display: none;
          content: none;
        }

        .hp-art img {
          width: 100%;
          max-width: 100%;
          max-height: min(62vh, 480px);
          object-fit: contain;
          filter: none;
          box-shadow: none;
          background: transparent;
          border: none;
          position: relative;
          z-index: 1;
        }
        /* ── Trust strip ─────────────────────────────── */
        .hp-trust {
          border-top: 1px solid ${LINE};
          border-bottom: 1px solid ${LINE};
          background: rgba(255,253,248,0.55);
          backdrop-filter: blur(4px);
        }
        .hp-trust-inner {
          max-width: 1000px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4,1fr);
        }
        .hp-badge {
          padding: 10px 16px;
          border-right: 1px solid ${LINE};
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 4px;
        }
        .hp-badge:last-child { border-right: none; }
        .hp-badge-icon { font-size: 16px; line-height: 1; }
        .hp-badge-label {
          font-family: ${CINZEL}; font-size: 9px; letter-spacing: 1.5px;
          text-transform: uppercase; font-weight: 800; color: ${INK};
        }
        .hp-badge-sub {
          font-size: 11px; color: ${MUTED}; line-height: 1.35;
        }

        /* ── Sections ─────────────────────────────────── */
        .hp-section {
          max-width: 1100px; margin: 0 auto; padding: 18px 42px 0;
        }
        .hp-section-last { padding-bottom: 18px; }
        .hp-heading {
          text-align: center; margin: 0 0 14px;
        }
        .hp-heading span {
          font-family: ${CINZEL}; font-size: 9px; letter-spacing: 4px;
          text-transform: uppercase; font-weight: 800; color: ${RED};
        }
        .hp-heading-bar {
          width: 28px; height: 2px; background: ${RED};
          border-radius: 2px; margin: 6px auto 0;
        }

        /* ── Feature cards ────────────────────────────── */
        .hp-features {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 8px;
        }
        .hp-feat {
          background: rgba(255,253,248,0.78);
          border: 1px solid ${LINE};
          border-radius: 4px;
          padding: 10px 12px 10px;
          position: relative; overflow: hidden;
          box-shadow: 0 8px 24px rgba(40,24,8,0.05);
        }
        .hp-feat::after {
          content: ""; position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: ${RED};
        }
        .hp-feat-icon {
          width: 26px; height: 26px;
          background: rgba(139,26,26,0.06);
          border: 1px solid rgba(139,26,26,0.15);
          border-radius: 3px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; color: ${RED};
          margin-bottom: 6px;
        }
        .hp-feat-label {
          display: block;
          font-family: ${CINZEL}; font-size: 8.5px;
          letter-spacing: 1.4px; text-transform: uppercase;
          font-weight: 800; color: ${INK}; margin-bottom: 4px;
        }
        .hp-feat-detail {
          display: block; font-size: 10.5px;
          color: ${MUTED}; line-height: 1.42;
        }

        /* ── Steps ─────────────────────────────────── */
        .hp-steps { display: flex; flex-direction: column; gap: 10px; }
        .hp-step {
          display: grid; grid-template-columns: 52px 1fr;
          gap: 20px; align-items: center;
          background: rgba(255,253,248,0.72);
          border: 1px solid ${LINE}; border-radius: 4px;
          padding: 18px 22px;
          box-shadow: 0 8px 22px rgba(40,24,8,0.04);
        }
        .hp-step-num {
          font-family: ${CINZEL}; font-size: 34px;
          color: rgba(139,26,26,0.2); font-weight: 800;
          line-height: 1; text-align: center;
        }
        .hp-step-text { font-size: 15.5px; line-height: 1.58; color: ${INK}; }

        /* ── FAQ ─────────────────────────────────── */
        .hp-faq-wrap {
          background: rgba(255,253,248,0.72);
          border: 1px solid ${LINE}; border-radius: 5px; overflow: hidden;
          box-shadow: 0 12px 30px rgba(40,24,8,0.05);
        }
        .hp-faq-item { border-bottom: 1px solid ${LINE}; }
        .hp-faq-item:last-child { border-bottom: none; }
        .hp-faq-summary {
          cursor: pointer; list-style: none;
          font-family: ${CINZEL}; font-size: 11px; letter-spacing: 1.5px;
          text-transform: uppercase; font-weight: 800; color: ${INK};
          padding: 18px 24px;
          display: flex; justify-content: space-between; align-items: center;
          user-select: none;
        }
        .hp-faq-summary::-webkit-details-marker { display: none; }
        .hp-faq-plus { color: ${RED}; font-size: 20px; flex-shrink: 0; margin-left: 16px; font-weight: 300; }
        .hp-faq-answer {
          margin: 0; padding: 0 24px 18px;
          font-size: 15px; line-height: 1.68; color: ${MUTED};
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

        /* ── Responsive ─────────────────────────────── */
        @media (max-width: 960px) {
          .hp-hero {
            grid-template-columns: 1fr;
            padding: 20px 28px 16px;
          }
          .hp-art { order: -1; }
          .hp-art img { max-width: min(70vw, 280px); max-height: 180px; }
          .hp-copy { max-width: 100%; }
          .hp-trust-inner { grid-template-columns: repeat(2,1fr); }
          .hp-badge:nth-child(2) { border-right: none; }
          .hp-badge:nth-child(1),
          .hp-badge:nth-child(2) { border-bottom: 1px solid ${LINE}; }
          .hp-features { grid-template-columns: repeat(2,1fr); }
          .hp-section { padding-left: 28px; padding-right: 28px; }
        }

        @media (max-width: 580px) {
          .hp-header { height: 60px; padding: 0 16px; }
          .hp-logo { width: min(160px,44vw); }
          .hp-nav a { padding: 0 8px; font-size: 8px; letter-spacing: 1.5px; }
          .hp-hero { padding: 28px 18px 32px; }
          .hp-art img { max-width: min(80vw, 220px); max-height: 140px; }
          .hp-h1 { font-size: clamp(24px,10vw,36px); letter-spacing: -0.5px; }
          .hp-sub { font-size: 13px; }
          .hp-actions { flex-direction: column; align-items: stretch; gap: 10px; }
          .hp-btn-primary, .hp-btn-secondary { width: 100%; height: 50px; }
          .hp-trust-inner { grid-template-columns: 1fr; }
          .hp-badge { border-right: none; border-bottom: 1px solid ${LINE}; }
          .hp-badge:last-child { border-bottom: none; }
          .hp-features { grid-template-columns: repeat(2,1fr); gap: 6px; }
          .hp-section { padding-left: 14px; padding-right: 14px; padding-top: 14px; }
          .hp-step { grid-template-columns: 38px 1fr; padding: 14px 16px; }
          .hp-step-num { font-size: 26px; }
          .hp-step-text { font-size: 14px; }
          .hp-faq-summary { font-size: 10px; padding: 16px 18px; letter-spacing: 1px; }
          .hp-faq-answer { padding: 0 18px 16px; font-size: 14px; }
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

      {/* ── Hero ── */}
      <section className="hp-hero">
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

        <div className="hp-art" aria-hidden="true">
          <img src="/samurai.png" alt="" draggable={false} />
        </div>
      </section>

      {/* ── Trust badges ── */}
      <div className="hp-trust">
        <div className="hp-trust-inner">
          {[
            ["⚔", "100% Free",    "Every feature, no paid tier."],
            ["⛩", "No Upload",    "Your file stays in your browser."],
            ["◎", "No Sign-Up",   "No email. No account. Ever."],
            ["✦", "No Watermark", "Export clean, unbranded PDFs."],
          ].map(([icon, label, sub]) => (
            <div className="hp-badge" key={label}>
              <span className="hp-badge-icon">{icon}</span>
              <span className="hp-badge-label">{label}</span>
              <span className="hp-badge-sub">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="hp-section hp-section-last">
        <div className="hp-heading">
          <span>What you can do</span>
          <div className="hp-heading-bar" />
        </div>
        <div className="hp-features">
          {FEATURES.map(f => (
            <div className="hp-feat" key={f.label}>
              <div className="hp-feat-icon">{f.icon}</div>
              <span className="hp-feat-label">{f.label}</span>
              <span className="hp-feat-detail">{f.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
