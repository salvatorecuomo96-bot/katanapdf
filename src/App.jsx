import { useRef, useState, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Legacy build is transpiled for older Safari / iOS — improves cross-device compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).href;

const SCALE = 2;

function KatanaLogo({ size = 36 }) {
  if (size >= 40) {
    return (
      <img
        src="/logo.png"
        alt="katanapdf"
        style={{ width: "min(520px, 85vw)", height: "auto", objectFit: "contain", display: "block" }}
      />
    );
  }
  return (
    <img
      src="/logo.png"
      alt="katanapdf"
      style={{ height: size * 1.5, width: "auto", objectFit: "contain" }}
    />
  );
}
function KatanaLogoSVG({ size = 36 }) {
  return (
    <svg width={size * 6} height={size * 1.8} viewBox="0 0 300 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ── KATANA — tip LEFT, handle RIGHT ── */}
      {/* Nagasa (blade) — curved steel, tip at left */}
      <path d="M7 24 Q110 18 212 26 L212 30 Q110 24 9 26 Z" fill="#909090"/>
      {/* Ha (cutting edge) — bright silver upper edge */}
      <path d="M7 24 Q110 18 210 26 L7 25 Z" fill="#d8d8d8"/>
      {/* Edge highlight shimmer */}
      <path d="M12 24 Q110 18.5 208 26.5" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" fill="none"/>
      {/* Habaki (blade collar) */}
      <rect x="210" y="21" width="7" height="13" rx="1.5" fill="#c8c8c8"/>
      {/* Tsuba (guard) — layered oval */}
      <ellipse cx="221" cy="27" rx="6" ry="17" fill="#b8b8b8"/>
      <ellipse cx="221" cy="27" rx="4.5" ry="13" fill="#a0a0a0"/>
      <ellipse cx="221" cy="27" rx="2.5" ry="8" fill="#888"/>
      {/* Tsuka (grip) — handle on right */}
      <rect x="227" y="20" width="68" height="14" rx="7" fill="#6e6e6e"/>
      {/* Ito wrap — diagonal cross pattern */}
      {[232,239,246,253,260,267,274,281,288].map((x, i) => (
        <line key={i} x1={x} y1="20" x2={x + 5} y2="34" stroke="#333" strokeWidth="1.6" opacity="0.85"/>
      ))}
      {/* Kashira (pommel cap) */}
      <ellipse cx="296" cy="27" rx="4" ry="8" fill="#888"/>

      {/* ── SAYA (scabbard) — same orientation ── */}
      {/* Main body — curved like the blade */}
      <path d="M14 60 Q110 55 213 64 L213 71 Q110 62 14 67 Z" fill="#4a4a4a"/>
      {/* Lacquer highlight */}
      <path d="M18 61 Q110 56 211 65" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none"/>
      {/* Kojiri (end cap — left) */}
      <ellipse cx="12" cy="63" rx="7" ry="9" fill="#6a6a6a"/>
      <ellipse cx="12" cy="63" rx="5" ry="7" fill="#7a7a7a"/>
      {/* Kurikata (cord knob) */}
      <rect x="68" y="57" width="12" height="19" rx="4.5" fill="#333"/>
      <rect x="70" y="59" width="8" height="15" rx="3" fill="#282828"/>
      {/* Koiguchi (mouth — right end) */}
      <rect x="210" y="58" width="9" height="14" rx="2" fill="#646464"/>
      {/* Fuchi + handle section of koshirae */}
      <rect x="220" y="57" width="8" height="15" rx="2" fill="#5a5a5a"/>
      <rect x="228" y="56" width="65" height="17" rx="7" fill="#525252"/>
      {[232,239,246,253,260,267,274,281,288].map((x, i) => (
        <line key={i} x1={x} y1="56" x2={x + 5} y2="73" stroke="#282828" strokeWidth="1.5" opacity="0.8"/>
      ))}
      <ellipse cx="295" cy="64" rx="4" ry="9" fill="#5e5e5e"/>
    </svg>
  );
}

// === Ancient Japan design tokens ===
const PARCHMENT = "#F5EDD6";
const PARCHMENT_2 = "#EDE0BC";
const LACQUER = "#8B1A1A";
const GOLD = "#C4963A";
const INK = "#1a1208";

const CINZEL = '"Cinzel", "Times New Roman", serif';
const FELL = '"IM Fell English", "Times New Roman", serif';

const CROSSHATCH = `repeating-linear-gradient(45deg, transparent 0 9px, rgba(26,18,8,0.035) 9px 10px), repeating-linear-gradient(-45deg, transparent 0 9px, rgba(26,18,8,0.035) 9px 10px)`;

function SectionDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "48px 0 24px", maxWidth: 880, marginLeft: "auto", marginRight: "auto", padding: "0 20px" }}>
      <div style={{ flex: 1, height: 1, background: GOLD }} />
      <span style={{ fontFamily: CINZEL, fontSize: 13, letterSpacing: 5, textTransform: "uppercase", color: LACQUER, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: GOLD }} />
    </div>
  );
}

function StampTag({ children }) {
  return (
    <span style={{
      border: `1px solid ${LACQUER}`,
      padding: "5px 14px",
      color: GOLD,
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
            Drop your PDF here
          </div>
        </div>
      )}

      {/* HEADER — dark ink bar with logo + stamp tags */}
      <header style={{ background: INK, padding: "28px 20px 22px", textAlign: "center" }}>
        <div style={{ height: 1, background: GOLD, maxWidth: 920, margin: "0 auto 18px" }} />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img src="/logo.png" alt="katanapdf" style={{ maxWidth: "min(420px, 70vw)", height: "auto", display: "block" }} />
        </div>
        <div style={{ height: 1, background: GOLD, maxWidth: 920, margin: "18px auto 18px" }} />
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
          <StampTag>100% Free</StampTag>
          <StampTag>No Upload</StampTag>
          <StampTag>No Sign-up</StampTag>
          <StampTag>Unlimited Pages</StampTag>
        </div>
      </header>

      {/* HERO — tagline + CTA */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 20px 40px", textAlign: "center" }}>
        <p style={{ marginTop: 0, marginBottom: 36, fontSize: 20, fontFamily: FELL, color: INK, maxWidth: 640, lineHeight: 1.5, fontStyle: "italic" }}>
          Free PDF editor in your browser. No uploads. No account. No limits.
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <label style={{
            display: "inline-block", padding: "14px 52px", background: LACQUER, color: PARCHMENT, cursor: "pointer",
            fontFamily: CINZEL, fontSize: 14, letterSpacing: 5, textTransform: "uppercase", fontWeight: 600,
            border: `1px solid ${GOLD}`, outline: `1px solid ${LACQUER}`, outlineOffset: 4,
          }}>
            Open PDF
            <input type="file" accept="application/pdf,.pdf" onChange={onFile} style={hiddenFileInput} />
          </label>
          <button onClick={onCreateBlank} style={{
            background: "transparent", border: "none", color: LACQUER, fontFamily: CINZEL, fontSize: 11,
            letterSpacing: 3, textTransform: "uppercase", cursor: "pointer", padding: "4px 0", textDecoration: "underline",
          }}>
            or create a blank PDF
          </button>
          <span style={{ fontFamily: FELL, fontSize: 13, color: "rgba(26,18,8,0.6)", fontStyle: "italic" }}>
            or drag a PDF anywhere on this page
          </span>
        </div>
      </section>

      {/* PRIVACY NOTICE — parchment, left red border */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 16px" }}>
        <div style={{ background: PARCHMENT_2, borderLeft: `3px solid ${LACQUER}`, padding: "20px 24px", fontFamily: FELL, fontSize: 15, lineHeight: 1.55, color: INK }}>
          <strong style={{ display: "block", marginBottom: 6, fontFamily: CINZEL, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", color: INK, fontWeight: 600 }}>
            Your PDF never leaves your computer.
          </strong>
          Unlike most PDF editors, katanapdf runs entirely in your browser. Nothing is uploaded to any server.
        </div>
      </section>

      {/* HOW TO EDIT */}
      <SectionDivider label="How to edit a PDF online" />
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { t: "Open your PDF", b: "click the “Open PDF” button or drag a file onto this page." },
            { t: "Edit the text", b: "click any text in the document to change it directly." },
            { t: "Add new text or images", b: "use the “+ Add text” and “+ Add image” buttons on each page." },
            { t: "Download", b: "click “Download PDF” to save the edited file. Your file stays on your computer the whole time." },
          ].map((s, i) => (
            <div key={i} style={{ background: PARCHMENT_2, border: `1px solid rgba(139,26,26,0.25)`, padding: "16px 22px", display: "flex", alignItems: "flex-start", gap: 22 }}>
              <span style={{ fontFamily: CINZEL, fontSize: 52, color: "rgba(139,26,26,0.28)", lineHeight: 1, fontWeight: 700, flexShrink: 0, minWidth: 44, textAlign: "center" }}>{i + 1}</span>
              <div style={{ paddingTop: 8, fontFamily: FELL, fontSize: 16, lineHeight: 1.55, color: INK }}>
                <strong style={{ fontFamily: CINZEL, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>{s.t}</strong>
                <span style={{ display: "block", marginTop: 4 }}>{s.b}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHY KATANAPDF — dark ink feature cards */}
      <SectionDivider label="Why katanapdf" />
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {[
            { t: "100% Free", d: "Every feature, every file, every time. No paid tier hidden behind your edits." },
            { t: "No Upload Required", d: "Your PDF is processed entirely inside your browser — it never touches our servers." },
            { t: "No Account Needed", d: "No sign-up, no email, no tracking. Just open the file and edit it." },
            { t: "No File Limits", d: "Edit PDFs of any size or page count. No daily quotas, no “3 tasks per hour.”" },
            { t: "Edit Existing Text", d: "Click any text to change it. Most competitors lock this behind a paid plan." },
            { t: "Add Text & Images", d: "Insert new text boxes, drop in images, drag, resize, and download." },
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
      <section style={{ maxWidth: 880, margin: "0 auto", padding: "0 20px 56px" }}>
        {[
          { q: "Is katanapdf really free?", a: "Yes. Every feature is free with no paid tier. The site is supported by ads and donations." },
          { q: "Are my files uploaded somewhere?", a: "No. The PDF is opened, edited, and saved entirely inside your browser. We have no servers that receive your file." },
          { q: "Do I need an account?", a: "No. There is no sign-up, no email required, no tracking of who edits what." },
          { q: "What size of PDF can I edit?", a: "Any size your browser can handle — typically files up to a few hundred MB work fine on a modern computer." },
          { q: "Can I edit existing text in a PDF?", a: "Yes. Click any text in the document and edit it directly. Most competitors only let you do this on a paid plan." },
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
          <p>We do not set our own tracking cookies. Third-party cookies may be set by ad providers. You can disable cookies in your browser at any time without affecting the editor’s functionality.</p>
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
          <p>katanapdf is a free, browser-based PDF editor. It was built on the simple idea that editing a PDF shouldn’t require uploading your file to a stranger’s server, signing up for an account, or paying a subscription.</p>
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
      <header style={{ background: INK, padding: "22px 20px", textAlign: "center" }}>
        <div style={{ height: 0.5, background: GOLD, maxWidth: 920, margin: "0 auto 14px" }} />
        <a href="#home" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: CINZEL, fontSize: 18, color: PARCHMENT, letterSpacing: 5, textTransform: "uppercase", fontWeight: 600 }}>
            katanapdf
          </span>
        </a>
        <div style={{ height: 0.5, background: GOLD, maxWidth: 920, margin: "14px auto 0" }} />
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

function FloatingImage({ fi, isSel, zoom, onSelect, onStartDrag, onStartResize, onDelete, onDeselect }) {
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
      zIndex: isSel ? 100 : 50,
      border: isSel ? "2px solid #e63946" : "none",
      boxSizing: "border-box", overflow: "visible",
      boxShadow: isSel ? "0 4px 20px rgba(0,0,0,0.3)" : "none",
      cursor: isSel ? "default" : "pointer",
    }}>
      <img src={fi.dataUrl} alt="" draggable={false}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "fill", pointerEvents: "none", userSelect: "none" }} />
      {isSel && <>
        <div onMouseDown={onStartDrag} style={{
          position: "absolute", top: -28, left: 0, right: 0,
          background: "#e63946", padding: "4px 8px", fontSize: 10,
          color: "#fff", cursor: "grab", display: "flex", alignItems: "center", userSelect: "none",
          borderRadius: "4px 4px 0 0",
        }}>
          <span style={{ fontWeight: 700 }}>✥ DRAG</span>
          <span onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700 }}>✕</span>
        </div>
        <div onMouseDown={onStartResize} style={{
          position: "absolute", bottom: -8, right: -8, width: 16, height: 16,
          background: "#e63946", cursor: "nwse-resize", borderRadius: "50%",
          border: "2px solid #fff",
        }} />
      </>}
    </div>
  );
}

function AdSlot({ slot, style = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    try { if (window.adsbygoogle) (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, []);
  return (
    <div style={{ textAlign: "center", ...style }}>
      <ins ref={ref} className="adsbygoogle" style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
        data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
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
      position: "absolute", left: offsetX, top: offsetY, zIndex: 999,
      border: "1px solid #c42f3c", borderRadius: 3, background: "#fff",
      boxSizing: "border-box", display: "flex", flexDirection: "column",
      width: Math.min(boxW, vw), minWidth: Math.min(boxW, vw), maxWidth: vw,
      boxShadow: "0 4px 18px rgba(0,0,0,0.28)",
    }}>
      <span ref={measureRef} aria-hidden style={{ position: "absolute", left: -9999, top: 0, visibility: "hidden", pointerEvents: "none" }} />
      <div style={{
        background: "#e63946", height: 11, flexShrink: 0, userSelect: "none",
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
          resize: "vertical", background: "#fff", padding: "5px 6px 6px",
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

function FloatingBox({ fb, isSel, onSelect, onStartDrag, onUpdate, onDelete, onCommit }) {
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
          minWidth: 20, zIndex: 50, cursor: "pointer",
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

  // Selected — full editor UI
  return (
    <div onClick={e => { e.stopPropagation(); }} style={{
      position: "absolute", left: fb.x, top: fb.y, minWidth: 140,
      zIndex: 100,
      border: "2px solid #e63946",
      borderRadius: 4, background: "rgba(255,255,255,0.97)",
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      boxSizing: "border-box",
    }}>
      {/* Toolbar */}
      <div onMouseDown={onStartDrag} style={{
        background: "#e63946", padding: "4px 6px", fontSize: 11, color: "#fff",
        cursor: "grab", display: "flex", alignItems: "center", gap: 5,
        userSelect: "none", borderRadius: "2px 2px 0 0", flexWrap: "nowrap",
      }}>
        <span style={{ fontWeight: 700, marginRight: 2, cursor: "grab" }}>✥</span>

        <select value={FB_SIZES.includes(fb.fontSize) ? fb.fontSize : 14}
          onChange={e => onUpdate({ fontSize: +e.target.value })}
          onMouseDown={stopAll} onClick={e => e.stopPropagation()}
          style={{ fontSize: 11, background: "#a02030", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", width: 46 }}>
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
          style={{ fontSize: 11, background: "#a02030", color: "#fff", border: "none", borderRadius: 2, cursor: "pointer", padding: "0 2px" }}>
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
          outline: "none", resize: "both", background: "transparent",
          padding: "5px 8px", fontSize: fb.fontSize, fontFamily: fb.fontFamily,
          fontWeight: fb.isBold ? "bold" : "normal",
          fontStyle: fb.isItalic ? "italic" : "normal",
          color: fb.color || "#000", lineHeight: 1.5, cursor: "text",
          boxSizing: "border-box",
        }} />
      <div style={{ fontSize: 10, color: "#999", padding: "2px 8px 4px", fontFamily: "sans-serif", borderTop: "1px solid #eee" }}>
        Tab to save · Esc to cancel
      </div>
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
  const [textBlocks, setTextBlocks] = useState({});
  const [floatingBoxes, setFloatingBoxes] = useState([]);
  const [floatingImages, setFloatingImages] = useState([]);
  const [history, setHistory] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [selected, setSelected] = useState(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(null);
  const [draggingImg, setDraggingImg] = useState(null);
  const [resizingImg, setResizingImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [fontSize, setFontSize] = useState(14);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const imgDragOrigin = useRef(null);
  const imgResizeOrigin = useRef(null);
  const containerRef = useRef(null);
  const canvasRefs = useRef({});

  async function handleFile(e) {
    const input = e.target;
    const file = input.files && input.files[0];
    // Reset value so the same file can be picked again later
    input.value = "";
    if (!file) return;
    try {
      await loadPdfFromFile(file);
    } catch (err) {
      console.error("Failed to load PDF:", err);
      alert("Couldn't open this PDF: " + (err.message || err) + "\n\nTry a different file or refresh the page.");
    }
  }

  async function loadPdfFromFile(file) {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    await loadPdfFromBytes(bytes);
  }

  async function loadPdfFromBytes(bytes) {
    setPdfBytes(bytes);

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
    setTextBlocks(words);
    setFloatingBoxes([]);
    setFloatingImages([]);
    setHistory([]);
    setActivePopup(null);
    setSelected(null);
    setZoom(1);
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

  async function createBlankPdf() {
    const doc = await PDFDocument.create();
    doc.addPage([612, 792]); // US Letter
    const bytes = await doc.save();
    setFileName("blank.pdf");
    await loadPdfFromBytes(bytes);
  }

  async function handleDroppedFile(file) {
    if (!file || file.type !== "application/pdf") return;
    await loadPdfFromFile(file);
  }

  function saveHistory() {
    setHistory(prev => [...prev.slice(-29), {
      textBlocks: JSON.parse(JSON.stringify(textBlocks)),
      floatingBoxes: JSON.parse(JSON.stringify(floatingBoxes)),
      floatingImages: JSON.parse(JSON.stringify(floatingImages)),
    }]);
  }

  function undo() {
    if (!history.length) return;
    const snap = history[history.length - 1];
    setTextBlocks(snap.textBlocks);
    setFloatingBoxes(snap.floatingBoxes);
    setFloatingImages(snap.floatingImages || []);
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
      setFloatingImages(prev => [...prev, {
        id: `img-${floatingIdCounter}`, page: pageNum,
        x: 60, y: 60, w: 200, h: 150,
        dataUrl: ev.target.result,
      }]);
    };
    reader.readAsDataURL(file);
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
  }, [dragging, draggingImg, resizingImg]);

  const onMouseUp = useCallback(() => {
    setDragging(null);
    setDraggingImg(null);
    setResizingImg(null);
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
    let key;
    if (f.includes("times") || f.includes("georgia") || f.includes("serif")) {
      key = bold && italic ? "timesBI" : bold ? "timesB" : italic ? "timesI" : "times";
    } else if (f.includes("courier") || f.includes("mono")) {
      key = bold && italic ? "courierBI" : bold ? "courierB" : italic ? "courierI" : "courier";
    } else {
      key = bold && italic ? "helvBI" : bold ? "helvB" : italic ? "helvI" : "helv";
    }
    return fonts[key];
  }

  function hexToRgb(hex) {
    const m = (hex || "").match(/^#?([0-9a-f]{6})$/i);
    if (!m) return rgb(0, 0, 0);
    const n = parseInt(m[1], 16);
    return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }

  // Replace any character pdf-lib's WinAnsi standard font can't encode
  function sanitiseForStdFont(s) {
    // pdf-lib's standard fonts only cover WinAnsi (latin-1ish). Replace others with "?".
    // Common smart-quote / em-dash substitutions to keep text legible:
    return s
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/—/g, "--")
      .replace(/–/g, "-")
      .replace(/…/g, "...")
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
  }

  async function handleDownload() {
    if (!pages.length) { alert("No PDF loaded."); return; }
    try {
      // Try real-text path first: load the original PDF and overlay edits as actual text.
      let doc;
      try {
        doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      } catch (loadErr) {
        console.warn("pdf-lib couldn't parse this PDF, falling back to canvas:", loadErr.message);
        return await handleDownloadCanvasFallback();
      }

      const docPages = doc.getPages();
      const fonts = {
        helv: await doc.embedFont(StandardFonts.Helvetica),
        helvB: await doc.embedFont(StandardFonts.HelveticaBold),
        helvI: await doc.embedFont(StandardFonts.HelveticaOblique),
        helvBI: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
        times: await doc.embedFont(StandardFonts.TimesRoman),
        timesB: await doc.embedFont(StandardFonts.TimesRomanBold),
        timesI: await doc.embedFont(StandardFonts.TimesRomanItalic),
        timesBI: await doc.embedFont(StandardFonts.TimesRomanBoldItalic),
        courier: await doc.embedFont(StandardFonts.Courier),
        courierB: await doc.embedFont(StandardFonts.CourierBold),
        courierI: await doc.embedFont(StandardFonts.CourierOblique),
        courierBI: await doc.embedFont(StandardFonts.CourierBoldOblique),
      };

      for (let pgIdx = 0; pgIdx < pages.length; pgIdx++) {
        const pg = pages[pgIdx];
        const pdfPage = docPages[pgIdx];
        if (!pdfPage) continue;
        const { width: pdfW, height: pdfH } = pdfPage.getSize();
        const sx = pdfW / pg.width;
        const sy = pdfH / pg.height;

        // 1. Edited original text → white rectangle over the original area + new text on top
        const edits = (textBlocks[pg.num] || []).filter(w => w.edited);
        for (const e of edits) {
          const text = sanitiseForStdFont(e.text || "");
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
          const text = sanitiseForStdFont(fb.text || "");
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

  // Fallback used when pdf-lib can't parse the original PDF (rare): rasterise via canvas.
  async function handleDownloadCanvasFallback() {
    const doc = await PDFDocument.create();
    for (const pg of pages) {
      const canvas = canvasRefs.current[pg.num];
      if (!canvas) continue;
      canvas.width = pg.width;
      canvas.height = pg.height;
      const ctx = canvas.getContext("2d");
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
      pdfPage.drawImage(pngImg, { x: 0, y: 0, width: pg.width / SCALE, height: pg.height / SCALE });
    }
    const bytes = await doc.save();
    triggerPdfDownload(bytes);
  }

  const isNoFile = pages.length === 0;

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
            <a href="#home" style={{ textDecoration: "none" }}>
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
            <div style={{ width: 1, height: 24, background: "#2a2a2a", margin: "0 4px" }} />
            <label style={tbBtn}>Open <input type="file" accept="application/pdf,.pdf" onChange={handleFile} style={hiddenFileInput} /></label>
            <button onClick={undo} disabled={!history.length} style={{ ...tbBtn, opacity: history.length ? 1 : 0.3 }}>↩ Undo</button>
            <button onClick={() => setZoom(z => Math.min(3, +(z + 0.1).toFixed(1)))} style={tbIconBtn}>+</button>
            <span style={{ fontSize: 11, color: "#555", minWidth: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} style={tbIconBtn}>−</button>
            <div style={{ flex: 1 }} />
            <button onClick={handleDownload} style={{ padding: "8px 20px", background: LACQUER, color: PARCHMENT, border: `1px solid ${GOLD}`, cursor: "pointer", fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, outline: `1px solid ${LACQUER}`, outlineOffset: 2 }}>Download PDF</button>
          </div>

          <div onClick={e => e.stopPropagation()} style={{ background: PARCHMENT, padding: "6px 0", display: "flex", justifyContent: "center" }}>
            <AdSlot slot="11223344async55" style={{ width: "100%", maxWidth: 728 }} />
          </div>

          <div ref={containerRef} style={{ padding: "40px 0 80px", display: "flex", flexDirection: "column", alignItems: "center", gap: 48 }}>
            {pages.map((pg, pgIdx) => {
              const dispW = pg.width * zoom;
              const dispH = pg.height * zoom;
              return (
                <div key={pg.num}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, width: Math.min(dispW, window.innerWidth * 0.96) }}>
                    <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Page {pg.num}</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={e => { e.stopPropagation(); addFloatingBox(pg.num); }} style={pageBtn}>+ Add text</button>
                      <label style={pageBtn} onClick={e => e.stopPropagation()}>
                        + Add image
                        <input type="file" accept="image/*" onChange={e => handleAddImage(e, pg.num)} style={hiddenFileInput} />
                      </label>
                    </div>
                  </div>
                  <div data-pgwrap={pg.num} onClick={e => { e.stopPropagation(); setSelected(null); setActivePopup(null); }} style={{ position: "relative", width: dispW, height: dispH, maxWidth: "96vw", boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 24px 64px rgba(0,0,0,0.6)", overflow: "hidden" }}>
                    <canvas ref={(el) => { if (el) canvasRefs.current[pg.num] = el; else delete canvasRefs.current[pg.num]; }} style={{ display: "block", width: dispW, height: dispH }} />
                    {(textBlocks[pg.num] || []).map(tb => {
                      const isOpen = activePopup?.blockId === tb.id;
                      return (
                        <div key={tb.id} style={{
                          position: "absolute", left: tb.x * zoom, top: tb.y * zoom,
                          width: Math.max(tb.width * zoom, 8),
                          height: Math.max(tb.height * zoom, tb.fontSize * zoom * 0.9),
                          zIndex: isOpen ? 20 : 10, cursor: "text",
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
                  {pgIdx % 2 === 1 && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
                      <AdSlot slot="5566778899" style={{ width: "100%", maxWidth: 728 }} />
                    </div>
                  )}
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
