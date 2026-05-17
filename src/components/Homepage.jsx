import { useState } from "react";
import Footer from "./ui/Footer";
import { CINZEL, FELL, LACQUER, hiddenFileInput } from "./utils/constant";

const RED   = "#8B1A1A";
const INK   = "#18130d";
const MUTED = "rgba(24,19,13,0.58)";
const LINE  = "rgba(116,86,44,0.18)";

const FEATURES = [
  { icon: "✎", label: "Edit Text",       detail: "Click any text block to edit it in place. Font, size and colour are pre-filled." },
  { icon: "T", label: "Add Text",         detail: "Drop new text boxes anywhere on the page at any size." },
  { icon: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>), label: "Add Images", detail: "Insert photos or logos directly on top of any page." },
  { icon: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{transform:"rotate(180deg)"}}><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>), label: "Sign", detail: "Draw, type or upload your signature and place it on any page." },
  { icon: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M15 5l4 4"/></svg>), label: "Draw & Annotate", detail: "Freehand pen and highlighter for notes and annotations." },
  { icon: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="5"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>), label: "Shapes",          detail: "Add circles, squares, lines and arrows to mark up any page." },
  { icon: "⇄", label: "Merge & Split",  detail: "Combine multiple PDFs or split a document into separate files." },
  { icon: "⊞", label: "Reorder Pages",  detail: "Drag pages into any order, rotate or delete them instantly." },
];

const NAV = [
  ["About",   "/about"],
  ["FAQs",    "/faqs"],
  ["Privacy", "/privacy"],
  ["Terms",   "/terms"],
];

export default function Homepage({ onFile, onDropFile, onCreateBlank, navigate }) {
  const nav = navigate || ((href) => { window.location.href = href; });
  const [dragOver, setDragOver] = useState(false);
  const [featOpen, setFeatOpen] = useState(false);

  const onDragOver  = e => { e.preventDefault(); if (!dragOver) setDragOver(true); };
  const onDragLeave = e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false); };
  const onDrop      = e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onDropFile(f); };

  return (
    <div
      className="hp"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{ height: "100dvh", minHeight: 560, overflow: "hidden", display: "flex", flexDirection: "column", color: INK, fontFamily: FELL }}
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

        /* ── Hero: centered stage ───────────────────── */
        .hp-hero {
          flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
          display: flex; align-items: stretch; justify-content: center;
          padding: clamp(20px,3.5vh,48px) clamp(28px,4.5vw,72px) clamp(8px,2vh,20px);
          box-sizing: border-box;
        }

        /* Stage: the one balanced composition, centered */
        .hp-stage {
          width: 100%; max-width: 1300px;
          display: grid;
          grid-template-columns: minmax(0, 400px) 1fr;
          column-gap: 24px;
          align-items: stretch;
        }

        /* ── Copy: top-left of stage ────────────────── */
        .hp-copy {
          display: flex; flex-direction: column;
          justify-content: flex-start;
          padding-top: clamp(4px, 1.5vh, 32px);
          max-width: 420px;
        }
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

        /* ── Samurai art: bottom-right of stage ─────── */
        .hp-art {
          display: flex; flex-direction: column;
          justify-content: flex-end; align-items: flex-end;
          min-width: 0; position: relative;
        }
        /* Fog lives on .hp-art (full column width) so it covers the gap
           between the image edge and the column edge — no hard line */
        .hp-art::after {
          content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background:
            radial-gradient(ellipse 32% 30% at   0%   0%, rgba(255,252,246,0.99) 0%, rgba(255,252,246,0.68) 35%, rgba(255,252,246,0.22) 58%, transparent 78%),
            radial-gradient(ellipse 30% 28% at 100%   0%, rgba(255,252,246,0.97) 0%, rgba(255,252,246,0.60) 32%, rgba(255,252,246,0.18) 58%, transparent 78%),
            radial-gradient(ellipse 30% 28% at   0% 100%, rgba(255,252,246,0.98) 0%, rgba(255,252,246,0.64) 35%, rgba(255,252,246,0.18) 58%, transparent 78%),
            radial-gradient(ellipse 28% 26% at 100% 100%, rgba(255,252,246,0.96) 0%, rgba(255,252,246,0.56) 32%, rgba(255,252,246,0.16) 58%, transparent 78%),
            linear-gradient(to right,  rgba(255,252,246,0.98) 0%, rgba(255,252,246,0.62) 6%, rgba(255,252,246,0.22) 15%, rgba(255,252,246,0.06) 24%, transparent 34%),
            linear-gradient(to left,   rgba(255,252,246,0.97) 0%, rgba(255,252,246,0.60) 7%, rgba(255,252,246,0.24) 16%, rgba(255,252,246,0.07) 26%, transparent 36%),
            linear-gradient(to bottom, rgba(255,252,246,0.82) 0%, rgba(255,252,246,0.30) 4%, rgba(255,252,246,0.08) 9%,  transparent 16%),
            linear-gradient(to top,    rgba(255,252,246,0.78) 0%, rgba(255,252,246,0.26) 4%, rgba(255,252,246,0.07) 9%,  transparent 14%);
        }
        .hp-art-inner {
          display: inline-flex; align-items: flex-end; justify-content: flex-end;
          position: relative; box-shadow: none; background: transparent;
        }
        .hp-art img {
          display: block;
          width: clamp(300px, 52vw, 880px);
          height: auto; max-height: min(82vh, 800px);
          object-fit: contain; mix-blend-mode: multiply;
          -webkit-mask-image:
            linear-gradient(to right,  transparent 0%, rgba(0,0,0,0.4) 8%, black 20%, black 74%, rgba(0,0,0,0.30) 86%, rgba(0,0,0,0.06) 95%, transparent 100%),
            linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 3%, black  8%, black 92%, rgba(0,0,0,0.5) 97%, transparent 100%);
          -webkit-mask-composite: source-in;
          mask-image:
            linear-gradient(to right,  transparent 0%, rgba(0,0,0,0.4) 8%, black 20%, black 74%, rgba(0,0,0,0.30) 86%, rgba(0,0,0,0.06) 95%, transparent 100%),
            linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 3%, black  8%, black 92%, rgba(0,0,0,0.5) 97%, transparent 100%);
          mask-composite: intersect;
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

        /* ── Short-screen: compact layout so list fits without scrolling ── */
        @media (max-height: 840px) and (min-width: 961px) {
          .hp-hero { padding: 10px clamp(24px, 3vw, 48px) 6px; }
          .hp-eyebrow { margin-bottom: 9px; }
          .hp-h1 { font-size: clamp(32px, 3vw, 46px); margin-bottom: 11px; line-height: 1.04; }
          .hp-sub { margin-bottom: 16px; font-size: 14px; line-height: 1.5; }
          .hp-actions { margin-bottom: 9px; gap: 8px; }
          .hp-btn-primary, .hp-btn-secondary { height: 38px; }
          .hp-note { font-size: 12px; }
          .hp-what { margin-top: 10px; }
          .hp-what-item { padding: 6px 12px; }
          .hp-art img { max-height: calc(100dvh - 130px); }
        }

        /* ── Short-screen (720p) ─────────────────────── */
        @media (max-height: 780px) {
          .hp-art img { max-height: calc(100dvh - 120px); }
        }

        /* Desktop laptop: 14-inch screens with browser chrome/taskbar */
        @media (min-width: 961px) and (max-width: 1500px) and (max-height: 900px) {
          .hp-header {
            height: 54px;
          }

          .hp-hero {
            overflow: hidden;
            align-items: center;
            justify-content: center;
            padding: 8px 28px 4px;
          }

          .hp-stage {
            height: 100%;
            width: 100%;
            max-width: min(1220px, calc(100vw - 56px));
            grid-template-columns: minmax(340px, 390px) minmax(0, 1fr);
            column-gap: 0;
            align-items: center;
          }

          .hp-copy {
            max-width: 390px;
            padding-top: 0;
            transform: translateY(-8px);
          }

          .hp-eyebrow {
            margin-bottom: 9px;
            font-size: 9px;
            letter-spacing: 3px;
          }

          .hp-h1 {
            font-size: clamp(38px, 3.7vw, 50px);
            line-height: 1.04;
            margin-bottom: 12px;
          }

          .hp-sub {
            font-size: 14px;
            line-height: 1.52;
            margin-bottom: 17px;
            max-width: 380px;
          }

          .hp-actions {
            margin-bottom: 10px;
            gap: 8px;
          }

          .hp-btn-primary,
          .hp-btn-secondary {
            height: 38px;
            font-size: 9px;
            letter-spacing: 1.8px;
          }

          .hp-btn-primary {
            padding: 0 24px;
          }

          .hp-btn-secondary {
            padding: 0 20px;
          }

          .hp-note {
            font-size: 12px;
          }

          .hp-what {
            margin-top: 12px;
          }

          .hp-art {
            justify-content: center;
            align-items: flex-start;
            overflow: visible;
          }

          .hp-art-inner {
            transform: translateX(-56px);
          }

          .hp-art img {
            width: clamp(700px, 60vw, 820px);
            max-height: calc(100dvh - 118px);
          }
        }

        /* ── Responsive: tablet ─────────────────────── */
        @media (max-width: 960px) {
          .hp-hero { overflow-y: auto; align-items: flex-start; padding: 0; }
          .hp-stage { grid-template-columns: 1fr; grid-template-rows: auto auto; column-gap: 0; }
          .hp-copy { max-width: 100%; padding: 20px 28px 12px; }
          .hp-art { align-items: center; padding: 0 28px 20px; }
          .hp-art img { width: min(75vw, 380px); max-height: 280px; }
        }

        /* ── Responsive: mobile ─────────────────────── */
        @media (max-width: 580px) {
          .hp-header { padding: 0 16px; }
          .hp-logo { width: min(160px,44vw); }
          .hp-nav a { padding: 0 8px; font-size: 8px; letter-spacing: 1.5px; }
          .hp-copy { padding: 16px 18px 10px; }
          .hp-art { padding: 0 18px 16px; }
          .hp-art img { width: min(82vw, 300px); max-height: 220px; }
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
        <img src="/logo.png" alt="katanapdf — Free PDF Editor" className="hp-logo" />
        <nav className="hp-nav">
          {NAV.map(([label, href]) => (
            <a key={label} href={href} onClick={e => { e.preventDefault(); nav(href); }}>{label}</a>
          ))}
        </nav>
      </header>


      {/* ── Hero: copy | samurai ── */}
      <section className="hp-hero">
      <div className="hp-stage">
        <div className="hp-copy">
          <div className="hp-eyebrow">100% Free · No Account · No Upload</div>
          <h1 className="hp-h1">
            Free PDF Editor.<br />
            <em>Runs in your Browser.</em>
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
      </div>
      </section>

      <Footer navigate={nav} />
    </div>
  );
}
