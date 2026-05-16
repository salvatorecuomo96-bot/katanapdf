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
  { icon: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>), label: "Add Images", detail: "Insert photos or logos directly on top of any page." },
  { icon: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 L18 10 L12 22 L6 10 Z"/><line x1="12" y1="22" x2="12" y2="10" strokeWidth="1.4"/><line x1="6" y1="10" x2="18" y2="10" strokeWidth="1" opacity="0.5"/></svg>), label: "Sign", detail: "Draw, type or upload your signature and place it on any page." },
  { icon: "✏", label: "Draw & Annotate", detail: "Freehand pen and highlighter for notes and annotations." },
  { icon: "⇄", label: "Merge & Split",  detail: "Combine multiple PDFs or split a document into separate files." },
  { icon: "⊞", label: "Reorder Pages",  detail: "Drag pages into any order, rotate or delete them instantly." },
];

const NAV = [
  ["About",   "#about"],
  ["FAQs",    "#faqs"],
  ["Privacy", "#privacy"],
  ["Terms",   "#terms"],
];

export default function Homepage({ onFile, onDropFile, onCreateBlank }) {
  const [dragOver, setDragOver] = useState(false);
  const [featOpen, setFeatOpen] = useState(false);
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
      style={{ height: `calc(100dvh / ${zoom4k})`, minHeight: 520, overflow: "hidden", display: "flex", flexDirection: "column", color: INK, fontFamily: FELL, zoom: zoom4k }}
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
          height: 60px; flex-shrink: 0;
          display: flex; align-items: center;
          padding: 0 36px;
        }
        .hp-header-spacer { flex: 1; }
        .hp-logo { width: min(200px,44vw); height: auto; display: block; }
        .hp-nav {
          flex: 1; display: flex; align-items: center; justify-content: flex-end;
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

        /* ── Hero: copy | samurai ────────────────────── */
        .hp-hero {
          flex: 1; min-height: 0; overflow: hidden;
          width: 100%; box-sizing: border-box;
          padding: 0 36px 0 48px;
          display: grid;
          grid-template-columns: minmax(0, 380px) 1fr;
          gap: 0 48px;
          align-items: center;
        }

        /* ── Copy (left) ─────────────────────────────── */
        .hp-copy { max-width: 380px; }
        .hp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: ${CINZEL}; font-size: 10px; letter-spacing: 3.5px;
          text-transform: uppercase; color: ${RED}; font-weight: 700;
          margin-bottom: 14px;
        }
        .hp-eyebrow::before, .hp-eyebrow::after {
          content: ""; display: inline-block;
          width: 20px; height: 1px; background: ${RED};
        }
        .hp-h1 {
          font-family: ${FELL};
          font-size: clamp(28px, 3vw, 54px);
          line-height: 1.06; letter-spacing: -0.8px;
          color: ${INK}; font-weight: 600;
          margin: 0 0 14px;
        }
        .hp-h1 em { font-style: normal; color: ${RED}; }
        .hp-sub {
          font-size: 15px; line-height: 1.62;
          color: ${MUTED}; margin: 0 0 24px;
          max-width: 400px;
        }
        .hp-actions {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .hp-btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          height: 42px; padding: 0 28px;
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
          height: 42px; padding: 0 22px;
          background: transparent; color: ${RED};
          font-family: ${CINZEL}; font-size: 10px; letter-spacing: 2px;
          text-transform: uppercase; font-weight: 800;
          border: 1.5px solid rgba(139,26,26,0.48); border-radius: 3px; cursor: pointer;
          transition: border-color .13s, background .13s;
        }
        .hp-btn-secondary:hover { border-color: ${RED}; background: rgba(139,26,26,0.04); }
        .hp-note { font-size: 13px; color: ${MUTED}; font-style: italic; }

        /* ── What you can do (expandable) ───────────── */
        .hp-what { margin-top: 18px; }
        .hp-what-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: none; border: none; padding: 0;
          font-family: ${CINZEL}; font-size: 8.5px; letter-spacing: 2px;
          text-transform: uppercase; font-weight: 800;
          color: ${RED}; cursor: pointer;
          position: relative;
          transition: opacity 0.13s;
        }
        .hp-what-btn:hover { opacity: 0.75; }
        .hp-what-btn-hint {
          visibility: hidden; opacity: 0;
          position: absolute; bottom: calc(100% + 6px); left: 0;
          background: ${INK}; color: rgba(255,253,248,0.92);
          font-size: 10px; padding: 5px 9px; border-radius: 3px;
          white-space: nowrap; pointer-events: none; z-index: 100;
          transition: opacity 0.15s;
          font-family: ${FELL}; text-transform: none; letter-spacing: 0; font-weight: 400;
        }
        .hp-what-btn-hint::after {
          content: ""; position: absolute;
          top: 100%; left: 14px;
          border: 4px solid transparent; border-top-color: ${INK};
        }
        .hp-what-btn:hover .hp-what-btn-hint { visibility: visible; opacity: 1; }
        .hp-what-chevron {
          transition: transform 0.2s;
          display: block; flex-shrink: 0;
        }
        .hp-what-chevron.open { transform: rotate(180deg); }
        .hp-what-list {
          margin-top: 10px;
          border: 1px solid ${LINE};
          border-radius: 4px;
          overflow: visible;
          background: rgba(255,253,248,0.88);
          box-shadow: 0 4px 14px rgba(40,24,8,0.07);
        }
        .hp-what-item {
          display: flex; align-items: center; gap: 9px;
          padding: 9px 12px;
          border-bottom: 1px solid ${LINE};
          cursor: pointer; position: relative;
          transition: background 0.12s;
        }
        .hp-what-item:last-child { border-bottom: none; }
        .hp-what-item:first-child { border-radius: 4px 4px 0 0; }
        .hp-what-item:last-child { border-radius: 0 0 4px 4px; }
        .hp-what-item:hover { background: rgba(139,26,26,0.05); }
        .hp-what-item::before {
          content: ""; position: absolute;
          left: 0; top: 0; bottom: 0; width: 2px;
          background: ${RED}; opacity: 0; transition: opacity 0.12s;
          border-radius: 2px 0 0 2px;
        }
        .hp-what-item:hover::before { opacity: 1; }
        .hp-what-icon {
          font-size: 13px; color: ${RED};
          display: flex; align-items: center; justify-content: center;
          width: 18px; flex-shrink: 0;
        }
        .hp-what-name {
          font-family: ${CINZEL}; font-size: 8px; letter-spacing: 1.4px;
          text-transform: uppercase; font-weight: 800; color: ${INK};
        }
        /* tooltip pops right, overflows into samurai column */
        .hp-what-tooltip {
          visibility: hidden; opacity: 0;
          position: absolute; left: calc(100% + 10px); top: 50%;
          transform: translateY(-50%);
          background: ${INK}; color: rgba(255,253,248,0.92);
          font-family: ${FELL}; font-size: 11px; line-height: 1.45;
          padding: 7px 11px; border-radius: 4px;
          width: 200px; text-align: left;
          pointer-events: none; z-index: 300;
          transition: opacity 0.15s; white-space: normal;
        }
        .hp-what-tooltip::after {
          content: ""; position: absolute;
          right: 100%; top: 50%; transform: translateY(-50%);
          border: 5px solid transparent; border-right-color: ${INK};
        }
        .hp-what-item:hover .hp-what-tooltip { visibility: visible; opacity: 1; }

        /* ── Samurai art (right, fills hero) ─────────── */
        .hp-art {
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: stretch;
          padding: 12px 0;
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
          max-height: min(84vh, 820px);
          object-fit: contain;
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

        /* ── Short-screen (720p) ─────────────────────── */
        @media (max-height: 780px) {
          .hp-art img { max-height: min(80vh, 640px); }
          .hp-strip-item { padding: 7px 11px; }
          .hp-hero { padding: 0 28px 0 36px; gap: 0 32px; }
        }

        /* ── Responsive ─────────────────────────────── */
        @media (max-width: 960px) {
          .hp-strip-inner { flex-wrap: wrap; border-left: none; }
          .hp-strip-item { border: 1px solid ${LINE}; border-radius: 3px; margin: 4px; padding: 7px 10px; }
          .hp-hero {
            grid-template-columns: 1fr;
            padding: 16px 28px 12px;
            align-items: start; overflow-y: auto;
          }
          .hp-art { order: -1; }
          .hp-art img { max-height: 220px; max-width: min(70vw, 280px); }
          .hp-copy { max-width: 100%; }
        }

        @media (max-width: 580px) {
          .hp-header { padding: 0 16px; }
          .hp-logo { width: min(160px,44vw); }
          .hp-nav a { padding: 0 8px; font-size: 8px; letter-spacing: 1.5px; }
          .hp-strip { padding: 0 12px; }
          .hp-hero { padding: 16px 18px; }
          .hp-art img { max-height: 160px; max-width: min(80vw, 220px); }
          .hp-h1 { font-size: clamp(24px,10vw,36px); }
          .hp-sub { font-size: 13px; }
          .hp-actions { flex-direction: column; align-items: stretch; }
          .hp-btn-primary, .hp-btn-secondary { width: 100%; height: 50px; }
        }
      `}</style>

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


      {/* ── Hero: copy | samurai ── */}
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

          {/* ── What you can do ── */}
          <div className="hp-what">
            <button
              className="hp-what-btn"
              onClick={() => setFeatOpen(v => !v)}
              title=""
            >
              <span className="hp-what-btn-hint">See all {FEATURES.length} features</span>
              <svg
                className={`hp-what-chevron${featOpen ? " open" : ""}`}
                width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
              What you can do
            </button>

            {featOpen && (
              <div className="hp-what-list">
                {FEATURES.map(f => (
                  <label className="hp-what-item" key={f.label}>
                    <span className="hp-what-icon">{f.icon}</span>
                    <span className="hp-what-name">{f.label}</span>
                    {f.detail && <span className="hp-what-tooltip">{f.detail}</span>}
                    <input type="file" accept="application/pdf,.pdf,image/*" onChange={onFile} style={hiddenFileInput} />
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="hp-art" aria-hidden="true">
          <div className="hp-art-inner">
            <img src="/samurai.png" alt="" draggable={false} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
