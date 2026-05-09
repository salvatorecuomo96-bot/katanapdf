import { useRef, useState, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

// Loaded once and cached so handleDownload doesn't re-fetch on every save.
let _notoFontBytesCache = null;
async function loadNotoFontBytes() {
  if (_notoFontBytesCache) return _notoFontBytesCache;
  const names = [
    "noto-sans-regular", "noto-sans-bold", "noto-sans-italic", "noto-sans-bold-italic",
    "noto-serif-regular", "noto-serif-bold",
    "noto-sans-mono-regular",
  ];
  const entries = await Promise.all(names.map(async (n) => {
    const res = await fetch(`/fonts/${n}.woff2`);
    return [n, await res.arrayBuffer()];
  }));
  _notoFontBytesCache = Object.fromEntries(entries);
  return _notoFontBytesCache;
}

// Legacy build is transpiled for older Safari / iOS — improves cross-device compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).href;

const SCALE = 2;

// === Ancient Japan design tokens ===
const PARCHMENT = "#F5EDD6";
const PARCHMENT_2 = "#EDE0BC";
const LACQUER = "#8B1A1A";
const GOLD = "#C4963A";
const INK = "#1a1208";

const CINZEL = '"Cinzel", "Times New Roman", serif';
const FELL = '"Lora", Georgia, "Times New Roman", serif';

const CROSSHATCH = `repeating-linear-gradient(45deg, transparent 0 9px, rgba(26,18,8,0.035) 9px 10px), repeating-linear-gradient(-45deg, transparent 0 9px, rgba(26,18,8,0.035) 9px 10px)`;

function SectionDivider({ label }) {
  // letter-spacing leaves a trailing gap to the right of the last character, which
  // shifts the visible text left of the geometric centre. Match it with paddingLeft
  // so the label looks visually centred between the gold rules.
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "36px auto 18px", maxWidth: 1600, padding: "0 20px" }}>
      <div style={{ flex: 1, height: 1, background: GOLD }} />
      <span style={{ fontFamily: CINZEL, fontSize: 13, letterSpacing: 4, paddingLeft: 4, textTransform: "uppercase", color: LACQUER, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: GOLD }} />
    </div>
  );
}

function StampTag({ children }) {
  return (
    <span style={{
      border: `1px solid ${LACQUER}`,
      padding: "5px 14px",
      color: LACQUER,
      fontFamily: CINZEL,
      fontSize: 11,
      letterSpacing: 3,
      textTransform: "uppercase",
      fontWeight: 500,
      background: "transparent",
    }}>{children}</span>
  );
}

function CornerBracket() {
  return (
    <div style={{ position: "absolute", top: 8, right: 8, width: 14, height: 14, borderTop: `1px solid ${GOLD}`, borderRight: `1px solid ${GOLD}`, pointerEvents: "none" }} />
  );
}

function Homepage({ onFile, onDropFile, onCreateBlank }) {
  const [dragOver, setDragOver] = useState(false);

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
         style={{ minHeight: "100vh", background: PARCHMENT, backgroundImage: CROSSHATCH, color: INK, position: "relative", fontFamily: FELL }}>
      {dragOver && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(139,26,26,0.18)",
                      border: `4px dashed ${LACQUER}`, display: "flex", alignItems: "center", justifyContent: "center",
                      pointerEvents: "none" }}>
          <div style={{ background: PARCHMENT, padding: "20px 40px", color: LACQUER, fontFamily: CINZEL, fontSize: 18, letterSpacing: 4, textTransform: "uppercase", border: `1px solid ${GOLD}`, outline: `1px solid ${LACQUER}`, outlineOffset: 4 }}>
            Drop your PDF or image here
          </div>
        </div>
      )}

      {/* HEADER — compact logo + trust badges. Logo PNG has lots of internal
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

      {/* HERO — H1 headline + CTA */}
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
      <section style={{ maxWidth: 1600, margin: "0 auto", padding: "0 20px 8px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 14 }}>
          {[
            { label: "Edit supported text", detail: "Click any text block to edit it in place." },
            { label: "Add text", detail: "Place new text boxes anywhere on the page." },
            { label: "Add images", detail: "Insert images, resize, and reposition freely." },
            { label: "Image to PDF", detail: "Convert any image into an editable PDF instantly." },
            { label: "Merge PDFs", detail: "Append pages from a second PDF." },
            { label: "Reorder pages", detail: "Use the ↑/↓ buttons on each page to rearrange." },
          ].map((cap, i) => (
            <div key={i} style={{ background: PARCHMENT_2, border: `1px solid rgba(139,26,26,0.2)`, padding: "14px 18px" }}>
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

      {/* PRIVACY / TRUST */}
      <SectionDivider label="Your files stay private" />
      <section style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ background: PARCHMENT_2, borderLeft: `3px solid ${LACQUER}`, padding: "20px 24px", fontFamily: FELL, fontSize: 15, lineHeight: 1.6, color: INK }}>
          <p style={{ margin: "0 0 14px" }}>
            katanapdf runs in your browser. Your PDF is processed on your device instead of being uploaded to a server.
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {['No file upload', 'No account required', 'No watermark', 'No hidden paywall'].map((b, i) => (
              <li key={i} style={{ marginBottom: 5 }}>{b}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW TO EDIT */}
      <SectionDivider label="How to edit a PDF online" />
      <section style={{ maxWidth: 1600, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Open your PDF — click the button or drag a file onto this page.",
            "Edit supported text, add new text boxes, or place images on any page.",
            "Append pages from another PDF using the Add PDF button if needed.",
            "Download the finished PDF.",
          ].map((s, i) => (
            <div key={i} style={{ background: PARCHMENT_2, border: `1px solid rgba(139,26,26,0.2)`, padding: "12px 18px", display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontFamily: CINZEL, fontSize: 36, color: "rgba(139,26,26,0.22)", lineHeight: 1, fontWeight: 700, flexShrink: 0, minWidth: 36, textAlign: "center" }}>{i + 1}</span>
              <span style={{ fontFamily: FELL, fontSize: 15, lineHeight: 1.5, color: INK }}>{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WHY KATANAPDF — 6 cards. minmax(360) forces 3 cols at the 1280
          container so the layout is a clean 3+3 instead of an asymmetric 4+2.
          Below ~1116 px it falls to 2 cols (2+2+2), then 1 col on phones. */}
      <SectionDivider label="Why katanapdf" />
      <section style={{ maxWidth: 1600, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(400px, 100%), 1fr))", gap: 18 }}>
          {[
            { t: "100% Free", d: "No paid tier hiding the basic tools." },
            { t: "No Upload Required", d: "Your PDF is processed locally in your browser." },
            { t: "No Account Needed", d: "Open the file and start editing." },
            { t: "No Watermark", d: "Download a clean PDF." },
            { t: "Practical Edits", d: "Add text, images, and edit supported text directly." },
            { t: "Fast by Design", d: "No waiting for server uploads or queues." },
          ].map((x, i) => (
            <div key={i} style={{ background: INK, padding: "20px 22px", position: "relative", border: `1px solid rgba(196,150,58,0.3)` }}>
              <CornerBracket />
              <h3 style={{ fontFamily: CINZEL, fontSize: 13, color: GOLD, letterSpacing: 3, textTransform: "uppercase", margin: 0, fontWeight: 600 }}>{x.t}</h3>
              <p style={{ fontFamily: FELL, fontSize: 14, color: "rgba(245,237,214,0.72)", margin: "10px 0 0", lineHeight: 1.6 }}>{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <SectionDivider label="Frequently asked questions" />
      <section style={{ maxWidth: 1300, margin: "0 auto", padding: "0 20px 56px" }}>
        {[
          { q: "Is katanapdf really free?", a: "Yes. Every feature is free with no paid tier. The site is supported by ads and donations." },
          { q: "Are my files uploaded somewhere?", a: "No. The PDF is opened, edited, and saved entirely inside your browser. We have no servers that receive your file." },
          { q: "Do I need an account?", a: "No. There is no sign-up, no email required, no tracking of who edits what." },
          { q: "What size of PDF can I edit?", a: "Any size your browser can handle — typically files up to a few hundred MB work fine on a modern computer." },
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

function Footer() {
  const linkStyle = { color: GOLD, fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: "0 14px", textDecoration: "none", fontWeight: 500 };
  return (
    <footer style={{ background: INK, padding: "26px 20px", textAlign: "center", borderTop: `1px solid rgba(196,150,58,0.3)` }}>
      <div style={{ height: 0.5, background: "rgba(196,150,58,0.5)", maxWidth: 600, margin: "0 auto 16px" }} />
      <div style={{ marginBottom: 14 }}>
        <a href="#about" style={linkStyle}>About</a>
        <a href="#privacy" style={linkStyle}>Privacy Policy</a>
        <a href="#terms" style={linkStyle}>Terms</a>
      </div>
      <div style={{ color: GOLD, fontFamily: CINZEL, fontSize: 10, letterSpacing: 2, opacity: 0.7 }}>
        © {new Date().getFullYear()} katanapdf — Free PDF editor in your browser.
      </div>
    </footer>
  );
}

function StaticPage({ route }) {
  const content = {
    privacy: {
      title: "Privacy Policy",
      body: (
        <>
          <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
          <h2>What we collect</h2>
          <p>katanapdf does not collect, store, or transmit the contents of any PDF you open. Every editing operation runs locally in your browser using JavaScript. Your file never leaves your computer.</p>
          <h2>Analytics and ads</h2>
          <p>We may serve advertisements through third-party providers (such as Google AdSense). These providers may use cookies to serve ads based on prior visits to this and other websites. You can opt out of personalised advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.</p>
          <h2>Cookies</h2>
          <p>We do not set our own tracking cookies. Third-party cookies may be set by ad providers. You can disable cookies in your browser at any time without affecting the editor's functionality.</p>
          <h2>Children</h2>
          <p>This site is not directed at children under 13. We do not knowingly collect personal information from children.</p>
          <h2>Contact</h2>
          <p>Questions about this policy can be sent to the contact email listed on the About page.</p>
        </>
      ),
    },
    terms: {
      title: "Terms of Use",
      body: (
        <>
          <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
          <h2>Acceptable use</h2>
          <p>You may use katanapdf to edit any PDF you have the legal right to modify. You agree not to use this service to violate copyright, infringe intellectual property, or perform unlawful acts.</p>
          <h2>No warranty</h2>
          <p>katanapdf is provided "as is", without warranty of any kind. We do not guarantee that every PDF will render or save perfectly. Always keep an original copy of your file.</p>
          <h2>Limitation of liability</h2>
          <p>To the maximum extent permitted by law, katanapdf and its operators are not liable for any data loss, damages, or losses resulting from use of this service.</p>
          <h2>Changes</h2>
          <p>These terms may be updated occasionally. Continued use of the site constitutes acceptance of the latest version.</p>
        </>
      ),
    },
    about: {
      title: "About katanapdf",
      body: (
        <>
          <p>katanapdf is a free, browser-based PDF editor. It was built on the simple idea that editing a PDF shouldn't require uploading your file to a stranger's server, signing up for an account, or paying a subscription.</p>
          <h2>How it works</h2>
          <p>Everything happens in your browser. We use modern web technologies (PDF.js for rendering, pdf-lib for saving) to open, edit, and download PDFs without ever sending the file anywhere.</p>
          <h2>Why free?</h2>
          <p>The site is supported by ads and reader donations. There is no paid tier and no plan to add one — the goal is to keep a useful tool genuinely free for everyone.</p>
          <h2>Contact</h2>
          <p>For feedback, bug reports, or feature requests you can reach us at <a href="mailto:katanapdf@gmail.com">katanapdf@gmail.com</a>.</p>
        </>
      ),
    },
  }[route];

  if (!content) return null;

  return (
    <div style={{ minHeight: "100vh", background: PARCHMENT, backgroundImage: CROSSHATCH, color: INK, fontFamily: FELL }}>
      <header style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ height: 1, background: LACQUER, maxWidth: 920, margin: "0 auto 14px", opacity: 0.5 }} />
        <a href="#home" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: CINZEL, fontSize: 18, color: INK, letterSpacing: 5, textTransform: "uppercase", fontWeight: 600 }}>
            katanapdf
          </span>
        </a>
        <div style={{ height: 1, background: LACQUER, maxWidth: 920, margin: "14px auto 0", opacity: 0.5 }} />
      </header>
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 64px", fontSize: 16, lineHeight: 1.75, fontFamily: FELL, color: INK }}>
        <h1 style={{ fontFamily: CINZEL, fontSize: 30, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase", marginTop: 0, marginBottom: 8, color: INK }}>{content.title}</h1>
        <div style={{ height: 1, background: GOLD, width: 80, marginBottom: 28 }} />
        <div className="static-body">{content.body}</div>
        <p style={{ marginTop: 40 }}>
          <a href="#home" style={{ color: LACQUER, fontFamily: CINZEL, fontSize: 12, letterSpacing: 3, textTransform: "uppercase", textDecoration: "underline", fontWeight: 600 }}>
            ← Back to editor
          </a>
        </p>
      </article>
      <Footer />
      <style>{`
        .static-body h2 { font-family: ${CINZEL}; font-size: 16px; letter-spacing: 3px; text-transform: uppercase; font-weight: 600; color: ${LACQUER}; margin: 28px 0 10px; }
        .static-body p { margin: 0 0 14px; }
        .static-body a { color: ${LACQUER}; text-decoration: underline; }
        .static-body em { color: rgba(26,18,8,0.6); }
      `}</style>
    </div>
  );
}

function FloatingImage({ fi, isSel, onSelect, onStartDrag, onStartResize, onDelete, onDeselect }) {
  useEffect(() => {
    if (!isSel) return;
    const handler = (e) => {
      if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); onDeselect(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSel, onDeselect]);

  return (
    <div onClick={e => { e.stopPropagation(); onSelect(); }} style={{
      position: "absolute", left: fi.x, top: fi.y,
      width: fi.w, height: fi.h,
      zIndex: isSel ? 1000 : (fi.z || 50),
      border: isSel ? "2px solid #8B1A1A" : "none",
      boxSizing: "border-box", overflow: "visible",
      boxShadow: isSel ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
      cursor: isSel ? "default" : "pointer",
    }}>
      <img src={fi.dataUrl} alt="" draggable={false}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "fill", pointerEvents: "none", userSelect: "none" }} />
      {isSel && <>
        <div onMouseDown={onStartDrag} style={{
          position: "absolute", top: -28, left: 0, right: 0,
          background: "#8B1A1A", padding: "4px 8px", fontSize: 10,
          color: "#fff", cursor: "grab", display: "flex", alignItems: "center", userSelect: "none",
          borderRadius: "4px 4px 0 0",
        }}>
          <span style={{ fontWeight: 700 }}>✥ DRAG</span>
          <span onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700 }}>✕</span>
        </div>
        <div onMouseDown={onStartResize} style={{
          position: "absolute", bottom: -8, right: -8, width: 16, height: 16,
          background: "#8B1A1A", cursor: "nwse-resize", borderRadius: "50%",
          border: "2px solid #fff",
        }} />
        <div style={{
          position: "absolute", left: 0, right: 0, top: "100%", marginTop: 4,
          fontSize: 10, color: "#666", padding: "2px 8px 4px", fontFamily: "sans-serif",
          background: "rgba(255,255,255,0.85)", borderRadius: 2, textAlign: "center",
          pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          Tab to save · Esc to cancel
        </div>
      </>}
    </div>
  );
}

let floatingIdCounter = 0;

function clusterWordsIntoLineClusters(pageWords) {
  const EPS_Y = 5;
  const MAX_GAP_MULT = 2.8;
  if (!pageWords.length) return [];
  const sorted = [...pageWords].sort((a, b) => {
    if (Math.abs(a.baselineY - b.baselineY) > EPS_Y) return b.baselineY - a.baselineY;
    return a.x - b.x;
  });
  const clusters = [];
  let c = [];
  for (const w of sorted) {
    if (!c.length) {
      c.push(w);
      continue;
    }
    const last = c[c.length - 1];
    const sameLine = Math.abs(w.baselineY - last.baselineY) <= EPS_Y;
    const gap = w.x - (last.x + last.width);
    const maxGap = Math.max(last.fontSize, w.fontSize) * MAX_GAP_MULT;
    if (sameLine && gap <= maxGap) c.push(w);
    else {
      clusters.push(c);
      c = [w];
    }
  }
  if (c.length) clusters.push(c);
  return clusters;
}

function clusterLineString(cluster) {
  return [...cluster].sort((a, b) => a.x - b.x).map((w) => w.text).join(" ");
}

function mergeLineClustersIntoParagraphs(lineClusters) {
  if (!lineClusters.length) return [];
  const sorted = [...lineClusters].sort((a, b) => {
    const topA = Math.min(...a.map(w => w.y));
    const topB = Math.min(...b.map(w => w.y));
    if (Math.abs(topA - topB) < 5) return Math.min(...a.map(w => w.x)) - Math.min(...b.map(w => w.x));
    return topA - topB;
  });
  const merged = [];
  let group = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevC = group[group.length - 1];
    const nextC = sorted[i];
    const prevMaxB = Math.max(...prevC.map(w => w.y + w.height));
    const nextMinY = Math.min(...nextC.map(w => w.y));
    const gap = nextMinY - prevMaxB;
    const fsMin = Math.min(prevC[0].fontSize, nextC[0].fontSize);
    const fsMax = Math.max(prevC[0].fontSize, nextC[0].fontSize);

    const prevMinX = Math.min(...prevC.map(w => w.x));
    const prevMaxX = Math.max(...prevC.map(w => w.x + w.width));
    const nextMinX = Math.min(...nextC.map(w => w.x));
    const nextMaxX = Math.max(...nextC.map(w => w.x + w.width));
    const overlap = Math.min(prevMaxX, nextMaxX) - Math.max(prevMinX, nextMinX);
    const wPrev = Math.max(prevMaxX - prevMinX, 1);
    const wNext = Math.max(nextMaxX - nextMinX, 1);
    const minW = Math.min(wPrev, wNext);
    const overlapRatio = minW > 0 ? overlap / minW : 0;

    const prevStr = clusterLineString(prevC).trimEnd();
    const nextStr = clusterLineString(nextC).trimStart();
    const hyphenHung = /[-\u00ad]\s*$/.test(prevStr) || /\d[-\u00ad]\s*$/.test(prevStr);
    const nextLooksLikeDateTail = /^\d{2,4}\b/.test(nextStr) || /^to\s+\d/i.test(nextStr);

    const prevAvgFs = prevC.reduce((s, w) => s + w.fontSize, 0) / prevC.length;
    const nextAvgFs = nextC.reduce((s, w) => s + w.fontSize, 0) / nextC.length;
    const headingPullsBody = prevAvgFs > nextAvgFs * 1.12;

    const gapLo = -fsMin * 0.4;
    let gapHi = fsMin * 2.2;
    if (hyphenHung) gapHi = Math.max(gapHi, fsMin * 3.85);
    else if (nextLooksLikeDateTail && overlapRatio > 0.06 && Math.abs(nextMinX - prevMinX) < fsMin * 6)
      gapHi = Math.max(gapHi, fsMin * 3.1);
    if (headingPullsBody) gapHi = Math.max(gapHi, Math.max(prevAvgFs, nextAvgFs) * 3.6);
    const gapOK = gap >= gapLo && gap < gapHi;

    let isolatedSideBySide = nextMaxX < prevMinX - fsMin * 2.5 || nextMinX > prevMaxX + fsMin * 4;
    if (hyphenHung)
      isolatedSideBySide = nextMaxX < prevMinX - fsMin * 8 || nextMinX > prevMaxX + fsMin * 12;

    const sizeMismatch = fsMax > fsMin * 1.32 && !headingPullsBody;
    const leftAligned = Math.abs(nextMinX - prevMinX) < fsMin * 4.5;

    let merge = false;
    if (!gapOK || isolatedSideBySide) merge = false;
    else if (sizeMismatch) merge = false;
    else if (headingPullsBody) merge = true;
    else if (hyphenHung) merge = true;
    else if (leftAligned) merge = true;
    else if (overlapRatio > 0.32) merge = true;

    if (merge) group.push(nextC);
    else {
      merged.push(group.flat());
      group = [nextC];
    }
  }
  merged.push(group.flat());
  return merged;
}

function paragraphWordsToTextBlock(words, paraIdx) {
  if (!words.length) return null;
  const page = words[0].page;
  const lineClusters = clusterWordsIntoLineClusters(words);
  const sortedLines = [...lineClusters].sort((a, b) => Math.min(...a.map((w) => w.y)) - Math.min(...b.map((w) => w.y)));
  const linesText = sortedLines.map((lc) => [...lc].sort((a, b) => a.x - b.x).map((w) => w.text).join(" "));
  const text = linesText.join("\n");

  const minX = Math.min(...words.map((w) => w.x));
  const maxR = Math.max(...words.map((w) => w.x + w.width));
  const minY = Math.min(...words.map((w) => w.y));
  const maxB = Math.max(...words.map((w) => w.y + w.height));
  const topLine = [...sortedLines[0]].sort((a, b) => a.x - b.x);
  const baselineY = topLine.reduce((s, w) => s + w.baselineY, 0) / topLine.length;
  const lineBaselines = sortedLines.map((lc) => {
    const ln = [...lc].sort((a, b) => a.x - b.x);
    return ln.reduce((s, w) => s + w.baselineY, 0) / ln.length;
  });
  const fs = sortedLines.length > 1
    ? words.reduce((a, w) => a + w.fontSize, 0) / words.length
    : topLine.reduce((s, w) => s + w.fontSize, 0) / Math.max(topLine.length, 1);
  const { fontFamily, isBold, isItalic } = topLine[0];

  return {
    id: `${page}-P${paraIdx}`,
    page,
    text,
    x: minX,
    y: minY,
    width: maxR - minX,
    height: maxB - minY,
    baselineY,
    lineBaselines,
    fontSize: fs,
    fontFamily,
    isBold,
    isItalic,
    edited: false,
  };
}

function pageWordsToTextBlocks(pageWords) {
  const lines = clusterWordsIntoLineClusters(pageWords);
  const paragraphs = mergeLineClustersIntoParagraphs(lines);
  return paragraphs.map((p, i) => paragraphWordsToTextBlock(p, i)).filter(Boolean);
}

function redrawPage(canvas, dataUrl, edits) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    for (const e of edits) {
      const lines = e.text.split(/\r?\n/);
      const lh = e.fontSize * 1.22;
      const lineCount = Math.max(1, lines.length);
      const useBaselines = e.lineBaselines && e.lineBaselines.length === lines.length;
      let whiteH;
      if (useBaselines && lines.length > 1) {
        const bs = e.lineBaselines;
        whiteH = Math.max(e.height + 12, Math.max(...bs) - Math.min(...bs) + lh + 16);
      } else whiteH = Math.max(e.height + 12, lineCount * lh + 14);
      ctx.font = `${e.isItalic ? "italic " : ""}${e.isBold ? "bold " : ""}${e.fontSize}px ${e.fontFamily}`;
      ctx.fillStyle = "#fff";
      let maxLineW = e.width;
      for (const line of lines) maxLineW = Math.max(maxLineW, ctx.measureText(line || " ").width);
      ctx.fillRect(e.x - 2, e.y - 2, maxLineW + 14, whiteH + 8);
      ctx.fillStyle = "#000";
      ctx.textBaseline = "alphabetic";
      if (useBaselines) {
        lines.forEach((line, i) => {
          ctx.fillText(line, e.x, e.lineBaselines[i]);
        });
      } else {
        lines.forEach((line, i) => {
          ctx.fillText(line, e.x, e.baselineY + i * lh);
        });
      }
    }
  };
  img.src = dataUrl;
}

function EditPopup({ block, zoom, fontSize, fontFamily, isBold, isItalic, offsetX, offsetY, onOffsetChange, onCommit, onCancel }) {
  const [text, setText] = useState(block.text);
  const [dragging, setDragging] = useState(false);
  const [measuredW, setMeasuredW] = useState(0);
  const taRef = useRef(null);
  const popupRef = useRef(null);
  const measureRef = useRef(null);
  const textRef = useRef(block.text);
  const dragOrigin = useRef(null);

  useEffect(() => { textRef.current = text; }, [text]);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.focus();
    taRef.current.select();
  }, []);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (e.target.closest?.("[data-edit-toolbar]")) return;
      if (popupRef.current && !popupRef.current.contains(e.target)) onCommit(textRef.current);
    };
    document.addEventListener("mousedown", onMouseDown, true);
    return () => document.removeEventListener("mousedown", onMouseDown, true);
  }, [onCommit]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => {
      const o = dragOrigin.current;
      if (!o) return;
      onOffsetChange(o.ox + e.clientX - o.mx, o.oy + e.clientY - o.my);
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging, onOffsetChange]);

  const onHandleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offsetX, oy: offsetY };
    setDragging(true);
  };

  const cssFontSize = (fontSize != null ? fontSize * SCALE : block.fontSize) * zoom;
  const lineHeightPx = Math.max(cssFontSize * 1.22, 15);
  const nLines = Math.max(1, text.split(/\r?\n/).length);
  const origNLines = Math.max(1, block.text.split(/\r?\n/).length);
  const padX = 10;
  const vw = typeof window !== "undefined" ? window.innerWidth * 0.96 : 900;

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const lines = text.split(/\r?\n/);
    let mw = 0;
    el.style.fontWeight = isBold ? "bold" : "normal";
    el.style.fontStyle = isItalic ? "italic" : "normal";
    el.style.fontSize = `${cssFontSize}px`;
    el.style.fontFamily = fontFamily;
    el.style.whiteSpace = "pre";
    for (const line of lines) {
      el.textContent = line || " ";
      mw = Math.max(mw, el.offsetWidth);
    }
    setMeasuredW(mw);
  }, [text, fontFamily, isBold, isItalic, cssFontSize]);

  const boxW = Math.max(block.width * zoom + padX, measuredW + 36, 96);
  const boxHBody = Math.max(
    block.height * zoom + 6,
    lineHeightPx * Math.max(nLines, origNLines) + 10,
    lineHeightPx * 1.35
  );
  const singleVisualLine = text.split(/\r?\n/).length <= 1;
  const sharedFont = {
    fontSize: cssFontSize,
    fontFamily,
    fontWeight: isBold ? "bold" : "normal",
    fontStyle: isItalic ? "italic" : "normal",
    lineHeight: `${lineHeightPx}px`,
    whiteSpace: singleVisualLine ? "pre" : "pre-wrap",
    wordBreak: singleVisualLine ? "normal" : "break-word",
  };

  return (
    <div ref={popupRef} onClick={e => e.stopPropagation()} style={{
      // zIndex 2000 keeps the popup above floating images (which use z = 50 + counter,
      // typically <300). background transparent so the user previews their edit against
      // the actual page (or any image overlapping the text block).
      position: "absolute", left: offsetX, top: offsetY, zIndex: 2000,
      border: "1px solid #c42f3c", borderRadius: 3, background: "transparent",
      boxSizing: "border-box", display: "flex", flexDirection: "column",
      width: Math.min(boxW, vw), minWidth: Math.min(boxW, vw), maxWidth: vw,
      boxShadow: "0 4px 18px rgba(0,0,0,0.28)",
    }}>
      <span ref={measureRef} aria-hidden style={{ position: "absolute", left: -9999, top: 0, visibility: "hidden", pointerEvents: "none" }} />
      <div style={{
        background: "#8B1A1A", height: 11, flexShrink: 0, userSelect: "none",
        borderRadius: "2px 2px 0 0", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 4px 0 2px",
      }}>
        <div onMouseDown={onHandleMouseDown} title="Drag · Tab to save · ✓ or click outside"
          aria-label="Drag to move editor" style={{
            flex: 1, cursor: dragging ? "grabbing" : "grab", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 3, height: "100%",
          }}>
          {[0, 1, 2].map((k) => (
            <span key={k} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.92)" }} />
          ))}
        </div>
        <button type="button" title="Save" aria-label="Save"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onCommit(textRef.current); }}
          style={{
            border: "none", background: "rgba(0,0,0,0.12)", color: "#fff",
            width: 22, height: 20, lineHeight: "18px", borderRadius: 3,
            cursor: "pointer", fontSize: 13, fontWeight: 800, padding: 0, flexShrink: 0,
          }}>✓</button>
      </div>
      <textarea ref={taRef} value={text} onChange={e => setText(e.target.value)}
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          if (e.key === "Tab") { e.preventDefault(); onCommit(textRef.current); }
        }}
        style={{
          ...sharedFont, display: "block", border: "none", outline: "none",
          resize: "vertical", background: "transparent", padding: "5px 6px 6px",
          margin: 0, cursor: "text", width: "100%", minHeight: boxHBody,
          maxHeight: Math.max(boxHBody * 2.2, 360), boxSizing: "border-box",
          color: "#000", overflowX: singleVisualLine ? "auto" : "hidden",
        }} />
      <div style={{
        fontSize: 10, color: "#666", padding: "4px 8px 5px",
        borderTop: "1px solid #eee", background: "#fafafa",
        flexShrink: 0, userSelect: "none",
      }}>Tab to save · Esc to cancel</div>
    </div>
  );
}

const FB_SIZES = [6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72,80,96,120];

function FloatingBox({ fb, isSel, onSelect, onStartDrag, onStartResize, onUpdate, onDelete, onCommit }) {
  const stopAll = e => e.stopPropagation();
  const taRef = useRef(null);

  // When this box becomes selected, focus the textarea
  useEffect(() => {
    if (isSel && taRef.current) {
      taRef.current.focus();
      // If the text is the placeholder, select all so the user can type to replace
      if (fb.text === "New text") taRef.current.select();
    }
  }, [isSel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tab / Esc to commit (deselect)
  const handleKeyDown = (e) => {
    if (e.key === "Tab" || e.key === "Escape") {
      e.preventDefault();
      onCommit();
    }
  };

  // Not selected — render text as a clean overlay (no toolbar, no border, no background)
  if (!isSel) {
    return (
      <div onClick={e => { e.stopPropagation(); onSelect(); }}
        style={{
          position: "absolute", left: fb.x, top: fb.y,
          minWidth: 20, zIndex: fb.z || 50, cursor: "pointer",
          padding: "2px 4px",
          fontSize: fb.fontSize, fontFamily: fb.fontFamily,
          fontWeight: fb.isBold ? "bold" : "normal",
          fontStyle: fb.isItalic ? "italic" : "normal",
          color: fb.color || "#000",
          lineHeight: 1.5,
          whiteSpace: "pre-wrap",
          background: "transparent",
        }}>
        {fb.text || " "}
      </div>
    );
  }

  // Selected — full editor UI. Container is transparent so the text previews
  // against the page background; only the toolbar / footer / handle have chrome.
  return (
    <div onClick={e => { e.stopPropagation(); }} style={{
      position: "absolute", left: fb.x, top: fb.y, minWidth: 140,
      zIndex: 1000,
      border: "2px solid #8B1A1A",
      borderRadius: 4, background: "transparent",
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      boxSizing: "border-box",
    }}>
      {/* Toolbar */}
      <div onMouseDown={onStartDrag} style={{
        background: "#8B1A1A", padding: "4px 6px", fontSize: 11, color: "#fff",
        cursor: "grab", display: "flex", alignItems: "center", gap: 5,
        userSelect: "none", borderRadius: "2px 2px 0 0", flexWrap: "nowrap",
      }}>
        <span style={{ fontWeight: 700, marginRight: 2, cursor: "grab" }}>✥</span>

        <select value={FB_SIZES.includes(fb.fontSize) ? fb.fontSize : 14}
          onChange={e => onUpdate({ fontSize: +e.target.value })}
          onMouseDown={stopAll} onClick={e => e.stopPropagation()}
          style={{ fontSize: 11, background: "#5a0f0f", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", width: 46 }}>
          {FB_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <span onMouseDown={stopAll} onClick={e => { e.stopPropagation(); onUpdate({ isBold: !fb.isBold }); }}
          style={{ cursor: "pointer", fontWeight: 900, opacity: fb.isBold ? 1 : 0.4 }}>B</span>

        <span onMouseDown={stopAll} onClick={e => { e.stopPropagation(); onUpdate({ isItalic: !fb.isItalic }); }}
          style={{ cursor: "pointer", fontStyle: "italic", opacity: fb.isItalic ? 1 : 0.4 }}>I</span>

        <input type="color" value={fb.color || "#000000"} onChange={e => onUpdate({ color: e.target.value })}
          onMouseDown={stopAll}
          style={{ width: 16, height: 16, border: "none", padding: 0, background: "none", cursor: "pointer", flexShrink: 0 }} />

        <select value={fb.fontFamily}
          onChange={e => onUpdate({ fontFamily: e.target.value })}
          onMouseDown={stopAll} onClick={e => e.stopPropagation()}
          style={{ fontSize: 11, background: "#5a0f0f", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", padding: "0 2px" }}>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Times New Roman, serif">Times</option>
          <option value="Courier New, monospace">Courier</option>
          <option value="Georgia, serif">Georgia</option>
        </select>

        <span onMouseDown={stopAll} onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700 }}>✕</span>
      </div>

      <textarea ref={taRef} value={fb.text}
        onChange={e => onUpdate({ text: e.target.value })}
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        rows={2}
        style={{
          display: "block", width: "100%", minWidth: 120, border: "none",
          outline: "none", resize: "none", background: "transparent",
          padding: "5px 8px", fontSize: fb.fontSize, fontFamily: fb.fontFamily,
          fontWeight: fb.isBold ? "bold" : "normal",
          fontStyle: fb.isItalic ? "italic" : "normal",
          color: fb.color || "#000", lineHeight: 1.5, cursor: "text",
          boxSizing: "border-box",
        }} />
      <div style={{ fontSize: 10, color: "#666", padding: "2px 8px 4px", fontFamily: "sans-serif", borderTop: "1px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.85)", borderRadius: "0 0 2px 2px" }}>
        Tab to save · Esc to cancel · drag corner to resize
      </div>
      {/* Corner resize handle — drags scale the fontSize, matching the picture affordance */}
      <div onMouseDown={onStartResize} style={{
        position: "absolute", bottom: -8, right: -8, width: 16, height: 16,
        background: "#8B1A1A", cursor: "nwse-resize", borderRadius: "50%",
        border: "2px solid #fff",
      }} />
    </div>
  );
}

export default function App() {
  const [pdfBytes, setPdfBytes] = useState(null);
  const [route, setRoute] = useState(() => {
    const h = (typeof window !== "undefined" && window.location.hash.slice(1)) || "home";
    return ["privacy", "terms", "about"].includes(h) ? h : "home";
  });
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1) || "home";
      setRoute(["privacy", "terms", "about"].includes(h) ? h : "home");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const [pages, setPages] = useState([]);
  // Phase 6: pageOrder is an array of indices into `pages[]` describing the
  // current display order. When unmodified it equals [0,1,...,n-1]. Reorder
  // mutates this, not pages[], so textBlocks / floatingBoxes / floatingImages
  // (keyed by the immutable pg.num) keep working without renumbering.
  const [pageOrder, setPageOrder] = useState([]);
  const [rotatedPages, setRotatedPages] = useState({}); // { [pageNum]: angle }
  const [deletedPages, setDeletedPages] = useState(new Set());
  const [textBlocks, setTextBlocks] = useState({});
  const [floatingBoxes, setFloatingBoxes] = useState([]);
  const [floatingImages, setFloatingImages] = useState([]);
  const [history, setHistory] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fileName, setFileName] = useState("");

  // Multi-tab state — each loaded PDF is a "tab" with its own state snapshot
  const [tabsList, setTabsList] = useState([]); // [{ id, fileName }]
  const [activeTabId, setActiveTabId] = useState(null);
  const tabSnapshots = useRef({}); // { [id]: { pdfBytes, pages, pageOrder, textBlocks, floatingBoxes, floatingImages, history, fileName, zoom, hasTextLayer, isEncrypted, rotatedPages, deletedPages } }
  const liveStateRef = useRef({});
  const [hasTextLayer, setHasTextLayer] = useState(true);
  const [textLayerNoticeDismissed, setTextLayerNoticeDismissed] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [encryptionNoticeDismissed, setEncryptionNoticeDismissed] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [draggingImg, setDraggingImg] = useState(null);
  const [resizingImg, setResizingImg] = useState(null);
  const [resizingFb, setResizingFb] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [fontSize, setFontSize] = useState(14);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const imgDragOrigin = useRef(null);
  const imgResizeOrigin = useRef(null);
  const fbResizeOrigin = useRef(null);
  const containerRef = useRef(null);
  const canvasRefs = useRef({});

  async function convertImageToPdfBytes(file) {
    const doc = await PDFDocument.create();
    const arrayBuffer = await file.arrayBuffer();
    let img;
    const type = file.type.toLowerCase();
    try {
      if (type === "image/jpeg" || type === "image/jpg") {
        img = await doc.embedJpg(arrayBuffer);
      } else if (type === "image/png") {
        img = await doc.embedPng(arrayBuffer);
      } else {
        throw new Error("Use canvas fallback");
      }
    } catch (e) {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      const pngBuf = await new Promise(res => {
        canvas.toBlob(async b => res(await b.arrayBuffer()), "image/png");
      });
      img = await doc.embedPng(pngBuf);
    }
    const { width, height } = img.scale(1);
    const page = doc.addPage([width, height]);
    page.drawImage(img, { x: 0, y: 0, width, height });
    return await doc.save();
  }

  async function handleFile(e) {
    const input = e.target;
    const file = input.files && input.files[0];
    // Reset value so the same file can be picked again later
    input.value = "";
    if (!file) return;
    try {
      snapshotCurrentTab();
      await loadPdfFromFile(file);
      const id = makeTabId();
      setTabsList(prev => [...prev, { id, fileName: file.name.match(/\.pdf$/i) ? file.name : file.name.replace(/\.[^/.]+$/, "") + ".pdf" }]);
      setActiveTabId(id);
    } catch (err) {
      console.error("Failed to load PDF/Image:", err);
      alert("Couldn't open this file: " + (err.message || err) + "\n\nTry a different file or refresh the page.");
    }
  }

  async function loadPdfFromFile(file) {
    let bytes;
    if (file.type === "application/pdf") {
      setFileName(file.name);
      const buf = await file.arrayBuffer();
      bytes = new Uint8Array(buf);
    } else if (file.type.startsWith("image/")) {
      setFileName(file.name.replace(/\.[^/.]+$/, "") + ".pdf");
      bytes = await convertImageToPdfBytes(file);
    } else {
      throw new Error("Unsupported file type: " + file.type);
    }
    await loadPdfFromBytes(bytes);
  }

  async function loadPdfFromBytes(bytes) {
    setPdfBytes(bytes);

    // Phase 3 — encryption probe. pdfjs renders encrypted PDFs fine (it has
    // its own decryption), but pdf-lib\'s strict load throws EncryptedPDFError
    // when the trailer has /Encrypt. We use the strict load purely as a flag:
    // if it\'s encrypted, we surface a banner so the user knows their saved
    // copy may differ from the original (any password protection / signature
    // metadata is lost on save).
    let encrypted = false;
    try {
      await PDFDocument.load(bytes, { ignoreEncryption: false });
    } catch (probeErr) {
      if (/encrypt/i.test(probeErr?.message || "")) encrypted = true;
      // Other parse errors aren\'t our concern here — pdfjs may still render.
    }
    setIsEncrypted(encrypted);
    setEncryptionNoticeDismissed(false);

    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const pageData = [];
    const words = {};

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;

      const content = await page.getTextContent();
      const pageWords = [];

      for (let idx = 0; idx < content.items.length; idx++) {
        const item = content.items[idx];
        if (!item.str.trim()) continue;
        const [, , , d, tx, ty] = item.transform;
        const fs = Math.abs(d) * SCALE;
        const baselineY = vp.height - ty * SCALE;
        const top = baselineY - fs;
        const left = tx * SCALE;
        const totalW = Math.max(item.width * SCALE, fs * 0.4);
        const h = fs * 1.4;

        const styleEntry = (content.styles && content.styles[item.fontName]) || {};
        const styleFamily = (styleEntry.fontFamily || "").toString();
        const fn = ((item.fontName || "") + " " + styleFamily).toLowerCase();
        let ff;
        if (styleFamily && /\w/.test(styleFamily)) {
          ff = `"${styleFamily}", Arial, sans-serif`;
          if (/serif/i.test(styleFamily)) ff = `"${styleFamily}", "Times New Roman", serif`;
          else if (/mono|courier/i.test(styleFamily)) ff = `"${styleFamily}", "Courier New", monospace`;
        } else if (fn.includes("times") || fn.includes("roman") || fn.includes("serif")) ff = "Times New Roman, serif";
        else if (fn.includes("courier") || fn.includes("mono")) ff = "Courier New, monospace";
        else if (fn.includes("georgia")) ff = "Georgia, serif";
        else if (fn.includes("verdana")) ff = "Verdana, sans-serif";
        else if (fn.includes("calibri") || fn.includes("segoe")) ff = "Calibri, \'Segoe UI\', Arial, sans-serif";
        else ff = "Arial, sans-serif";
        const bold = /bold|black|heavy|semibold|medium/.test(fn);
        const italic = /italic|oblique/.test(fn);

        const parts = item.str.split(/(\s+)/);
        const charW = totalW / Math.max(item.str.length, 1);
        let ox = 0;
        for (let wi = 0; wi < parts.length; wi++) {
          const word = parts[wi];
          const ww = word.length * charW;
          if (word.trim()) {
            pageWords.push({
              id: `${i}-${idx}-${wi}`,
              text: word, page: i,
              x: left + ox, y: top,
              baselineY, width: ww, height: h,
              fontSize: fs, fontFamily: ff,
              isBold: bold, isItalic: italic,
              edited: false,
            });
          }
          ox += ww;
        }
      }

      words[i] = pageWordsToTextBlocks(pageWords);
      pageData.push({ num: i, dataUrl: canvas.toDataURL("image/png"), width: vp.width, height: vp.height });
    }
    setPages(pageData);
    setPageOrder(pageData.map((_, i) => i));
    setRotatedPages({});
    setDeletedPages(new Set());
    setTextBlocks(words);
    setFloatingBoxes([]);
    setFloatingImages([]);
    setHistory([]);
    setActivePopup(null);
    setSelected(null);
    setZoom(1);
    // Detect no-text-layer PDFs (browser-printed, scanned, image-only)
    const totalWords = Object.values(words).reduce((acc, blocks) => acc + (blocks ? blocks.length : 0), 0);
    setHasTextLayer(totalWords > 0);
    setTextLayerNoticeDismissed(false);
  }

  useEffect(() => {
    for (const pg of pages) {
      const canvas = canvasRefs.current[pg.num];
      if (!canvas) continue;
      canvas.width = pg.width;
      canvas.height = pg.height;
      const edits = (textBlocks[pg.num] || []).filter(w => w.edited && activePopup?.blockId !== w.id);
      redrawPage(canvas, pg.dataUrl, edits);
    }
  }, [textBlocks, pages, activePopup]);

  // Mirror live state into a ref so snapshotCurrent always reads fresh values
  useEffect(() => {
    liveStateRef.current = {
      pdfBytes, pages, pageOrder, textBlocks, floatingBoxes, floatingImages, history, fileName, zoom, hasTextLayer, isEncrypted,
      rotatedPages, deletedPages,
    };
  });

  function snapshotCurrentTab() {
    if (!activeTabId) return;
    const snap = liveStateRef.current;
    tabSnapshots.current[activeTabId] = {
      ...snap,
      // Convert Set to Array for JSON serialization
      deletedPages: [...(snap.deletedPages || [])],
    };
  }

  function restoreSnapshot(snap) {
    setPdfBytes(snap.pdfBytes);
    setPages(snap.pages);
    setPageOrder(snap.pageOrder ?? snap.pages.map((_, i) => i));
    setRotatedPages(snap.rotatedPages || {});
    setDeletedPages(new Set(snap.deletedPages || []));
    setTextBlocks(snap.textBlocks);
    setFloatingBoxes(snap.floatingBoxes);
    setFloatingImages(snap.floatingImages);
    setHistory(snap.history);
    setFileName(snap.fileName);
    setZoom(snap.zoom);
    setHasTextLayer(snap.hasTextLayer !== undefined ? snap.hasTextLayer : true);
    setIsEncrypted(snap.isEncrypted ?? false);
    setEncryptionNoticeDismissed(false);
    setSelected(null);
    setActivePopup(null);
  }

  function switchTab(id) {
    if (id === activeTabId) return;
    snapshotCurrentTab();
    const snap = tabSnapshots.current[id];
    if (!snap) return;
    restoreSnapshot(snap);
    setActiveTabId(id);
  }

  // Close the editor entirely and return to the homepage. Wired to the
  // \'katanapdf\' wordmark in the editor toolbar — without this the link only
  // updates the URL hash and the editor still renders because pages.length > 0.
  function goHome() {
    tabSnapshots.current = {};
    setTabsList([]);
    setActiveTabId(null);
    setPages([]);
    setPageOrder([]);
    setRotatedPages({});
    setDeletedPages(new Set());
    setTextBlocks({});
    setFloatingBoxes([]);
    setFloatingImages([]);
    setHistory([]);
    setFileName("");
    setPdfBytes(null);
    setIsEncrypted(false);
    setEncryptionNoticeDismissed(false);
    setHasTextLayer(true);
    setTextLayerNoticeDismissed(false);
    setSelected(null);
    setActivePopup(null);
  }

  function closeTab(id) {
    delete tabSnapshots.current[id];
    setTabsList(prev => {
      const next = prev.filter(t => t.id !== id);
      if (id === activeTabId) {
        if (next.length) {
          // Activate the first remaining tab
          const newActive = next[0].id;
          const snap = tabSnapshots.current[newActive];
          if (snap) restoreSnapshot(snap);
          setActiveTabId(newActive);
        } else {
          // No tabs left — return to homepage
          setPages([]);
          setPageOrder([]);
          setRotatedPages({});
          setDeletedPages(new Set());
          setTextBlocks({});
          setFloatingBoxes([]);
          setFloatingImages([]);
          setHistory([]);
          setFileName("");
          setPdfBytes(null);
          setActiveTabId(null);
        }
      }
      return next;
    });
  }

  function makeTabId() {
    return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // Phase 6: page reorder. Swaps adjacent entries in pageOrder; pages[] and the
  // page-keyed state (textBlocks/floatingBoxes/floatingImages) stay untouched.
  function movePageUp(displayIdx) {
    if (displayIdx <= 0) return;
    saveHistory();
    setPageOrder(prev => {
      const next = [...prev];
      [next[displayIdx - 1], next[displayIdx]] = [next[displayIdx], next[displayIdx - 1]];
      return next;
    });
  }
  function movePageDown(displayIdx) {
    if (displayIdx >= pageOrder.length - 1) return;
    saveHistory();
    setPageOrder(prev => {
      const next = [...prev];
      [next[displayIdx + 1], next[displayIdx]] = [next[displayIdx], next[displayIdx + 1]];
      return next;
    });
  }

  // Phase 7: delete/rotate pages. These are soft-deletes/rotates, tracked in
  // state and applied to the UI immediately, but only committed to the PDF on
  // download.
  function deletePage(pageNum) {
    saveHistory();
    setDeletedPages(prev => new Set(prev).add(pageNum));
  }

  function rotatePage(pageNum) {
    saveHistory();
    setRotatedPages(prev => ({
      ...prev,
      [pageNum]: ((prev[pageNum] || 0) + 90) % 360,
    }));
  }

  async function createBlankPdf() {
    snapshotCurrentTab();
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]); // US Letter
    const bytes = await doc.save();
    setFileName("blank.pdf");
    await loadPdfFromBytes(bytes);
    const id = makeTabId();
    setTabsList(prev => [...prev, { id, fileName: "blank.pdf" }]);
    setActiveTabId(id);
  }

  async function handleDroppedFile(file) {
    if (!file) return;
    try {
      snapshotCurrentTab();
      await loadPdfFromFile(file);
      const id = makeTabId();
      setTabsList(prev => [...prev, { id, fileName: file.name.match(/\.pdf$/i) ? file.name : file.name.replace(/\.[^/.]+$/, "") + ".pdf" }]);
      setActiveTabId(id);
    } catch (err) {
      console.error("Drop error:", err);
    }
  }

  function saveHistory() {
    setHistory(prev => [...prev.slice(-29), {
      textBlocks: JSON.parse(JSON.stringify(textBlocks)),
      floatingBoxes: JSON.parse(JSON.stringify(floatingBoxes)),
      floatingImages: JSON.parse(JSON.stringify(floatingImages)),
      // Phase 7 history
      rotatedPages: { ...rotatedPages },
      deletedPages: new Set(deletedPages),
    }]);
  }

  function undo() {
    if (!history.length) return;
    const snap = history[history.length - 1];
    setTextBlocks(snap.textBlocks);
    setFloatingBoxes(snap.floatingBoxes);
    setFloatingImages(snap.floatingImages || []);
    // Phase 7 history
    if (snap.rotatedPages) setRotatedPages(snap.rotatedPages);
    if (snap.deletedPages) setDeletedPages(snap.deletedPages);
    setHistory(h => h.slice(0, -1));
    setActivePopup(null);
    setSelected(null);
  }

  function commitEdit(blockId, pageNum, newText) {
    setTextBlocks(prev => ({
      ...prev,
      [pageNum]: prev[pageNum].map(w => {
        if (w.id !== blockId) return w;
        return { ...w, text: newText, edited: true, fontFamily, fontSize: fontSize * SCALE, isBold, isItalic, lineBaselines: undefined };
      }),
    }));
    setActivePopup(null);
    setSelected(null);
  }

  function cancelEdit() {
    setActivePopup(null);
    setSelected(null);
  }

  function clickTextBlock(tb, e) {
    e.stopPropagation();
    if (activePopup?.blockId === tb.id) return;
    if (!tb.edited) saveHistory();
    setSelected(tb.id);
    setFontFamily(tb.fontFamily);
    setFontSize(Math.round(tb.fontSize / SCALE));
    setIsBold(tb.isBold);
    setIsItalic(tb.isItalic);
    setActivePopup({ blockId: tb.id, pageNum: tb.page, offsetX: 0, offsetY: 0 });
  }

  function handleBgClick() {
    setActivePopup(null);
    setSelected(null);
  }

  function handleWheel(e) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.min(3, Math.max(0.3, +(z - e.deltaY * 0.001).toFixed(2))));
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  function addFloatingBox(pageNum) {
    saveHistory();
    floatingIdCounter++;
    const id = `float-${floatingIdCounter}`;
    setFloatingBoxes(prev => [...prev, {
      id, page: pageNum,
      // z baselines stack newer overlays above older ones; bumped on every
      // create so a text box added after an image lands on top of it.
      z: 50 + floatingIdCounter,
      x: 80, y: 80, text: "New text",
      fontSize: 14, fontFamily: "Arial, sans-serif",
      isBold: false, isItalic: false, color: "#000000",
    }]);
    setSelected(id); // auto-select so the textarea focuses immediately
  }

  function updateFloatingBox(id, updates) {
    setFloatingBoxes(prev => prev.map(fb => fb.id === id ? { ...fb, ...updates } : fb));
  }

  function deleteFloatingBox(id) {
    saveHistory();
    setFloatingBoxes(prev => prev.filter(fb => fb.id !== id));
  }

  function handleAddImage(e, pageNum) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = ev => {
      saveHistory();
      floatingIdCounter++;
      const id = `img-${floatingIdCounter}`;
      setFloatingImages(prev => [...prev, {
        id, page: pageNum,
        z: 50 + floatingIdCounter,
        x: 60, y: 60, w: 200, h: 150,
        dataUrl: ev.target.result,
      }]);
      setSelected(id);
    };
    reader.readAsDataURL(file);
  }

  // Append another PDF\'s pages to the current document — fully editable like original pages
  async function handleAddPdfAsImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    try {
      saveHistory();
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;

      // Pick up where current pages end
      const startNum = pages.length + 1;
      const newPages = [];
      const newWords = { ...textBlocks };

      for (let i = 1; i <= pdf.numPages; i++) {
        const pgNum = startNum + i - 1;
        const page = await pdf.getPage(i);
        const vp = page.getViewport({ scale: SCALE });
        const c = document.createElement("canvas");
        c.width = vp.width;
        c.height = vp.height;
        await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;

        const content = await page.getTextContent();
        const pageWords = [];
        for (let idx = 0; idx < content.items.length; idx++) {
          const item = content.items[idx];
          if (!item.str.trim()) continue;
          const [, , , d, tx, ty] = item.transform;
          const fs = Math.abs(d) * SCALE;
          const baselineY = vp.height - ty * SCALE;
          const top = baselineY - fs;
          const left = tx * SCALE;
          const totalW = Math.max(item.width * SCALE, fs * 0.4);
          const h = fs * 1.4;
          const fn = (item.fontName || "").toLowerCase();
          let ff = "Arial, sans-serif";
          if (fn.includes("times") || fn.includes("roman")) ff = "Times New Roman, serif";
          else if (fn.includes("courier") || fn.includes("mono")) ff = "Courier New, monospace";
          else if (fn.includes("georgia")) ff = "Georgia, serif";
          const bold = fn.includes("bold");
          const italic = fn.includes("italic") || fn.includes("oblique");
          const parts = item.str.split(/(\s+)/);
          const charW = totalW / Math.max(item.str.length, 1);
          let ox = 0;
          for (let wi = 0; wi < parts.length; wi++) {
            const word = parts[wi];
            const ww = word.length * charW;
            if (word.trim()) {
              pageWords.push({
                id: `${pgNum}-${idx}-${wi}`, text: word, page: pgNum,
                x: left + ox, y: top, baselineY, width: ww, height: h,
                fontSize: fs, fontFamily: ff, isBold: bold, isItalic: italic, edited: false,
              });
            }
            ox += ww;
          }
        }
        newWords[pgNum] = pageWordsToTextBlocks(pageWords);
        newPages.push({ num: pgNum, dataUrl: c.toDataURL("image/png"), width: vp.width, height: vp.height });
      }

      // Stage 1: keep pdfBytes in sync with the visible page list so the
      // default export path includes appended pages with their original
      // vector content. Without this, handleDownload silently drops them
      // (the docPages[pgIdx] lookup returns undefined past the original
      // page count). On merge failure the canvas fallback in handleDownload
      // catches the mismatch and rasterises instead.
      let mergedBytes = pdfBytes;
      try {
        const baseDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        const addedDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copied = await baseDoc.copyPages(addedDoc, addedDoc.getPageIndices());
        for (const p of copied) baseDoc.addPage(p);
        mergedBytes = await baseDoc.save();
      } catch (mergeErr) {
        console.warn("Append-PDF merge failed; download will use canvas fallback for the appended pages:", mergeErr);
      }

      setPages(prev => [...prev, ...newPages]);
      // Append the new page indices onto pageOrder so merged pages land at the end.
      setPageOrder(prev => [...prev, ...newPages.map((_, j) => prev.length + j)]);
      setTextBlocks(newWords);
      setPdfBytes(mergedBytes);
    } catch (err) {
      console.error("Add PDF error:", err);
      alert("Couldn\'t append this PDF: " + (err.message || err));
    }
  }

  function deleteFloatingImage(id) {
    saveHistory();
    setFloatingImages(prev => prev.filter(fi => fi.id !== id));
  }

  function startDragImg(e, fi) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(fi.id);
    imgDragOrigin.current = { mx: e.clientX, my: e.clientY, x: fi.x, y: fi.y };
    setDraggingImg({ id: fi.id });
  }

  function startResizeImg(e, fi) {
    e.preventDefault();
    e.stopPropagation();
    imgResizeOrigin.current = { mx: e.clientX, my: e.clientY, w: fi.w, h: fi.h };
    setResizingImg({ id: fi.id });
  }

  // Drag the corner handle on a text box to scale fontSize. Diagonal drag
  // (down-right grows, up-left shrinks) feels closest to the picture
  // resize that scales the image.
  function startResizeFb(e, fb) {
    e.preventDefault();
    e.stopPropagation();
    fbResizeOrigin.current = { mx: e.clientX, my: e.clientY, fs: fb.fontSize };
    setResizingFb({ id: fb.id });
  }

  function startDragFloat(e, fb) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(fb.id);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragging({ id: fb.id });
  }

  const onMouseMove = useCallback((e) => {
    if (dragging) {
      let pageEl = null;
      containerRef.current?.querySelectorAll("[data-pgwrap]").forEach(el => {
        const r = el.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) pageEl = el;
      });
      if (!pageEl) return;
      const r = pageEl.getBoundingClientRect();
      setFloatingBoxes(prev => prev.map(fb => fb.id === dragging.id
        ? { ...fb, x: Math.max(0, e.clientX - r.left - dragOffset.current.x), y: Math.max(0, e.clientY - r.top - dragOffset.current.y) }
        : fb
      ));
    }
    if (draggingImg) {
      const o = imgDragOrigin.current;
      if (!o) return;
      setFloatingImages(prev => prev.map(fi => fi.id === draggingImg.id
        ? { ...fi, x: Math.max(0, o.x + e.clientX - o.mx), y: Math.max(0, o.y + e.clientY - o.my) }
        : fi
      ));
    }
    if (resizingImg) {
      const o = imgResizeOrigin.current;
      if (!o) return;
      setFloatingImages(prev => prev.map(fi => fi.id === resizingImg.id
        ? { ...fi, w: Math.max(40, o.w + e.clientX - o.mx), h: Math.max(40, o.h + e.clientY - o.my) }
        : fi
      ));
    }
    if (resizingFb) {
      const o = fbResizeOrigin.current;
      if (!o) return;
      const dx = e.clientX - o.mx;
      const dy = e.clientY - o.my;
      const delta = (dx + dy) / 2;
      const newFs = Math.max(6, Math.min(200, Math.round(o.fs + delta * 0.18)));
      setFloatingBoxes(prev => prev.map(fb => fb.id === resizingFb.id
        ? { ...fb, fontSize: newFs }
        : fb
      ));
    }
  }, [dragging, draggingImg, resizingImg, resizingFb]);

  const onMouseUp = useCallback(() => {
    setDragging(null);
    setDraggingImg(null);
    setResizingImg(null);
    setResizingFb(null);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  function pickPdfLibFont(fonts, family, bold, italic) {
    const f = (family || "").toLowerCase();
    // Noto Sans has full set; Noto Serif has regular + bold; Noto Sans Mono has
    // regular only. Fall back to the closest variant we shipped.
    if (f.includes("times") || f.includes("georgia") || f.includes("serif")) {
      return bold ? fonts.timesB : fonts.times;
    }
    if (f.includes("courier") || f.includes("mono")) {
      return fonts.courier;
    }
    if (bold && italic) return fonts.helvBI;
    if (bold) return fonts.helvB;
    if (italic) return fonts.helvI;
    return fonts.helv;
  }

  function hexToRgb(hex) {
    const m = (hex || "").match(/^#?([0-9a-f]{6})$/i);
    if (!m) return rgb(0, 0, 0);
    const n = parseInt(m[1], 16);
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }

  async function handleDownload() {
    if (!pages.length) { alert("No PDF loaded."); return; }
    try {
      // Phase 3: don\'t silently strip encryption. Try strict first; only
      // fall back to ignoreEncryption: true if we hit an actual encryption
      // error — and the user has already been warned via the banner that
      // loadPdfFromBytes set up. Other parse failures still go to the
      // canvas fallback as before.
      let srcDoc;
      try {
        srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
      } catch (loadErr) {
        if (/encrypt/i.test(loadErr?.message || "")) {
          try {
            srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
          } catch (innerErr) {
            console.warn("pdf-lib couldn\'t parse this encrypted PDF, falling back to canvas:", innerErr.message);
            return await handleDownloadCanvasFallback();
          }
        } else {
          console.warn("pdf-lib couldn\'t parse this PDF, falling back to canvas:", loadErr.message);
          return await handleDownloadCanvasFallback();
        }
      }

      const srcPages = srcDoc.getPages();
      // Stage 1 guard: if pdfBytes has fewer pages than the editor state
      // (e.g. an Add-PDF merge failed earlier), the loop below would silently
      // skip the missing pages. Fall through to the canvas fallback so every
      // visible page lands in the export — even if at raster quality.
      if (srcPages.length < pages.length) {
        console.warn(`pdfBytes has ${srcPages.length} pages but state has ${pages.length}; using canvas fallback to preserve every page.`);
        return await handleDownloadCanvasFallback();
      }
      // Stage 2 guard: when a page has a non-zero /Rotate value the canvas
      // we captured is already the visually-rotated bitmap, but the overlay
      // math below still uses pre-rotation page coordinates so text/images
      // would land in the wrong place. Defer to the canvas fallback for
      // these pages until full rotation math is in. Loses vector quality on
      // rotated pages only.
      const hasSrcRotation = srcPages.some(p => {
        const r = p.getRotation();
        return r && typeof r.angle === "number" && r.angle % 360 !== 0;
      });
      // Phase 7: if we have local rotations, we must use canvas fallback for now.
      if (hasSrcRotation || Object.keys(rotatedPages).length > 0) {
        console.warn("Rotated page detected; falling back to canvas export so overlays land correctly.");
        return await handleDownloadCanvasFallback();
      }

      // Phase 6: build a new doc and copyPages from src in the user\'s pageOrder
      // so reorders survive download. When pageOrder is identity this is a no-op
      // beyond the small copyPages overhead. Phase 5 fonts embed on newDoc (not src).
      // Phase 7: filter out deleted pages from the final document.
      const finalPageOrder = pageOrder.filter(pIdx => !deletedPages.has(pages[pIdx].num));
      const doc = await PDFDocument.create();
      doc.registerFontkit(fontkit);
      const noto = await loadNotoFontBytes();
      const fonts = {
        helv: await doc.embedFont(noto["noto-sans-regular"], { subset: true }),
        helvB: await doc.embedFont(noto["noto-sans-bold"], { subset: true }),
        helvI: await doc.embedFont(noto["noto-sans-italic"], { subset: true }),
        helvBI: await doc.embedFont(noto["noto-sans-bold-italic"], { subset: true }),
        times: await doc.embedFont(noto["noto-serif-regular"], { subset: true }),
        timesB: await doc.embedFont(noto["noto-serif-bold"], { subset: true }),
        courier: await doc.embedFont(noto["noto-sans-mono-regular"], { subset: true }),
      };
      const copiedPages = await doc.copyPages(srcDoc, finalPageOrder);
      for (const p of copiedPages) doc.addPage(p);

      for (let displayIdx = 0; displayIdx < copiedPages.length; displayIdx++) {
        const pg = pages[finalPageOrder[displayIdx]];
        const pdfPage = doc.getPages()[displayIdx];
        if (!pdfPage || !pg) continue;
        const { width: pdfW, height: pdfH } = pdfPage.getSize();
        const sx = pdfW / pg.width;
        const sy = pdfH / pg.height;

        // 1. Edited original text → white rectangle over the original area + new text on top
        const edits = (textBlocks[pg.num] || []).filter(w => w.edited);
        for (const e of edits) {
          const text = e.text || "";
          const lines = text.split(/\r?\n/);
          const numLines = Math.max(1, lines.length);
          const lhCanvas = e.fontSize * 1.22;
          const useBaselines = e.lineBaselines && e.lineBaselines.length === lines.length;
          let whiteHCanvas;
          if (useBaselines && lines.length > 1) {
            const bs = e.lineBaselines;
            whiteHCanvas = Math.max(e.height + 12, Math.max(...bs) - Math.min(...bs) + lhCanvas + 16);
          } else {
            whiteHCanvas = Math.max(e.height + 12, numLines * lhCanvas + 14);
          }
          const padX = 4;
          const whiteW = (e.width + padX * 2) * sx;
          const whiteH = whiteHCanvas * sy;
          const whiteX = (e.x - padX) * sx;
          const yTopCanvas = e.y - 4;
          const yBottomPdf = pdfH - (yTopCanvas + whiteHCanvas) * sy;
          pdfPage.drawRectangle({ x: whiteX, y: yBottomPdf, width: whiteW, height: whiteH, color: rgb(1, 1, 1) });

          if (lines.some(l => l.length > 0)) {
            const font = pickPdfLibFont(fonts, e.fontFamily, e.isBold, e.isItalic);
            const fs = e.fontSize * sy;
            lines.forEach((ln, i) => {
              if (!ln) return;
              const baselineCanvas = (useBaselines && e.lineBaselines[i] != null)
                ? e.lineBaselines[i]
                : (e.baselineY + i * lhCanvas);
              const yPdf = pdfH - baselineCanvas * sy;
              try {
                pdfPage.drawText(ln, { x: e.x * sx, y: yPdf, size: fs, font, color: rgb(0, 0, 0) });
              } catch {}
            });
          }
        }

        // 2. New floating text boxes
        for (const fb of floatingBoxes.filter(f => f.page === pg.num)) {
          const text = fb.text || "";
          if (!text) continue;
          const font = pickPdfLibFont(fonts, fb.fontFamily, fb.isBold, fb.isItalic);
          const fs = fb.fontSize * sy;
          const lhCanvas = fb.fontSize * 1.5;
          const lines = text.split(/\r?\n/);
          const color = hexToRgb(fb.color || "#000000");
          lines.forEach((ln, i) => {
            if (!ln) return;
            // baseline ~ y_top + fontSize (alphabetic)
            const baselineCanvas = fb.y + i * lhCanvas + fb.fontSize * 0.85;
            const yPdf = pdfH - baselineCanvas * sy;
            try {
              pdfPage.drawText(ln, { x: fb.x * sx, y: yPdf, size: fs, font, color });
            } catch {}
          });
        }

        // 3. Floating images
        for (const fi of floatingImages.filter(f => f.page === pg.num)) {
          const isJpg = /^data:image\/jpe?g/i.test(fi.dataUrl);
          const data = await (await fetch(fi.dataUrl)).arrayBuffer();
          let img;
          try {
            img = isJpg ? await doc.embedJpg(data) : await doc.embedPng(data);
          } catch {
            try { img = await doc.embedPng(data); } catch { continue; }
          }
          const x = fi.x * sx;
          const w = fi.w * sx;
          const h = fi.h * sy;
          const yPdf = pdfH - (fi.y + fi.h) * sy;
          pdfPage.drawImage(img, { x, y: yPdf, width: w, height: h });
        }
      }

      const bytes = await doc.save();
      triggerPdfDownload(bytes);

    } catch (err) {
      console.error("Download error:", err);
      alert("Download failed: " + err.message);
    }
  }

  function triggerPdfDownload(bytes) {
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (fileName || "document").replace(/\.pdf$/i, "") + "_edited.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Fallback used when pdf-lib can\'t parse the original PDF (rare): rasterise via canvas.
  async function handleDownloadCanvasFallback() {
    const doc = await PDFDocument.create();
    // Phase 6+7: iterate by pageOrder, filtering deleted, so reorders/deletes apply in the canvas path too.
    const finalPageOrder = pageOrder.filter(pIdx => !deletedPages.has(pages[pIdx].num));

    for (const i of finalPageOrder) {
      const pg = pages[i];
      if (!pg) continue;
      const canvas = canvasRefs.current[pg.num];
      if (!canvas) continue;
      canvas.width = pg.width;
      canvas.height = pg.height;
      const ctx = canvas.getContext("2d");

      const rotation = rotatedPages[pg.num] || 0;
      await new Promise(resolve => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); resolve(); };
        img.src = pg.dataUrl;
      });

      const edits = (textBlocks[pg.num] || []).filter(w => w.edited);
      for (const e of edits) {
        const lines = e.text.split(/\r?\n/);
        const lh = e.fontSize * 1.22;
        const lineCount = Math.max(1, lines.length);
        const useBaselines = e.lineBaselines && e.lineBaselines.length === lines.length;
        ctx.font = `${e.isItalic ? "italic " : ""}${e.isBold ? "bold " : ""}${e.fontSize}px ${e.fontFamily}`;
        let maxLineW = e.width;
        for (const ln of lines) maxLineW = Math.max(maxLineW, ctx.measureText(ln || " ").width);
        let whiteH;
        if (useBaselines && lines.length > 1) {
          const bs = e.lineBaselines;
          whiteH = Math.max(e.height + 12, Math.max(...bs) - Math.min(...bs) + lh + 16);
        } else {
          whiteH = Math.max(e.height + 12, lineCount * lh + 14);
        }
        ctx.fillStyle = "#fff";
        ctx.fillRect(e.x - 2, e.y - 2, maxLineW + 14, whiteH + 8);
        ctx.fillStyle = "#000";
        ctx.textBaseline = "alphabetic";
        if (useBaselines) lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.lineBaselines[i]));
        else lines.forEach((ln, i) => ctx.fillText(ln, e.x, e.baselineY + i * lh));
      }
      for (const fb of floatingBoxes.filter(f => f.page === pg.num)) {
        const lines = fb.text.split(/\r?\n/);
        ctx.font = `${fb.isItalic ? "italic " : ""}${fb.isBold ? "bold " : ""}${fb.fontSize}px ${fb.fontFamily}`;
        ctx.fillStyle = fb.color || "#000";
        ctx.textBaseline = "top";
        lines.forEach((ln, i) => ctx.fillText(ln, fb.x, fb.y + i * fb.fontSize * 1.5));
      }
      for (const fi of floatingImages.filter(f => f.page === pg.num)) {
        await new Promise(resolve => {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, fi.x, fi.y, fi.w, fi.h); resolve(); };
          img.src = fi.dataUrl;
        });
      }

      const pngBytes = await (await fetch(canvas.toDataURL("image/png"))).arrayBuffer();
      const pngImg = await doc.embedPng(pngBytes);
      const pdfPage = doc.addPage([pg.width / SCALE, pg.height / SCALE]);
      pdfPage.setRotation(degrees(rotation));
      pdfPage.drawImage(pngImg, { x: 0, y: 0, width: pg.width / SCALE, height: pg.height / SCALE });
    }
    const bytes = await doc.save();
    triggerPdfDownload(bytes);
  }

  const isNoFile = pages.length === 0;
  const visiblePages = pageOrder.map(pIdx => pages[pIdx]).filter(pg => pg && !deletedPages.has(pg.num));

  return (
    <div style={{ fontFamily: FELL, minHeight: "100vh", background: PARCHMENT, backgroundImage: CROSSHATCH, userSelect: dragging ? "none" : "auto" }} onClick={handleBgClick}>
      {route !== "home" ? (
        <StaticPage route={route} />
      ) : isNoFile ? (
        <Homepage
          onFile={handleFile}
          onDropFile={handleDroppedFile}
          onCreateBlank={createBlankPdf}
        />
      ) : (
        <>
          <div data-edit-toolbar style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px", height: 52, background: INK, borderBottom: `1px solid ${GOLD}`, position: "sticky", top: 0, zIndex: 300, flexWrap: "wrap" }} onClick={e => e.stopPropagation()}>
            <a href="#home" onClick={(e) => { e.preventDefault(); goHome(); window.location.hash = "#home"; }} style={{ textDecoration: "none" }}>
              <span style={{ fontFamily: CINZEL, fontSize: 14, color: PARCHMENT, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>katanapdf</span>
            </a>
            <div style={{ width: 1, height: 24, background: "rgba(196,150,58,0.4)", margin: "0 4px" }} />
            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} style={tbSelect}>
              <option value="Arial, sans-serif">Arial</option>
              <option value="Times New Roman, serif">Times New Roman</option>
              <option value="Courier New, monospace">Courier</option>
              <option value="Georgia, serif">Georgia</option>
            </select>
            <select value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} style={{ ...tbSelect, width: 58, textAlign: "center" }}>
              {[6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72,80,96,120].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={() => setIsBold(b => !b)} style={{ ...tbIconBtn, fontWeight: 900, background: isBold ? LACQUER : "transparent", color: isBold ? PARCHMENT : GOLD, borderColor: isBold ? GOLD : "rgba(196,150,58,0.4)" }}>B</button>
            <button onClick={() => setIsItalic(i => !i)} style={{ ...tbIconBtn, fontStyle: "italic", background: isItalic ? LACQUER : "transparent", color: isItalic ? PARCHMENT : GOLD, borderColor: isItalic ? GOLD : "rgba(196,150,58,0.4)" }}>I</button>
            <div style={{ width: 1, height: 24, background: "rgba(196,150,58,0.4)", margin: "0 4px" }} />
            <label style={tbBtn}>Open PDF/Image <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleFile} style={hiddenFileInput} /></label>
            <label style={tbBtn} title="Add a PDF at the end">Merge PDF <input type="file" accept="application/pdf,.pdf" onChange={handleAddPdfAsImage} style={hiddenFileInput} /></label>
            <button onClick={undo} disabled={!history.length} style={{ ...tbBtn, opacity: history.length ? 1 : 0.3 }}>↩ Undo</button>
            <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))} style={tbIconBtn}>+</button>
            <span style={{ fontSize: 11, color: "#555", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} style={tbIconBtn}>−</button>
            <div style={{ flex: 1 }} />
            <button onClick={handleDownload} style={{ padding: "8px 20px", background: LACQUER, color: PARCHMENT, border: `1px solid ${GOLD}`, cursor: "pointer", fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, outline: `1px solid ${LACQUER}`, outlineOffset: 2 }}>Download PDF</button>
          </div>

          {/* TABS STRIP — one PDF per tab */}
          {tabsList.length > 0 && (
            <div onClick={e => e.stopPropagation()} style={{
              background: PARCHMENT_2, borderBottom: `1px solid rgba(139,26,26,0.25)`,
              padding: "8px 16px", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
              position: "sticky", top: 52, zIndex: 290,
            }}>
              {tabsList.map(t => {
                const isActive = t.id === activeTabId;
                return (
                  <div key={t.id} onClick={() => switchTab(t.id)} style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "5px 10px 5px 14px",
                    border: `1px solid ${isActive ? GOLD : "rgba(139,26,26,0.3)"}`,
                    background: isActive ? INK : "transparent",
                    color: isActive ? GOLD : INK,
                    fontFamily: CINZEL, fontSize: 11, letterSpacing: 2, textTransform: "uppercase",
                    cursor: "pointer", maxWidth: 220,
                  }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.fileName.replace(/\.pdf$/i, "")}
                    </span>
                    <span onClick={e => { e.stopPropagation(); closeTab(t.id); }}
                      title="Close" style={{
                        cursor: "pointer", padding: "0 4px", fontWeight: 700,
                        opacity: 0.7,
                      }}>✕</span>
                  </div>
                );
              })}
              <label style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 30, height: 26,
                border: `1px solid ${LACQUER}`, color: LACQUER,
                fontFamily: CINZEL, fontSize: 16, fontWeight: 600, cursor: "pointer",
              }} title="Open another PDF or Image in a new tab">
                +
                <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleFile} style={hiddenFileInput} />
              </label>
            </div>
          )}

          {pages.length > 0 && isEncrypted && !encryptionNoticeDismissed && (
            <div onClick={e => e.stopPropagation()} style={{
              maxWidth: 1600, margin: "20px auto 0", padding: "14px 20px",
              background: PARCHMENT_2, borderLeft: `3px solid ${LACQUER}`,
              fontFamily: FELL, fontSize: 14, lineHeight: 1.5, color: INK,
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontFamily: CINZEL, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Password-protected PDF
                </strong>
                This PDF is password-protected. Decrypted contents may not save correctly. Decrypt it first, then re-open.
              </div>
              <button onClick={() => setEncryptionNoticeDismissed(true)} aria-label="Dismiss password-protected notice" style={{
                background: "transparent", border: "none", color: LACQUER,
                fontFamily: CINZEL, fontSize: 14, cursor: "pointer", padding: "0 4px", fontWeight: 700,
              }}>✕</button>
            </div>
          )}

          {pages.length > 0 && !hasTextLayer && !textLayerNoticeDismissed && (
            <div onClick={e => e.stopPropagation()} style={{
              maxWidth: 1600, margin: "20px auto 0", padding: "14px 20px",
              background: PARCHMENT_2, borderLeft: `3px solid ${LACQUER}`,
              fontFamily: FELL, fontSize: 14, lineHeight: 1.5, color: INK,
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontFamily: CINZEL, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  No editable text in this PDF
                </strong>
                This PDF doesn't have a selectable text layer — it's likely a scanned image or printed from a browser. You can't edit the existing text, but you can still <em>add new text and images</em> on top using the buttons on each page.
              </div>
              <button onClick={() => setTextLayerNoticeDismissed(true)} style={{
                background: "transparent", border: "none", color: LACQUER,
                fontFamily: CINZEL, fontSize: 14, cursor: "pointer", padding: "0 4px", fontWeight: 700,
              }}>✕</button>
            </div>
          )}

          <div ref={containerRef} style={{ padding: "40px 0 80px", display: "flex", flexDirection: "column", alignItems: "center", gap: 48 }}>
            {visiblePages.map((pg, displayIdx) => {
              if (!pg) return null;
              const rotation = rotatedPages[pg.num] || 0;
              const swap = rotation === 90 || rotation === 270;
              const dispW = (swap ? pg.height : pg.width) * zoom;
              const dispH = (swap ? pg.width : pg.height) * zoom;
              const isFirst = displayIdx === 0;
              const isLast = displayIdx === visiblePages.length - 1;
              return (
                <div key={pg.num}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, width: Math.min(dispW, window.innerWidth * 0.96) }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Page {displayIdx + 1}</span>
                      {/* Phase 6: reorder controls. Disabled at the ends; reorder mutates pageOrder, not the source PDF, until download. */}
                      <button onClick={e => { e.stopPropagation(); movePageUp(displayIdx); }} disabled={isFirst} aria-label={`Move page ${displayIdx + 1} up`} title="Move page up" style={{ ...pageBtn, padding: "4px 8px", opacity: isFirst ? 0.3 : 1, cursor: isFirst ? "default" : "pointer" }}>↑</button>
                      <button onClick={e => { e.stopPropagation(); movePageDown(displayIdx); }} disabled={isLast} aria-label={`Move page ${displayIdx + 1} down`} title="Move page down" style={{ ...pageBtn, padding: "4px 8px", opacity: isLast ? 0.3 : 1, cursor: isLast ? "default" : "pointer" }}>↓</button>
                      <button onClick={e => { e.stopPropagation(); rotatePage(pg.num); }} aria-label={`Rotate page ${displayIdx + 1}`} title="Rotate page 90°" style={{ ...pageBtn, padding: "4px 8px" }}>↻</button>
                      <button onClick={e => { e.stopPropagation(); deletePage(pg.num); }} aria-label={`Delete page ${displayIdx + 1}`} title="Delete page" style={{ ...pageBtn, padding: "4px 8px" }}>×</button>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={pageBtn}>+ Add text</button>
                      <label style={pageBtn}>
                        + Add image
                        <input type="file" accept="image/*" onChange={e => handleAddImage(e, pg.num)} style={hiddenFileInput} />
                      </label>
                    </div>
                  </div>
                  <div data-pgwrap={pg.num} onClick={e => { e.stopPropagation(); setSelected(null); setActivePopup(null); }} style={{ position: "relative", width: dispW, height: dispH, maxWidth: "96vw", boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden" }}>
                    <div style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: pg.width * zoom,
                      height: pg.height * zoom,
                      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                      transformOrigin: "center center"
                    }}>
                      <canvas ref={(el) => { if (el) canvasRefs.current[pg.num] = el; else delete canvasRefs.current[pg.num]; }} style={{ display: "block", width: pg.width * zoom, height: pg.height * zoom }} />
                      {(textBlocks[pg.num] || []).map(tb => {
                        const isOpen = activePopup?.blockId === tb.id;
                        return (
                          <div key={tb.id} style={{
                            position: "absolute", left: tb.x * zoom, top: tb.y * zoom,
                            width: Math.max(tb.width * zoom, 8),
                            height: Math.max(tb.height * zoom, tb.fontSize * zoom * 0.9),
                            // When the popup is open, lift the whole wrapper above floating images
                            // (which use z = 50 + counter, ~1000 when selected) so the popup renders on top.
                            zIndex: isOpen ? 3000 : 10, cursor: "text",
                          }} onClick={e => clickTextBlock(tb, e)}>
                            {isOpen && (
                              <EditPopup block={tb} zoom={zoom} fontSize={fontSize} fontFamily={fontFamily} isBold={isBold} isItalic={isItalic}
                                offsetX={activePopup.offsetX ?? 0} offsetY={activePopup.offsetY ?? 0}
                                onOffsetChange={(ox, oy) => setActivePopup(ap => (ap && ap.blockId === tb.id ? { ...ap, offsetX: ox, offsetY: oy } : ap))}
                                onCommit={newText => commitEdit(tb.id, tb.page, newText)}
                                onCancel={cancelEdit} />
                            )}
                          </div>
                        );
                      })}
                      {floatingBoxes.filter(fb => fb.page === pg.num).map(fb => (
                        <FloatingBox key={fb.id} fb={fb} isSel={selected === fb.id}
                          onSelect={() => setSelected(fb.id)}
                          onStartDrag={e => startDragFloat(e, fb)}
                          onStartResize={e => startResizeFb(e, fb)}
                          onUpdate={u => updateFloatingBox(fb.id, u)}
                          onCommit={() => setSelected(null)}
                          onDelete={() => deleteFloatingBox(fb.id)} />
                      ))}
                      {floatingImages.filter(fi => fi.page === pg.num).map(fi => (
                        <FloatingImage key={fi.id} fi={fi} isSel={selected === fi.id} zoom={zoom}
                          onSelect={() => setSelected(fi.id)}
                          onDeselect={() => setSelected(null)}
                          onStartDrag={e => startDragImg(e, fi)}
                          onStartResize={e => startResizeImg(e, fi)}
                          onDelete={() => deleteFloatingImage(fi.id)} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// iOS-friendly hidden file input — display:none breaks file picker on some iOS Safari versions
const hiddenFileInput = { position: "absolute", width: 0.1, height: 0.1, opacity: 0, overflow: "hidden", pointerEvents: "none" };
const tbBtn = { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", border: "1px solid rgba(196,150,58,0.4)", fontSize: 11, background: "transparent", color: GOLD, cursor: "pointer", userSelect: "none", fontFamily: CINZEL, letterSpacing: 2, textTransform: "uppercase" };
const tbIconBtn = { width: 28, height: 28, border: "1px solid rgba(196,150,58,0.4)", fontSize: 13, background: "transparent", color: GOLD, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CINZEL, padding: 0 };
const tbSelect = { padding: "4px 8px", border: "1px solid rgba(196,150,58,0.4)", fontSize: 12, background: INK, color: PARCHMENT, cursor: "pointer", fontFamily: CINZEL, letterSpacing: 1 };
const pageBtn = { padding: "7px 16px", border: `1px solid ${GOLD}`, fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, background: "transparent", color: LACQUER, cursor: "pointer", userSelect: "none" };
