import { useState } from "react";
import Footer from "./ui/Footer";
import { CINZEL, FELL, LACQUER, hiddenFileInput, C } from "./utils/constant";

function use4KZoom() {
  if (typeof window === "undefined") return 1;
  const screenW = window.screen?.width || window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  return screenW * dpr >= 2560 ? 1.3 : 1;
}

const FEATURES = [
  { icon: "✎", label: "Edit Text", detail: "Click any text block to edit it in place. Font, size and colour are pre-filled automatically." },
  { icon: "＋", label: "Add Text & Images", detail: "Place new text boxes or images anywhere on the page." },
  { icon: "✦", label: "Sign & Draw", detail: "Draw your signature or annotate freehand with the built-in pen." },
  { icon: "⇄", label: "Merge & Reorder", detail: "Combine PDFs, reorder and delete pages without any upload." },
];

const STEPS = [
  "Open your PDF — click the button above or drag a file onto this page.",
  "Edit text, add text boxes, images, signatures or shapes on any page.",
  "Download the finished PDF. Your file never leaves your device.",
];

const FAQ = [
  { q: "Is katanapdf really free?", a: "Yes. Every feature is free with no paid tier." },
  { q: "Are my files uploaded somewhere?", a: "No. The PDF is opened, edited and saved entirely inside your browser. We have no servers that receive your file." },
  { q: "Do I need an account?", a: "No. There is no sign-up, no email required, no tracking of who edits what." },
  { q: "What size of PDF can I edit?", a: "Any size your browser can handle — typically files up to a few hundred MB work fine on a modern computer." },
  { q: "Can I edit existing text in a PDF?", a: "Yes, if the PDF has a selectable text layer. Click any text block to edit it. Scanned PDFs won't have editable text, but you can still add new text and images on top." },
  { q: "Will the layout of my PDF break?", a: "katanapdf preserves the original page as a high-resolution image and overlays your edits on top, so the visual layout stays intact." },
];

export default function Homepage({ onFile, onDropFile, onCreateBlank, isDark, onToggleDark }) {
  const [dragOver, setDragOver] = useState(false);
  const zoom4k = use4KZoom();

  const onDragOver = (e) => { e.preventDefault(); if (!dragOver) setDragOver(true); };
  const onDragLeave = (e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) setDragOver(false); };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) onDropFile(f); };

  const divider = (
    <div style={{ display: "flex", alignItems: "center", gap: 20, margin: "56px auto 28px", maxWidth: 900, padding: "0 24px" }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontFamily: CINZEL, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: LACQUER, fontWeight: 600, whiteSpace: "nowrap", paddingLeft: 4 }}>
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );

  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
         style={{ minHeight: "100vh", background: C.bg, color: C.text, position: "relative", fontFamily: FELL, zoom: zoom4k }}>

      {/* Drop overlay */}
      {dragOver && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(139,26,26,0.1)",
                      border: `3px dashed ${LACQUER}`, display: "flex", alignItems: "center", justifyContent: "center",
                      pointerEvents: "none" }}>
          <div style={{ background: C.bg, padding: "20px 40px", color: LACQUER, fontFamily: CINZEL, fontSize: 16, letterSpacing: 4, textTransform: "uppercase", border: `1px solid ${LACQUER}` }}>
            Drop your PDF or image here
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ padding: "0 24px", maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ height: 1 }} />
        <div style={{ display: "flex", alignItems: "center", overflow: "hidden", height: 64 }}>
          <img src="/logo.png" alt="katanapdf" style={{ width: "min(320px, 60vw)", height: "auto", display: "block" }} />
        </div>
        <button
          onClick={onToggleDark}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, cursor: "pointer", width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}
        >
          {isDark ? "☀" : "☾"}
        </button>
      </header>

      {/* Red hairline — the katana cut */}
      <div style={{ height: 1, background: LACQUER, opacity: 0.7 }} />

      {/* Trust badges */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap", padding: "14px 24px 0" }}>
        {["100% Free", "No Upload", "No Sign-Up", "No Watermark"].map(t => (
          <span key={t} style={{ border: `1px solid rgba(139,26,26,0.35)`, padding: "4px 12px", color: LACQUER, fontFamily: CINZEL, fontSize: 10, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, borderRadius: 2 }}>{t}</span>
        ))}
      </div>

      {/* Hero */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "36px 24px 40px", textAlign: "center" }}>
        <h1 style={{ fontFamily: CINZEL, fontSize: "clamp(22px, 3.5vw, 38px)", fontWeight: 600, letterSpacing: 1, color: C.text, margin: "0 0 14px", lineHeight: 1.25, maxWidth: 640 }}>
          Free PDF Editor — Runs in Your Browser
        </h1>
        <p style={{ marginTop: 0, marginBottom: 32, fontSize: 17, fontFamily: FELL, color: C.textMuted, maxWidth: 520, lineHeight: 1.6 }}>
          Edit, annotate, sign and merge PDFs without uploading anything. No account. No watermark.
        </p>

        <label style={{
          display: "inline-block", padding: "16px 56px", background: LACQUER, color: "#fff",
          cursor: "pointer", fontFamily: CINZEL, fontSize: 15, letterSpacing: 3, textTransform: "uppercase",
          fontWeight: 700, borderRadius: 2, lineHeight: 1, boxShadow: "0 2px 12px rgba(139,26,26,0.25)",
          transition: "box-shadow 0.15s",
        }}>
          Open PDF or Image
          <input type="file" accept="application/pdf,.pdf,image/*" onChange={onFile} style={hiddenFileInput} />
        </label>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <button onClick={onCreateBlank} style={{ background: "transparent", border: "none", color: LACQUER, fontFamily: FELL, fontSize: 14, cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationColor: "rgba(139,26,26,0.4)" }}>
            Create a blank PDF
          </button>
          <span style={{ fontFamily: FELL, fontSize: 13, color: C.textMuted, fontStyle: "italic" }}>
            or drag a file anywhere on this page
          </span>
          <p style={{ fontFamily: FELL, fontSize: 13, color: C.textMuted, margin: "4px 0 0", lineHeight: 1.5, maxWidth: 400 }}>
            Your PDF never leaves your device. Everything runs locally in your browser.
          </p>
        </div>
      </section>

      {/* Red hairline */}
      <div style={{ height: 1, background: LACQUER, opacity: 0.12, maxWidth: 900, margin: "0 auto" }} />

      {/* What you can do */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 8px" }}>
        <h2 style={{ fontFamily: CINZEL, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: LACQUER, fontWeight: 600, textAlign: "center", marginBottom: 28 }}>What you can do</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(196px, 100%), 1fr))", gap: 16 }}>
          {FEATURES.map((f) => (
            <div key={f.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${LACQUER}`, padding: "18px 20px", borderRadius: 4 }}>
              <span style={{ fontFamily: CINZEL, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: LACQUER, fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label}</span>
              <span style={{ fontFamily: FELL, fontSize: 13, color: C.textMuted, lineHeight: 1.5, display: "block" }}>{f.detail}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 8px" }}>
        <h2 style={{ fontFamily: CINZEL, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: LACQUER, fontWeight: 600, textAlign: "center", marginBottom: 28 }}>How it works</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, background: C.card, border: `1px solid ${C.border}`, padding: "14px 20px", borderRadius: 4 }}>
              <span style={{ fontFamily: CINZEL, fontSize: 28, color: `rgba(139,26,26,0.2)`, fontWeight: 700, flexShrink: 0, minWidth: 28, textAlign: "center", lineHeight: 1 }}>{i + 1}</span>
              <span style={{ fontFamily: FELL, fontSize: 15, lineHeight: 1.55, color: C.text }}>{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 900, margin: "48px auto 0", padding: "0 24px 64px" }}>
        <h2 style={{ fontFamily: CINZEL, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: LACQUER, fontWeight: 600, textAlign: "center", marginBottom: 28 }}>Frequently asked questions</h2>
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {FAQ.map((f, i) => (
            <details key={i} style={{ borderBottom: `1px solid ${C.border}`, padding: "0" }}>
              <summary style={{ cursor: "pointer", fontFamily: CINZEL, fontWeight: 600, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: C.text, padding: "16px 4px", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {f.q}
                <span style={{ color: LACQUER, fontSize: 16, flexShrink: 0 }}>+</span>
              </summary>
              <p style={{ margin: "0 0 16px 4px", fontFamily: FELL, fontSize: 15, lineHeight: 1.6, color: C.textMuted }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
