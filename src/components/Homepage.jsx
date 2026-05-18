import { useState } from "react";
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
      style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column", color: INK, fontFamily: FELL }}
    >
      <style>{`
        .hp {
          background:
            linear-gradient(to bottom, rgba(255,252,246,0.78) 0%, rgba(255,252,246,0.82) 100%),
            url("/background.png") center top / cover no-repeat;
        }

        /* ── Header ──────────────────────────────────── */
        .hp-header {
          position: sticky; top: 0; z-index: 50; flex-shrink: 0;
          background: rgba(255,253,248,0.92);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid ${LINE};
          height: 60px;
          display: flex; align-items: center;
          padding: 0 36px;
        }
        .hp-header-spacer { flex: 1; }
        .hp-logo { width: min(200px,44vw); height: auto; display: block; }
        .hp-nav { flex: 1; display: flex; align-items: center; justify-content: flex-end; }
        .hp-nav a {
          font-family: ${CINZEL}; font-size: 9px; letter-spacing: 2.5px;
          text-transform: uppercase; font-weight: 700;
          color: rgba(24,19,13,0.5); text-decoration: none;
          padding: 0 14px; border-right: 1px solid ${LINE};
          transition: color .13s;
        }
        .hp-nav a:last-child { border-right: none; }
        .hp-nav a:hover { color: ${RED}; }

        /* ── Hero: flex:1 fills remaining height in flex-column root ── */
        .hp-hero {
          flex: 1; min-height: 0; overflow: visible;
          display: flex; align-items: flex-start; justify-content: center;
          padding: clamp(28px,4vh,56px) clamp(28px,4.5vw,72px) clamp(18px,2.8vh,28px);
          box-sizing: border-box;
        }

        /* ── Stage ────────────────────────────────────── */
        .hp-stage {
          width: 100%; max-width: 1300px;
          display: grid;
          grid-template-columns: minmax(0, 400px) minmax(0, 1fr);
          column-gap: clamp(28px, 3.5vw, 56px);
          align-items: flex-start;
        }

        /* ── Copy ─────────────────────────────────────── */
        .hp-copy {
          display: flex; flex-direction: column;
          justify-content: center;
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

        /* ── What you can do ─────────────────────────── */
        .hp-what { margin-top: 18px; position: relative; }
        .hp-what-btn {
          display: inline-flex; align-items: center; gap: 7px;
          background: none; border: none; padding: 0;
          font-family: ${CINZEL}; font-size: 8.5px; letter-spacing: 2px;
          text-transform: uppercase; font-weight: 800;
          color: ${RED}; cursor: pointer; position: relative;
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
          content: ""; position: absolute; top: 100%; left: 14px;
          border: 4px solid transparent; border-top-color: ${INK};
        }
        .hp-what-btn:hover .hp-what-btn-hint { visibility: visible; opacity: 1; }
        .hp-what-chevron { transition: transform 0.2s; display: block; flex-shrink: 0; }
        .hp-what-chevron.open { transform: rotate(180deg); }
        .hp-what-list {
          position: absolute; top: calc(100% + 6px); left: 0;
          width: 300px; z-index: 200;
          border: 1px solid ${LINE}; border-radius: 4px;
          background: rgba(255,253,248,0.97);
          box-shadow: 0 6px 22px rgba(40,24,8,0.10);
          backdrop-filter: blur(8px);
          max-height: 55vh; overflow-y: auto;
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
        .hp-what-item:last-child  { border-radius: 0 0 4px 4px; }
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
        .hp-what-tooltip {
          visibility: hidden; opacity: 0;
          position: absolute; left: calc(100% + 10px); top: 50%;
          transform: translateY(-50%);
          background: ${INK}; color: rgba(255,253,248,0.92);
          font-family: ${FELL}; font-size: 11px; line-height: 1.45;
          padding: 7px 11px; border-radius: 4px;
          width: 200px; pointer-events: none; z-index: 300;
          transition: opacity 0.15s; white-space: normal;
        }
        .hp-what-tooltip::after {
          content: ""; position: absolute;
          right: 100%; top: 50%; transform: translateY(-50%);
          border: 5px solid transparent; border-right-color: ${INK};
        }
        .hp-what-item:hover .hp-what-tooltip { visibility: visible; opacity: 1; }

        /* ── Copy: sits above art layer so samurai can never touch buttons ── */
        .hp-copy { position: relative; z-index: 2; }

        /* ── Copy above art; art width-constrained so it never bleeds left ── */
        .hp-art {
          display: flex; align-items: flex-start; justify-content: flex-end;
          min-width: 0; position: relative; z-index: 1;
          overflow: visible; background: transparent;
        }
        .hp-art::after  { display: none !important; content: none !important; }
        .hp-art-inner {
          width: 100%;
          display: flex; align-items: flex-start; justify-content: flex-end;
          position: relative; background: transparent; box-shadow: none;
          overflow: visible;
          transform: translateX(24px);
        }
        .hp-art-inner::after { display: none !important; content: none !important; }
        .hp-art img {
          display: block;
          width: clamp(300px, 58vw, 980px);
          max-width: 100%;
          height: auto;
          max-height: calc(100dvh - 120px);
          object-fit: contain;
          background: transparent;
          border: 0 !important;
          box-shadow: none !important;
          outline: 0 !important;
          filter: none;
          opacity: 1;
          mix-blend-mode: normal;
        }

        /* ── Copyright bar ────────────────────────────── */
        .hp-copyright-bar {
          flex-shrink: 0; height: 26px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; color: rgba(24,19,13,0.30);
          font-family: ${FELL};
          border-top: 1px solid ${LINE};
          background: rgba(255,253,248,0.60);
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

        /* ── Large desktop / 4K ──────────────────────── */
        @media (min-width: 1800px) and (min-height: 900px) {
          .hp-header { height: 72px; padding: 0 56px; }
          .hp-logo { width: 230px; }
          .hp-nav a { font-size: 10px; letter-spacing: 2.8px; padding: 0 17px; }
          .hp-hero {
            min-height: calc(100dvh - 72px);
            padding: clamp(60px,10vh,140px) clamp(90px,7vw,170px) clamp(42px,5vh,78px);
            align-items: flex-start; justify-content: center;
          }
          .hp-stage {
            max-width: min(1880px, calc(100vw - 220px));
            grid-template-columns: minmax(520px,620px) minmax(0,1fr);
            column-gap: clamp(36px,2.5vw,72px);
            align-items: flex-start;
          }
          .hp-copy { max-width: 600px; }
          .hp-eyebrow { font-size: 11px; letter-spacing: 4px; margin-bottom: 20px; }
          .hp-eyebrow::before, .hp-eyebrow::after { width: 28px; }
          .hp-h1 { font-size: clamp(68px,3.6vw,92px); line-height: 1.02; margin-bottom: 22px; letter-spacing: -1.2px; }
          .hp-sub { font-size: 19px; line-height: 1.62; max-width: 560px; margin-bottom: 32px; }
          .hp-actions { gap: 15px; margin-bottom: 20px; }
          .hp-btn-primary, .hp-btn-secondary { height: 52px; font-size: 11px; letter-spacing: 2.3px; }
          .hp-btn-primary { padding: 0 38px; }
          .hp-btn-secondary { padding: 0 32px; }
          .hp-note { font-size: 15px; }
          .hp-what { margin-top: 26px; }
          .hp-what-btn { font-size: 9.8px; letter-spacing: 2.5px; }
          .hp-art { justify-content: flex-start; }
          .hp-art-inner { transform: translateX(-20px) translateY(-18px); }
          .hp-art img { width: clamp(1150px,55vw,1520px); max-height: calc(100dvh - 150px); }
          .hp-copyright { bottom: 22px; font-size: 12px; }
        }

        /* ── Ultra-wide ───────────────────────────────── */
        @media (min-width: 2400px) {
          .hp-stage {
            max-width: min(2100px, calc(100vw - 280px));
            grid-template-columns: minmax(560px,680px) minmax(0,1fr);
            column-gap: clamp(90px,4.5vw,150px);
          }
          .hp-h1 { font-size: clamp(76px,3.3vw,104px); }
          .hp-sub { font-size: 20px; max-width: 610px; }
          .hp-art img { width: clamp(1350px,56vw,1700px); max-height: calc(100dvh - 160px); }
        }

        /* ── Short desktop (tight but no scroll) ─────── */
        @media (max-height: 840px) and (min-width: 961px) {
          .hp-hero { padding: 10px clamp(24px, 3vw, 48px) 6px; }
          .hp-eyebrow { margin-bottom: 9px; }
          .hp-h1 { font-size: clamp(32px, 3vw, 46px); margin-bottom: 11px; line-height: 1.04; }
          .hp-sub { margin-bottom: 16px; font-size: 14px; line-height: 1.5; }
          .hp-actions { margin-bottom: 9px; gap: 8px; }
          .hp-btn-primary, .hp-btn-secondary { height: 38px; }
          .hp-note { font-size: 12px; }
          .hp-art img { max-height: calc(100dvh - 100px); }
        }

        /* ── 14-inch laptop ───────────────────────────── */
        @media (min-width: 961px) and (max-width: 1500px) and (max-height: 900px) {
          .hp { height: auto !important; min-height: 100dvh; overflow: auto !important; }
          .hp-header { height: 54px; }
          .hp-hero {
            overflow: visible;
            align-items: flex-start; justify-content: center;
            padding: 20px 30px 14px;
            min-height: calc(100dvh - 54px);
          }
          .hp-what-list { top: calc(100% + 6px); bottom: auto; width: 360px; display: flex; flex-wrap: wrap; max-height: none; overflow: visible; }
          .hp-what-item { width: 50%; box-sizing: border-box; padding: 7px 10px; }
          .hp-what-tooltip { display: none !important; }
          .hp-stage {
            max-width: min(1280px, calc(100vw - 60px));
            grid-template-columns: minmax(340px, 395px) minmax(0, 1fr);
            column-gap: clamp(28px, 3vw, 48px);
            align-items: flex-start;
          }
          .hp-copy { max-width: 395px; }
          .hp-eyebrow { margin-bottom: 6px; font-size: 9px; letter-spacing: 3px; }
          .hp-h1 { font-size: clamp(28px, 3vw, 38px); line-height: 1.03; margin-bottom: 8px; }
          .hp-sub { font-size: 13px; line-height: 1.48; margin-bottom: 8px; max-width: 360px; }
          .hp-actions { margin-bottom: 5px; gap: 7px; }
          .hp-what { margin-top: 8px; }
          .hp-btn-primary, .hp-btn-secondary { height: 34px; font-size: 9px; letter-spacing: 1.8px; }
          .hp-btn-primary  { padding: 0 22px; }
          .hp-btn-secondary { padding: 0 18px; }
          .hp-note { font-size: 11px; }
          .hp-art-inner { transform: translateX(34px); }
          .hp-art img {
            width: min(64vw, 900px);
            height: auto;
            max-width: none;
            max-height: calc(100dvh - 100px);
            object-fit: contain;
            border: 0 !important;
            box-shadow: none !important;
            outline: 0 !important;
          }
        }

        /* ── Tablet ───────────────────────────────────── */
        @media (max-width: 960px) and (min-width: 581px) {
          .hp-hero { align-items: flex-start; padding: 0; overflow: visible; flex: none; min-height: calc(100dvh - 60px - 26px); }
          .hp-stage { grid-template-columns: 1fr; grid-template-rows: auto auto; column-gap: 0; align-items: start; }
          .hp-copy { max-width: 100%; padding: 20px 28px 12px; }
          .hp-art { justify-content: center; padding: 0 28px 20px; }
          .hp-art img { width: min(75vw, 380px); max-height: 280px; }
          .hp-art-inner { transform: none; }
        }

        /* ── Mobile trust strip + scroll cue (hidden on desktop/tablet) ── */
        .hp-mobile-trust { display: none; }
        .hp-scroll-cue { display: none; }
        @keyframes hp-cue-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.45; }
          50%       { transform: translateY(5px); opacity: 0.75; }
        }

        /* ── Mobile ───────────────────────────────────── */
        @media (max-width: 580px) {
          .hp {
            min-height: 100dvh;
            height: auto !important;
            overflow-x: hidden !important;
            overflow-y: visible !important;
            display: block !important;
            background:
              radial-gradient(circle at 50% 0%, rgba(139,26,26,0.045), transparent 34%),
              linear-gradient(to bottom, rgba(255,252,246,0.96), rgba(255,252,246,0.985)),
              url("/background.png") center top / cover no-repeat;
          }
          .hp-header {
            position: relative;
            height: auto; min-height: 64px;
            padding: 14px 18px 10px;
            display: flex; flex-direction: column; justify-content: center; gap: 9px;
            background: rgba(255,253,248,0.90);
            border-bottom: 1px solid rgba(116,86,44,0.14);
            backdrop-filter: blur(10px);
          }
          .hp-header-spacer { display: none; }
          .hp-logo { width: min(170px, 54vw); }
          .hp-nav { flex: none; width: 100%; justify-content: center; gap: 0; }
          .hp-nav a { font-size: 7px; letter-spacing: 1.4px; padding: 0 8px; color: rgba(24,19,13,0.46); }
          .hp-hero {
            min-height: auto; overflow: visible;
            display: block; padding: 36px 18px 34px; box-sizing: border-box;
          }
          .hp-stage { display: flex; flex-direction: column; width: 100%; max-width: 430px; margin: 0 auto; }
          .hp-copy { max-width: 100%; padding: 0; text-align: center; align-items: center; justify-content: flex-start; }
          .hp-eyebrow { justify-content: center; font-size: 8px; letter-spacing: 2.35px; gap: 7px; margin-bottom: 15px; }
          .hp-eyebrow::before, .hp-eyebrow::after { width: 18px; }
          .hp-h1 { font-size: clamp(38px, 12vw, 52px); line-height: 1.02; letter-spacing: -0.8px; margin: 0 0 16px; max-width: 350px; }
          .hp-sub { font-size: 14.5px; line-height: 1.58; max-width: 345px; margin: 0 0 24px; color: rgba(24,19,13,0.62); }
          .hp-actions { width: 100%; max-width: 345px; flex-direction: column; align-items: stretch; gap: 11px; margin-bottom: 13px; }
          .hp-btn-primary, .hp-btn-secondary { width: 100%; height: 52px; padding: 0 18px; font-size: 9.5px; letter-spacing: 1.9px; border-radius: 4px; }
          .hp-btn-primary { box-shadow: 0 14px 30px rgba(139,26,26,0.20); }
          .hp-note { font-size: 12.5px; margin: 0; color: rgba(24,19,13,0.48); }
          .hp-art { display: none !important; }
          .hp-copyright-bar { height: auto; min-height: 36px; padding: 8px 16px; }

          /* Trust strip */
          .hp-mobile-trust {
            display: flex;
            width: 100%; max-width: 345px;
            justify-content: center; gap: 0;
            margin: 20px 0 0;
            border: 1px solid rgba(116,86,44,0.16);
            background: rgba(255,253,248,0.72);
            border-radius: 999px;
            overflow: hidden;
            box-shadow: 0 8px 22px rgba(40,24,8,0.04);
          }
          .hp-mobile-trust span {
            flex: 1; text-align: center;
            padding: 9px 6px;
            font-family: ${CINZEL}; font-size: 7.2px; letter-spacing: 1.3px;
            text-transform: uppercase; font-weight: 800;
            color: rgba(139,26,26,0.82);
            border-right: 1px solid rgba(116,86,44,0.13);
          }
          .hp-mobile-trust span:last-child { border-right: none; }

          /* What you can do — mobile card list */
          .hp-what { width: 100%; max-width: 360px; margin-top: 28px; }
          .hp-what-btn {
            width: 100%; justify-content: center;
            font-size: 8.5px; letter-spacing: 2px;
            padding: 12px 0;
            border-top: 1px solid rgba(116,86,44,0.16);
            border-bottom: 1px solid rgba(116,86,44,0.16);
          }
          .hp-what-btn-hint { display: none !important; }
          .hp-what-list {
            position: static;
            width: 100%; margin-top: 12px;
            background: rgba(255,253,248,0.82);
            border: 1px solid rgba(116,86,44,0.16);
            border-radius: 8px;
            box-shadow: 0 12px 28px rgba(40,24,8,0.06);
            overflow: hidden;
            backdrop-filter: blur(8px);
          }
          .hp-what-item {
            display: grid;
            grid-template-columns: 24px 1fr;
            align-items: start;
            gap: 10px;
            padding: 13px 14px;
            border-bottom: 1px solid rgba(116,86,44,0.13);
          }
          .hp-what-item:last-child { border-bottom: none; }
          .hp-what-item::before { display: none; }
          .hp-what-icon { width: 22px; height: 22px; font-size: 13px; margin-top: 1px; }
          .hp-what-name { font-size: 8.5px; letter-spacing: 1.4px; line-height: 1.3; }
          .hp-what-tooltip {
            display: block !important; visibility: visible !important; opacity: 1 !important;
            position: static !important; transform: none !important;
            grid-column: 2;
            width: auto !important;
            background: transparent !important;
            color: rgba(24,19,13,0.56) !important;
            padding: 3px 0 0 !important;
            box-shadow: none !important;
            font-size: 12px !important; line-height: 1.42 !important;
            pointer-events: none;
          }
          .hp-what-tooltip::after { display: none !important; }

          /* Scroll cue */
          .hp-scroll-cue {
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            margin-top: 26px; color: rgba(24,19,13,0.38);
            font-family: ${CINZEL}; font-size: 7px; letter-spacing: 2px;
            text-transform: uppercase;
            animation: hp-cue-bounce 2.2s ease-in-out infinite;
          }
        }

        /* ── Very small phones ────────────────────────── */
        @media (max-width: 380px) {
          .hp-header { padding-left: 12px; padding-right: 12px; }
          .hp-nav a { font-size: 6.8px; padding: 0 6px; letter-spacing: 1.1px; }
          .hp-hero { padding-left: 16px; padding-right: 16px; }
          .hp-h1 { font-size: 36px; }
          .hp-sub { font-size: 14px; }
          .hp-btn-primary, .hp-btn-secondary { height: 50px; }
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

      {/* ── Hero ── */}
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

            <div className="hp-mobile-trust" aria-label="katanapdf privacy promises">
              <span>No upload</span>
              <span>No account</span>
              <span>No watermark</span>
            </div>

            <div className="hp-scroll-cue" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              scroll for features
            </div>

            <div className="hp-what">
              <button className="hp-what-btn" onClick={() => setFeatOpen(v => !v)} title="">
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
              <img src="/samurai.png?v=4" alt="" draggable={false} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Copyright bar ── */}
      <footer className="hp-copyright-bar">
        © 2026 katanapdf — Free PDF editor in your browser.
      </footer>

      {/* Hidden internal links for crawlers */}
      <nav aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0, pointerEvents: "none" }}>
        <a href="/edit-pdf">Edit PDF</a>
        <a href="/merge-pdf">Merge PDF</a>
        <a href="/split-pdf">Split PDF</a>
        <a href="/sign-pdf">Sign PDF</a>
        <a href="/annotate-pdf">Annotate PDF</a>
        <a href="/image-to-pdf">Image to PDF</a>
        <a href="/reorder-pdf">Reorder Pages</a>
        <a href="/about">About</a>
        <a href="/faqs">FAQs</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>
    </div>
  );
}
