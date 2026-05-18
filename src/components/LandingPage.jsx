import { useRef } from "react";
import Footer from "./ui/Footer";
import { CINZEL, FELL, INK } from "./utils/constant";
import { SEO_PAGES } from "../seo.js";

const RED = "#8B1A1A";
const MUTED = "rgba(24,19,13,0.58)";
const LINE = "rgba(116,86,44,0.18)";

const CONTENT = {
  "/edit-pdf": {
    h1: "Edit PDF Online Free",
    intro: "Click any text block in your PDF to edit it directly — change words, fix typos, adjust formatting. Add new text boxes, images and annotations anywhere on the page. Everything runs in your browser.",
    benefits: [
      "Edit existing text in PDFs with a selectable text layer",
      "Add new text boxes at any size and position",
      "Insert images and logos on any page",
      "Annotate with freehand drawing and shapes",
      "No upload — your file never leaves your device",
    ],
    steps: [
      { n: "1", t: "Open your PDF", d: "Click 'Open PDF or Image' or drag your file onto the page." },
      { n: "2", t: "Click to edit", d: "Click any text block on the page to start editing it." },
      { n: "3", t: "Add content", d: "Use the toolbar to add text, images, signatures or annotations." },
      { n: "4", t: "Download", d: "Click Download to save your edited PDF to your device." },
    ],
    related: [
      { label: "Sign PDF", href: "/sign-pdf" },
      { label: "Annotate PDF", href: "/annotate-pdf" },
      { label: "Merge PDF", href: "/merge-pdf" },
    ],
  },
  "/merge-pdf": {
    h1: "Merge PDF Files Free",
    intro: "Combine multiple PDF files or images into a single document directly in your browser. Drag to reorder pages, remove unwanted ones, then download the merged PDF. No upload, no account.",
    benefits: [
      "Merge unlimited PDFs and images into one document",
      "Drag pages into any order before saving",
      "Delete unwanted pages from the combined document",
      "Supports PDF and image files (JPG, PNG) together",
      "No upload — everything stays on your device",
    ],
    steps: [
      { n: "1", t: "Open your first PDF", d: "Click 'Open PDF or Image' to load your first document." },
      { n: "2", t: "Add more files", d: "Use the + button in the page sidebar to add more PDFs or images." },
      { n: "3", t: "Reorder pages", d: "Drag thumbnails in the sidebar to set the final page order." },
      { n: "4", t: "Download", d: "Click Download to save the merged PDF to your device." },
    ],
    related: [
      { label: "Split PDF", href: "/split-pdf" },
      { label: "Reorder Pages", href: "/reorder-pdf" },
      { label: "Edit PDF", href: "/edit-pdf" },
    ],
  },
  "/split-pdf": {
    h1: "Split PDF Online Free",
    intro: "Split a PDF into separate files directly in your browser. Choose which pages to extract or split into multiple documents. Your file never leaves your device.",
    benefits: [
      "Extract any range of pages into a new PDF",
      "Split a document into multiple separate files",
      "Delete and reorder pages before splitting",
      "Download each part instantly",
      "No upload — files stay on your device",
    ],
    steps: [
      { n: "1", t: "Open your PDF", d: "Click 'Open PDF or Image' to load the document you want to split." },
      { n: "2", t: "Choose Split PDF", d: "Click the split icon in the editor toolbar." },
      { n: "3", t: "Select pages or ranges", d: "Choose which pages go into each output file." },
      { n: "4", t: "Download", d: "Download each split PDF to your device." },
    ],
    related: [
      { label: "Merge PDF", href: "/merge-pdf" },
      { label: "Reorder Pages", href: "/reorder-pdf" },
      { label: "Edit PDF", href: "/edit-pdf" },
    ],
  },
  "/sign-pdf": {
    h1: "Sign PDF Online Free",
    intro: "Add your handwritten signature to any PDF directly in your browser. Draw your signature, type it, or upload an image of it. Place it anywhere on the page. No upload, no account.",
    benefits: [
      "Draw your signature with a mouse or touchscreen",
      "Type a signature in multiple font styles",
      "Upload an image of your existing signature",
      "Place and resize the signature anywhere on the page",
      "No upload — your document never leaves your device",
    ],
    steps: [
      { n: "1", t: "Open your PDF", d: "Click 'Open PDF or Image' to load the document to sign." },
      { n: "2", t: "Click Sign", d: "Click the Sign button in the editor toolbar." },
      { n: "3", t: "Create your signature", d: "Draw, type or upload your signature." },
      { n: "4", t: "Place and download", d: "Drag the signature to position it, then download your signed PDF." },
    ],
    related: [
      { label: "Edit PDF", href: "/edit-pdf" },
      { label: "Annotate PDF", href: "/annotate-pdf" },
      { label: "Merge PDF", href: "/merge-pdf" },
    ],
  },
  "/annotate-pdf": {
    h1: "Annotate PDF Online Free",
    intro: "Freehand draw, highlight, add shapes and annotate your PDF directly in your browser. Use the pencil tool for handwritten notes, the highlighter for emphasis, or add shapes to mark up any document.",
    benefits: [
      "Freehand pencil and highlighter tools",
      "Add circles, squares, lines and arrows",
      "Choose from multiple colours and stroke sizes",
      "Add text boxes anywhere on the page",
      "No upload — your file stays on your device",
    ],
    steps: [
      { n: "1", t: "Open your PDF", d: "Click 'Open PDF or Image' to load the document to annotate." },
      { n: "2", t: "Pick a tool", d: "Select Draw for freehand, or Shapes for circles, squares and arrows." },
      { n: "3", t: "Annotate", d: "Draw, highlight or add shapes anywhere on the page." },
      { n: "4", t: "Download", d: "Download your annotated PDF to your device." },
    ],
    related: [
      { label: "Sign PDF", href: "/sign-pdf" },
      { label: "Edit PDF", href: "/edit-pdf" },
      { label: "Merge PDF", href: "/merge-pdf" },
    ],
  },
  "/image-to-pdf": {
    h1: "Image to PDF Converter Free",
    intro: "Convert JPG or PNG images to PDF instantly in your browser. Open an image file and download it as a ready-to-share PDF. No upload, no account, no watermark.",
    benefits: [
      "Converts JPG, PNG and other common image formats",
      "Combine multiple images into a single PDF",
      "Edit, annotate or add text before downloading",
      "Download a clean PDF with no watermark",
      "No upload — conversion happens in your browser",
    ],
    steps: [
      { n: "1", t: "Open your image", d: "Click 'Open PDF or Image' and select your JPG or PNG file." },
      { n: "2", t: "Add more images (optional)", d: "Use + in the sidebar to add more images as additional pages." },
      { n: "3", t: "Edit if needed", d: "Add text, annotations or signatures before saving." },
      { n: "4", t: "Download as PDF", d: "Click Download to save your image as a PDF file." },
    ],
    related: [
      { label: "Merge PDF", href: "/merge-pdf" },
      { label: "Edit PDF", href: "/edit-pdf" },
      { label: "Sign PDF", href: "/sign-pdf" },
    ],
  },
  "/reorder-pdf": {
    h1: "Reorder PDF Pages Online Free",
    intro: "Drag and drop to rearrange pages in your PDF directly in your browser. Rotate, delete or add new pages, then download the result. No upload, no account, no watermark.",
    benefits: [
      "Drag page thumbnails to reorder pages instantly",
      "Rotate individual pages 90° at a time",
      "Delete any unwanted pages",
      "Add blank pages or extra PDFs between existing pages",
      "No upload — your file never leaves your device",
    ],
    steps: [
      { n: "1", t: "Open your PDF", d: "Click 'Open PDF or Image' to load the document." },
      { n: "2", t: "Drag to reorder", d: "Drag page thumbnails in the left sidebar to rearrange them." },
      { n: "3", t: "Rotate or delete", d: "Use the rotate and delete buttons on each thumbnail." },
      { n: "4", t: "Download", d: "Click Download to save your reordered PDF." },
    ],
    related: [
      { label: "Merge PDF", href: "/merge-pdf" },
      { label: "Split PDF", href: "/split-pdf" },
      { label: "Edit PDF", href: "/edit-pdf" },
    ],
  },
};

const NAV_LINKS = [
  ["About", "/about"],
  ["FAQs", "/faqs"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
];

export default function LandingPage({ route, navigate, setPendingFile }) {
  const fileInputRef = useRef(null);
  const content = CONTENT[route];
  const seo = SEO_PAGES[route] || SEO_PAGES["/"];

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    navigate("/");
  };

  const openFile = () => fileInputRef.current?.click();

  const BTN_PRIMARY = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    height: 44, padding: "0 28px",
    background: RED, color: "#fff",
    fontFamily: CINZEL, fontSize: 10, letterSpacing: 2,
    textTransform: "uppercase", fontWeight: 800,
    border: "none", borderRadius: 3, cursor: "pointer",
    boxShadow: "0 8px 20px rgba(139,26,26,0.20)",
  };

  const STEP_NUM = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, borderRadius: "50%",
    background: RED, color: "#fff",
    fontFamily: CINZEL, fontSize: 11, fontWeight: 800,
    flexShrink: 0,
  };

  if (!content) return null;

  return (
    <div className="lp" style={{ minHeight: "100dvh", background: `linear-gradient(to bottom, rgba(255,252,246,0.90), rgba(255,252,246,0.94)), url("/background.png") center top / cover no-repeat fixed`, color: INK, fontFamily: FELL, display: "flex", flexDirection: "column" }}>
      <style>{`
        @media (max-width: 580px) {
          .lp {
            min-height: 100dvh !important;
            background:
              linear-gradient(to bottom, rgba(255,252,246,0.96), rgba(255,252,246,0.985)),
              url("/background.png") center top / cover no-repeat !important;
            overflow-x: hidden;
          }
          .lp-header {
            height: auto !important;
            min-height: 64px !important;
            padding: 14px 16px 10px !important;
            flex-direction: column !important;
            gap: 8px !important;
            align-items: center !important;
          }
          .lp-logo { width: min(168px, 54vw) !important; }
          .lp-nav {
            width: 100%;
            justify-content: center;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .lp-nav::-webkit-scrollbar { display: none; }
          .lp-nav a {
            font-size: 7px !important;
            letter-spacing: 1.3px !important;
            padding: 0 8px !important;
            white-space: nowrap;
          }
          .lp-main {
            max-width: 430px !important;
            padding: 36px 18px 52px !important;
            text-align: center;
          }
          .lp-main h1 {
            font-size: clamp(34px, 10vw, 46px) !important;
            line-height: 1.05 !important;
          }
          .lp-main > p {
            font-size: 14.5px !important;
            line-height: 1.58 !important;
          }
          .lp-actions {
            flex-direction: column !important;
            align-items: stretch !important;
            width: 100%;
            gap: 10px !important;
          }
          .lp-btn { width: 100% !important; height: 52px !important; }
          .lp-benefits, .lp-steps, .lp-related { text-align: left; }
          .lp-trust { text-align: left; }
        }
      `}</style>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="application/pdf,.pdf,image/*" onChange={handleFile} style={{ display: "none" }} />

      {/* Header */}
      <header className="lp-header" style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(255,253,248,0.92)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${LINE}`, height: 60, display: "flex", alignItems: "center", padding: "0 36px" }}>
        <a href="/" onClick={e => { e.preventDefault(); navigate("/"); }} style={{ textDecoration: "none", marginRight: "auto" }}>
          <img src="/logo.png" alt="katanapdf — Free PDF Editor" className="lp-logo" style={{ width: "min(180px,42vw)", height: "auto", display: "block" }} />
        </a>
        <nav className="lp-nav" style={{ display: "flex", alignItems: "center" }}>
          {NAV_LINKS.map(([label, href]) => (
            <a key={label} href={href}
              onClick={e => { e.preventDefault(); navigate(href); }}
              style={{ fontFamily: CINZEL, fontSize: 9, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700, color: "rgba(24,19,13,0.5)", textDecoration: "none", padding: "0 12px", borderRight: `1px solid ${LINE}` }}>
              {label}
            </a>
          ))}
          <a style={{ display: "none" }} /> {/* removes last border */}
        </nav>
      </header>

      {/* Hero */}
      <section className="lp-main" style={{ flex: 1, maxWidth: 820, margin: "0 auto", padding: "60px 32px 80px", width: "100%", boxSizing: "border-box" }}>
        {/* Eyebrow */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: CINZEL, fontSize: 10, letterSpacing: 3.5, textTransform: "uppercase", color: RED, fontWeight: 700, marginBottom: 18 }}>
          <span style={{ display: "inline-block", width: 20, height: 1, background: RED }} />
          katanapdf
          <span style={{ display: "inline-block", width: 20, height: 1, background: RED }} />
        </div>

        <h1 style={{ fontFamily: FELL, fontSize: "clamp(32px,4vw,52px)", lineHeight: 1.06, letterSpacing: -0.5, color: INK, fontWeight: 600, margin: "0 0 20px" }}>
          {content.h1}
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.65, color: MUTED, margin: "0 0 28px", maxWidth: 640 }}>
          {content.intro}
        </p>

        {/* CTA */}
        <div className="lp-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <button className="lp-btn" onClick={openFile} style={BTN_PRIMARY}>Open PDF or Image</button>
          <a className="lp-btn" href="/" onClick={e => { e.preventDefault(); navigate("/"); }}
            style={{ ...BTN_PRIMARY, background: "transparent", color: RED, border: `1.5px solid rgba(139,26,26,0.45)`, boxShadow: "none", textDecoration: "none" }}>
            Go to Editor
          </a>
        </div>
        <p style={{ fontSize: 12.5, color: MUTED, fontStyle: "italic", margin: "0 0 52px" }}>
          No upload · No account · No watermark · 100% free
        </p>

        {/* Benefits */}
        <h2 style={{ fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: RED, fontWeight: 800, margin: "0 0 14px" }}>What you can do</h2>
        <ul className="lp-benefits" style={{ margin: "0 0 48px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
          {content.benefits.map((b, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 15, color: INK, lineHeight: 1.5 }}>
              <span style={{ color: RED, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>✓</span>
              {b}
            </li>
          ))}
        </ul>

        {/* How it works */}
        <h2 style={{ fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: RED, fontWeight: 800, margin: "0 0 20px" }}>How it works</h2>
        <ol className="lp-steps" style={{ margin: "0 0 48px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
          {content.steps.map(step => (
            <li key={step.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={STEP_NUM}>{step.n}</span>
              <div>
                <strong style={{ fontFamily: CINZEL, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: INK }}>{step.t}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 14.5, color: MUTED, lineHeight: 1.55 }}>{step.d}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Trust line */}
        <div className="lp-trust" style={{ padding: "14px 20px", border: `1px solid rgba(116,86,44,0.2)`, borderLeft: `3px solid ${RED}`, borderRadius: 4, background: "rgba(255,253,248,0.88)", fontSize: 14, color: MUTED, lineHeight: 1.6, marginBottom: 48 }}>
          Your PDF is processed entirely in your browser. No file is uploaded to any server. No account is required.
        </div>

        {/* Related tools */}
        <h2 style={{ fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: RED, fontWeight: 800, margin: "0 0 14px" }}>Related tools</h2>
        <div className="lp-related" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {content.related.map(r => (
            <a key={r.href} href={r.href}
              onClick={e => { e.preventDefault(); navigate(r.href); }}
              style={{ fontFamily: CINZEL, fontSize: 9, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, color: RED, textDecoration: "none", border: `1px solid rgba(139,26,26,0.35)`, borderRadius: 3, padding: "6px 14px" }}>
              {r.label}
            </a>
          ))}
        </div>
      </section>

      <Footer navigate={navigate} />
    </div>
  );
}

