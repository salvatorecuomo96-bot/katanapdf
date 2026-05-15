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
  { icon: "✎", label: "Edit Text",         detail: "Click any text block to edit it in place. Font, size and colour are pre-filled automatically." },
  { icon: "＋", label: "Add Text & Images", detail: "Place new text boxes or images anywhere on the page." },
  { icon: "✦", label: "Sign & Draw",        detail: "Draw your signature or annotate freehand with the built-in pen." },
  { icon: "⇄", label: "Merge & Reorder",   detail: "Combine PDFs, reorder and delete pages without any upload." },
];

const STEPS = [
  "Open your PDF — click the button above or drag a file onto this page.",
  "Edit text, add text boxes, images, signatures or shapes on any page.",
  "Download the finished PDF. Your file never leaves your device.",
];

const FAQ = [
  { q: "Is katanapdf really free?",           a: "Yes. Every feature is free with no paid tier." },
  { q: "Are my files uploaded somewhere?",    a: "No. The PDF is opened, edited and saved entirely inside your browser. We have no servers that receive your file." },
  { q: "Do I need an account?",               a: "No. There is no sign-up, no email required, no tracking of who edits what." },
  { q: "What size of PDF can I edit?",        a: "Any size your browser can handle — typically files up to a few hundred MB work fine on a modern computer." },
  { q: "Can I edit existing text in a PDF?",  a: "Yes, if the PDF has a selectable text layer. Click any text block to edit it. Scanned PDFs won't have editable text, but you can still add new text and images on top." },
  { q: "Will the layout of my PDF break?",    a: "katanapdf preserves the original page as a high-resolution image and overlays your edits on top, so the visual layout stays intact." },
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
      style={{ minHeight: "100vh", color: INK, fontFamily: FELL, zoom: zoom4k }}
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
          height: 68px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 32px;
        }
        .hp-logo { width: min(240px,52vw); height: auto; display: block; }

        /* ── Hero ─────────────────────────────────── */
        .hp-hero {
          max-width: 1240px; margin: 0 auto;
          padding: 64px 48px 52px;
          display: grid;
          grid-template-columns: 1fr minmax(0, 540px);
          align-items: center;
          gap: 32px;
          min-height: 580px;
        }
        .hp-copy { max-width: 580px; }
        .hp-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: ${CINZEL}; font-size: 10px; letter-spacing: 3.5px;
          text-transform: uppercase; color: ${RED}; font-weight: 700;
          margin-bottom: 22px;
        }
        .hp-eyebrow::before, .hp-eyebrow::after {
          content: ""; display: inline-block;
          width: 28px; height: 1px; background: ${RED};
        }
        .hp-h1 {
          font-family: ${FELL};
          font-size: clamp(48px, 5.4vw, 82px);
          line-height: 1.06; letter-spacing: -1.5px;
          color: ${INK}; font-weight: 600;
          margin: 0 0 22px;
        }
        .hp-h1 em { font-style: normal; color: ${RED}; }
        .hp-sub {
          font-size: 17.5px; line-height: 1.68;
          color: ${MUTED}; margin: 0 0 36px;
          max-width: 460px;
        }
        .hp-actions {
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
          margin-bottom: 26px;
        }
        .hp-btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          height: 52px; padding: 0 36px;
          background: ${RED}; color: #fff;
          font-family: ${CINZEL}; font-size: 11.5px; letter-spacing: 2.5px;
          text-transform: uppercase; font-weight: 800;
          border: none; border-radius: 3px; cursor: pointer;
          box-shadow: 0 14px 30px rgba(139,26,26,0.22);
          transition: transform .13s, box-shadow .13s;
        }
        .hp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 20px 38px rgba(139,26,26,0.28); }
        .hp-btn-secondary {
          display: inline-flex; align-items: center; justify-content: center;
          height: 52px; padding: 0 32px;
          background: transparent; color: ${RED};
          font-family: ${CINZEL}; font-size: 11.5px; letter-spacing: 2.5px;
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
        .hp-art::before {
          content: "";
          position: absolute; inset: -20px;
          background: radial-gradient(ellipse 70% 80% at 55% 50%, rgba(139,26,26,0.07), transparent 68%);
          pointer-events: none;
        }
        .hp-art img {
          width: 100%; max-width: 520px; height: auto;
          object-fit: contain;
          filter: drop-shadow(0 28px 48px rgba(20,10,4,0.18));
          position: relative; z-index: 1;
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
          padding: 20px 28px;
          border-right: 1px solid ${LINE};
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 7px;
        }
        .hp-badge:last-child { border-right: none; }
        .hp-badge-icon { font-size: 22px; line-height: 1; }
        .hp-badge-label {
          font-family: ${CINZEL}; font-size: 10.5px; letter-spacing: 2px;
          text-transform: uppercase; font-weight: 800; color: ${INK};
        }
        .hp-badge-sub {
          font-size: 12.5px; color: ${MUTED}; line-height: 1.4;
        }

        /* ── Sections ─────────────────────────────────── */
        .hp-section {
          max-width: 1100px; margin: 0 auto; padding: 76px 42px 0;
        }
        .hp-section-last { padding-bottom: 80px; }
        .hp-heading {
          text-align: center; margin: 0 0 40px;
        }
        .hp-heading span {
          font-family: ${CINZEL}; font-size: 10.5px; letter-spacing: 4.5px;
          text-transform: uppercase; font-weight: 800; color: ${RED};
        }
        .hp-heading-bar {
          width: 36px; height: 2.5px; background: ${RED};
          border-radius: 2px; margin: 10px auto 0;
        }

        /* ── Feature cards ────────────────────────────── */
        .hp-features {
          display: grid; grid-template-columns: repeat(4,1fr); gap: 16px;
        }
        .hp-feat {
          background: rgba(255,253,248,0.78);
          border: 1px solid ${LINE};
          border-radius: 4px;
          padding: 26px 20px 22px;
          position: relative; overflow: hidden;
          box-shadow: 0 12px 32px rgba(40,24,8,0.05);
        }
        .hp-feat::after {
          content: ""; position: absolute;
          top: 0; left: 0; right: 0; height: 2.5px;
          background: linear-gradient(90deg, ${RED}, ${GOLD});
        }
        .hp-feat-icon {
          width: 44px; height: 44px;
          background: rgba(139,26,26,0.06);
          border: 1px solid rgba(139,26,26,0.18);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; color: ${RED};
          margin-bottom: 16px;
        }
        .hp-feat-label {
          display: block;
          font-family: ${CINZEL}; font-size: 11px;
          letter-spacing: 1.8px; text-transform: uppercase;
          font-weight: 800; color: ${INK}; margin-bottom: 10px;
        }
        .hp-feat-detail {
          display: block; font-size: 13.5px;
          color: ${MUTED}; line-height: 1.55;
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
            padding: 40px 28px 36px;
            min-height: auto;
          }
          .hp-art { order: -1; min-height: 300px; }
          .hp-art img { max-width: min(88vw, 440px); }
          .hp-copy { max-width: 100%; }
          .hp-trust-inner { grid-template-columns: repeat(2,1fr); }
          .hp-badge:nth-child(2) { border-right: none; }
          .hp-badge:nth-child(1),
          .hp-badge:nth-child(2) { border-bottom: 1px solid ${LINE}; }
          .hp-features { grid-template-columns: repeat(2,1fr); }
          .hp-section { padding-left: 28px; padding-right: 28px; }
        }

        @media (max-width: 580px) {
          .hp-header { height: 58px; padding: 0 18px; }
          .hp-logo { width: min(200px,64vw); }
          .hp-hero { padding: 28px 18px 32px; }
          .hp-art { min-height: 220px; }
          .hp-art img { max-width: min(94vw, 340px); }
          .hp-h1 { font-size: clamp(40px,13vw,56px); letter-spacing: -0.8px; }
          .hp-sub { font-size: 16px; }
          .hp-actions { flex-direction: column; align-items: stretch; gap: 10px; }
          .hp-btn-primary, .hp-btn-secondary { width: 100%; height: 50px; }
          .hp-trust-inner { grid-template-columns: 1fr; }
          .hp-badge { border-right: none; border-bottom: 1px solid ${LINE}; }
          .hp-badge:last-child { border-bottom: none; }
          .hp-features { grid-template-columns: 1fr; gap: 12px; }
          .hp-section { padding-left: 18px; padding-right: 18px; padding-top: 52px; }
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
        <img src="/logo.png" alt="katanapdf" className="hp-logo" />
      </header>

      {/* ── Hero ── */}
      <section className="hp-hero">
        <div className="hp-copy">
          <div className="hp-eyebrow">Free PDF Editor</div>
          <h1 className="hp-h1">
            Edit PDFs.<br />
            <em>Right in your<br />browser.</em>
          </h1>
          <p className="hp-sub">
            Annotate, sign, merge and reorder PDFs without uploading a single byte.
            No account. No watermark. No catch.
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
      <section className="hp-section">
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

      {/* ── How it works ── */}
      <section className="hp-section">
        <div className="hp-heading">
          <span>How it works</span>
          <div className="hp-heading-bar" />
        </div>
        <div className="hp-steps">
          {STEPS.map((s, i) => (
            <div className="hp-step" key={i}>
              <span className="hp-step-num">{i + 1}</span>
              <span className="hp-step-text">{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="hp-section hp-section-last">
        <div className="hp-heading">
          <span>Frequently asked questions</span>
          <div className="hp-heading-bar" />
        </div>
        <div className="hp-faq-wrap">
          {FAQ.map((f, i) => (
            <details className="hp-faq-item" key={i}>
              <summary className="hp-faq-summary">
                {f.q}
                <span className="hp-faq-plus">+</span>
              </summary>
              <p className="hp-faq-answer">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
