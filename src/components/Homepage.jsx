import { useState } from "react";
import SectionDivider from "./ui/SectionDivider";
import StampTag from "./ui/StampTag";
import Footer from "./ui/Footer";
import { CINZEL, CROSSHATCH, FELL, GOLD, hiddenFileInput, INK, LACQUER, PARCHMENT, PARCHMENT_2 } from "./utils/constant";

// Detect 4K screens (physical pixel width ≥ 2560) for homepage zoom
function use4KZoom() {
  if (typeof window === "undefined") return 1;
  const screenW = window.screen?.width || window.innerWidth;
  const dpr = window.devicePixelRatio || 1;
  const physicalW = screenW * dpr;
  return physicalW >= 2560 ? 1.3 : 1;
}

export default function Homepage({ onFile, onDropFile, onCreateBlank }) {
  const [dragOver, setDragOver] = useState(false);
  const zoom4k = use4KZoom();

  const onDragOver = (e) => { e.preventDefault(); if (!dragOver) setDragOver(true); };
  const onDragLeave = (e) => {
    if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) setDragOver(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) onDropFile(f);
  };

  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
         style={{ minHeight: "100vh", background: PARCHMENT, backgroundImage: CROSSHATCH, color: INK, position: "relative", fontFamily: FELL, zoom: zoom4k }}>
      {dragOver && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(139,26,26,0.18)",
                      border: `4px dashed ${LACQUER}`, display: "flex", alignItems: "center", justifyContent: "center",
                      pointerEvents: "none" }}>
          <div style={{ background: PARCHMENT, padding: "20px 40px", color: LACQUER, fontFamily: CINZEL, fontSize: 18, letterSpacing: 4, textTransform: "uppercase", border: `1px solid ${GOLD}`, outline: `1px solid ${LACQUER}`, outlineOffset: 4 }}>
            Drop your PDF or image here
          </div>
        </div>
      )}

      {/* HEADER - compact logo + trust badges. Logo PNG has lots of internal
          transparent padding; wrap in a fixed-height overflow:hidden box so
          the visible content fills the strip instead of leaving empty
          parchment around it. */}
      <header style={{ padding: "6px 20px 0", textAlign: "center" }}>
        <div style={{ height: 1, background: LACQUER, maxWidth: 1600, margin: "0 auto", opacity: 0.5 }} />
        <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <img src="/logo.png" alt="katanapdf" style={{ width: "min(540px, 90vw)", height: "auto", display: "block" }} />
        </div>
        <div style={{ height: 1, background: LACQUER, maxWidth: 1600, margin: "0 auto 8px", opacity: 0.5 }} />
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}>
          <StampTag>100% Free</StampTag>
          <StampTag>No Upload</StampTag>
          <StampTag>No Sign-Up</StampTag>
          <StampTag>No Watermark</StampTag>
        </div>
      </header>

      {/* HERO - H1 headline + CTA */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 28px", textAlign: "center" }}>
        <h1 style={{
          fontFamily: FELL, fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 500,
          letterSpacing: 0, color: INK, margin: "0 0 12px", lineHeight: 1.3, maxWidth: 620,
        }}>
          Free PDF editor that runs in your browser
        </h1>
        <p style={{
          marginTop: 0, marginBottom: 26, fontSize: 17, fontFamily: FELL,
          color: "rgba(26,18,8,0.75)", maxWidth: 540, lineHeight: 1.55,
        }}>
          Edit PDFs without uploading files. No account, no watermark, no artificial limits.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <label style={{
            display: "inline-block", padding: "17px 68px", background: LACQUER, color: PARCHMENT, cursor: "pointer",
            fontFamily: CINZEL, fontSize: 17, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700,
            border: `1px solid ${GOLD}`, outline: `1px solid ${LACQUER}`, outlineOffset: 5,
            lineHeight: 1,
          }}>
            Open PDF or Image
            <input type="file" accept="application/pdf,.pdf,image/*" onChange={onFile} style={hiddenFileInput} />
          </label>
          <button onClick={onCreateBlank} style={{
            background: "transparent", border: "none", color: LACQUER, fontFamily: FELL, fontSize: 15,
            cursor: "pointer", padding: "4px 0", textDecoration: "underline",
          }}>
            Create a blank PDF
          </button>
          <span style={{ fontFamily: FELL, fontSize: 13, color: "rgba(26,18,8,0.5)", fontStyle: "italic" }}>
            or drag a PDF or image anywhere on this page
          </span>
          <p style={{
            fontFamily: FELL, fontSize: 13, color: "rgba(26,18,8,0.5)",
            margin: "6px 0 0", lineHeight: 1.5, maxWidth: 420,
          }}>
            Your PDF never leaves your device. Everything runs locally in your browser.
          </p>
        </div>
      </section>

      {/* WHAT YOU CAN DO */}
      <SectionDivider label="What you can do" />
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 12 }}>
          {[
            { label: "Edit text", detail: "Click any text block to edit it in place." },
            { label: "Add text & images", detail: "Place new text boxes or images anywhere on the page." },
            { label: "Sign & draw", detail: "Draw your signature or annotate freehand." },
            { label: "Merge & reorder", detail: "Combine PDFs, reorder and delete pages." },
          ].map((cap, i) => (
            <div key={i} style={{ background: PARCHMENT_2, border: `1px solid rgba(139,26,26,0.15)`, padding: "14px 18px" }}>
              <span style={{ display: "block", fontFamily: CINZEL, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: LACQUER, fontWeight: 600, marginBottom: 5 }}>
                {cap.label}
              </span>
              <span style={{ fontFamily: FELL, fontSize: 13, color: "rgba(26,18,8,0.68)", lineHeight: 1.4 }}>
                {cap.detail}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW TO EDIT */}
      <SectionDivider label="How it works" />
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Open your PDF — click the button above or drag a file onto this page.",
            "Edit text, add text boxes, images, signatures, or shapes on any page.",
            "Download the finished PDF. Your file never leaves your device.",
          ].map((s, i) => (
            <div key={i} style={{ background: PARCHMENT_2, border: `1px solid rgba(139,26,26,0.15)`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontFamily: CINZEL, fontSize: 32, color: "rgba(139,26,26,0.18)", lineHeight: 1, fontWeight: 700, flexShrink: 0, minWidth: 32, textAlign: "center" }}>{i + 1}</span>
              <span style={{ fontFamily: FELL, fontSize: 15, lineHeight: 1.5, color: INK }}>{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <SectionDivider label="Frequently asked questions" />
      <section style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px 56px" }}>
        {[
          { q: "Is katanapdf really free?", a: "Yes. Every feature is free with no paid tier." },
          { q: "Are my files uploaded somewhere?", a: "No. The PDF is opened, edited, and saved entirely inside your browser. We have no servers that receive your file." },
          { q: "Do I need an account?", a: "No. There is no sign-up, no email required, no tracking of who edits what." },
          { q: "What size of PDF can I edit?", a: "Any size your browser can handle - typically files up to a few hundred MB work fine on a modern computer." },
          { q: "Can I edit existing text in a PDF?", a: "Yes, if the PDF has a selectable text layer. Click any text block to edit it. PDFs that are scanned images or printed from a browser won't have editable text, but you can still add new text and images on top." },
          { q: "Will the layout of my PDF break?", a: "katanapdf preserves the original page as a high-resolution image and overlays your edits on top, so the visual layout stays intact." },
        ].map((f, i) => (
          <details key={i} style={{ background: PARCHMENT_2, padding: "14px 22px", marginBottom: 10, border: `1px solid rgba(139,26,26,0.25)` }}>
            <summary style={{ cursor: "pointer", fontFamily: CINZEL, fontWeight: 600, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: INK }}>{f.q}</summary>
            <p style={{ margin: "10px 0 0", fontFamily: FELL, fontSize: 15, lineHeight: 1.55, color: INK }}>{f.a}</p>
          </details>
        ))}
      </section>

      <Footer />
    </div>
  );
}

