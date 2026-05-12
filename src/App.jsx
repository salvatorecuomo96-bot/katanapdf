import { useRef, useState, useEffect, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

let _notoFontBytesCache = null;
async function loadNotoFontBytes() {
  if (_notoFontBytesCache) return _notoFontBytesCache;
  const names = ["noto-sans-regular", "noto-sans-bold", "noto-sans-italic", "noto-sans-bold-italic", "noto-serif-regular", "noto-serif-bold", "noto-sans-mono-regular"];
  const entries = await Promise.all(names.map(async (n) => {
    const res = await fetch(`/fonts/${n}.woff2`);
    return [n, await res.arrayBuffer()];
  }));
  _notoFontBytesCache = Object.fromEntries(entries);
  return _notoFontBytesCache;
}

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).href;

const SCALE = 2;
const PARCHMENT = "#F5EDD6";
const PARCHMENT_2 = "#EDE0BC";
const LACQUER = "#8B1A1A";
const GOLD = "#C4963A";
const INK = "#1a1208";
const CINZEL = '"Cinzel", "Times New Roman", serif';
const FELL = '"Lora", Georgia, "Times New Roman", serif';
const CROSSHATCH = `repeating-linear-gradient(45deg, transparent 0 9px, rgba(26,18,8,0.035) 9px 10px), repeating-linear-gradient(-45deg, transparent 0 9px, rgba(26,18,8,0.035) 9px 10px)`;
const FB_SIZES = [6,7,8,9,10,11,12,14,16,18,20,22,24,26,28,32,36,40,48,56,64,72,80,96,120];

// ========== UI HELPERS ==========

function SectionDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, margin: "36px auto 18px", maxWidth: 1600, padding: "0 20px" }}>
      <div style={{ flex: 1, height: 1, background: GOLD }} />
      <span style={{ fontFamily: CINZEL, fontSize: 13, letterSpacing: 4, paddingLeft: 4, textTransform: "uppercase", color: LACQUER, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: GOLD }} />
    </div>
  );
}

function StampTag({ children }) {
  return <span style={{ border: `1px solid ${LACQUER}`, padding: "5px 14px", color: LACQUER, fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 500, background: "transparent" }}>{children}</span>;
}

function CornerBracket() {
  return <div style={{ position: "absolute", top: 8, right: 8, width: 14, height: 14, borderTop: `1px solid ${GOLD}`, borderRight: `1px solid ${GOLD}`, pointerEvents: "none" }} />;
}

// ========== PAGES ==========

function Homepage({ onFile, onCreateBlank }) {
  const [dragOver, setDragOver] = useState(false);
  const onDragOver = (e) => { e.preventDefault(); if (!dragOver) setDragOver(true); };
  const onDragLeave = (e) => { if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) setDragOver(false); };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) onFile({ target: { files: [f] } }); };

  return (
    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} style={{ minHeight: "100vh", background: PARCHMENT, backgroundImage: CROSSHATCH, color: INK, position: "relative", fontFamily: FELL }}>
      {dragOver && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(139,26,26,0.18)", border: `4px dashed ${LACQUER}`, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{ background: PARCHMENT, padding: "20px 40px", color: LACQUER, fontFamily: CINZEL, fontSize: 18, letterSpacing: 4, textTransform: "uppercase", border: `1px solid ${GOLD}`, outline: `1px solid ${LACQUER}`, outlineOffset: 4 }}>
            Drop your PDF or image here
          </div>
        </div>
      )}
      <header style={{ padding: "6px 20px 0", textAlign: "center" }}>
        <div style={{ height: 1, background: LACQUER, maxWidth: 1600, margin: "0 auto", opacity: 0.5 }} />
        <div style={{ height: 130, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}><img src="/logo.png" alt="katanapdf" style={{ width: "min(540px, 90vw)", height: "auto", display: "block" }} /></div>
        <div style={{ height: 1, background: LACQUER, maxWidth: 1600, margin: "0 auto 8px", opacity: 0.5 }} />
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8 }}><StampTag>100% Free</StampTag><StampTag>No Upload</StampTag><StampTag>No Sign-Up</StampTag><StampTag>No Watermark</StampTag></div>
      </header>
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 28px", textAlign: "center" }}>
        <h1 style={{ fontFamily: FELL, fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 500, letterSpacing: 0, color: INK, margin: "0 0 12px", lineHeight: 1.3, maxWidth: 620 }}>Free PDF editor that runs in your browser</h1>
        <p style={{ marginTop: 0, marginBottom: 26, fontSize: 17, fontFamily: FELL, color: "rgba(26,18,8,0.75)", maxWidth: 540, lineHeight: 1.55 }}>Edit PDFs without uploading files. No account, no watermark, no artificial limits.</p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <label style={{ display: "inline-block", padding: "17px 68px", background: LACQUER, color: PARCHMENT, cursor: "pointer", fontFamily: CINZEL, fontSize: 17, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, border: `1px solid ${GOLD}`, outline: `1px solid ${LACQUER}`, outlineOffset: 5, lineHeight: 1 }}>
            Open PDF or Image
            <input type="file" accept="application/pdf,.pdf,image/*" onChange={onFile} style={{ position: "absolute", width: 0.1, height: 0.1, opacity: 0, overflow: "hidden", pointerEvents: "none" }} />
          </label>
          <button onClick={onCreateBlank} style={{ background: "transparent", border: "none", color: LACQUER, fontFamily: FELL, fontSize: 15, cursor: "pointer", padding: "4px 0", textDecoration: "underline" }}>Create a blank PDF</button>
          <span style={{ fontFamily: FELL, fontSize: 13, color: "rgba(26,18,8,0.5)", fontStyle: "italic" }}>or drag a PDF or image anywhere on this page</span>
        </div>
      </section>

      {/* Decorative vertical line */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
        <div style={{ width: 1, height: 40, background: LACQUER }} />
      </div>

      <SectionDivider label="How to edit a PDF online" />
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>
        {[
          { n: "1", text: "Open your PDF — click the button or drag a file onto this page." },
          { n: "2", text: "Edit supported text, add new text boxes, or place images on any page." },
          { n: "3", text: "Append pages from another PDF using the Add PDF button if needed." },
          { n: "4", text: "Download the finished PDF." }
        ].map(step => (
          <div key={step.n} style={{ display: "flex", alignItems: "center", background: PARCHMENT_2, marginBottom: 8, padding: "18px 24px", border: "1px solid rgba(139,26,26,0.05)" }}>
            <span style={{ fontFamily: CINZEL, fontSize: 36, color: "rgba(196,150,58,0.5)", width: 50, fontWeight: 600, lineHeight: 1 }}>{step.n}</span>
            <span style={{ fontFamily: FELL, fontSize: 16, color: INK }}>{step.text}</span>
          </div>
        ))}
      </section>

      <SectionDivider label="Why KatanaPDF" />
      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {[
            { t: "100% FREE", d: "No paid tier hiding the basic tools." },
            { t: "NO UPLOAD REQUIRED", d: "Your PDF is processed locally in your browser." },
            { t: "NO ACCOUNT NEEDED", d: "Open the file and start editing." },
            { t: "NO WATERMARK", d: "Download a clean PDF." },
            { t: "PRACTICAL EDITS", d: "Add text, images, and edit supported text directly." },
            { t: "FAST BY DESIGN", d: "No waiting for server uploads or queues." },
          ].map((c, i) => (
            <div key={i} style={{ background: INK, padding: "24px 28px", position: "relative" }}>
               <CornerBracket />
               <div style={{ fontFamily: CINZEL, fontSize: 12, letterSpacing: 2, color: GOLD, marginBottom: 12, fontWeight: 600 }}>{c.t}</div>
               <div style={{ fontFamily: FELL, fontSize: 14, color: "rgba(245,237,214,0.75)", lineHeight: 1.5 }}>{c.d}</div>
            </div>
          ))}
        </div>
      </section>

      <SectionDivider label="Frequently Asked Questions" />
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px", paddingBottom: 80 }}>
        {[
          "IS KATANAPDF REALLY FREE?",
          "ARE MY FILES UPLOADED SOMEWHERE?",
          "DO I NEED AN ACCOUNT?",
          "WHAT SIZE OF PDF CAN I EDIT?",
          "CAN I EDIT EXISTING TEXT IN A PDF?",
          "WILL THE LAYOUT OF MY PDF BREAK?"
        ].map((q, i) => (
          <div key={i} style={{ background: PARCHMENT_2, padding: "16px 20px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", border: "1px solid rgba(139,26,26,0.05)" }}>
            <span style={{ fontSize: 10, color: INK, marginRight: 12, opacity: 0.8 }}>▶</span>
            <span style={{ fontFamily: CINZEL, fontSize: 13, letterSpacing: 1.5, color: INK, fontWeight: 500 }}>{q}</span>
          </div>
        ))}
      </section>
      
      <Footer />
    </div>
  );
}

function Footer() {
  const linkStyle = { color: GOLD, fontFamily: CINZEL, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", margin: "0 14px", textDecoration: "none", fontWeight: 500 };
  return (
    <footer style={{ background: INK, padding: "26px 20px", textAlign: "center", borderTop: "1px solid rgba(196,150,58,0.3)" }}>
      <div style={{ height: 0.5, background: "rgba(196,150,58,0.5)", maxWidth: 600, margin: "0 auto 16px" }} />
      <div style={{ marginBottom: 14 }}><a href="#about" style={linkStyle}>About</a><a href="#privacy" style={linkStyle}>Privacy Policy</a><a href="#terms" style={linkStyle}>Terms</a></div>
      <div style={{ color: GOLD, fontFamily: CINZEL, fontSize: 10, letterSpacing: 2, opacity: 0.7 }}>© {new Date().getFullYear()} katanapdf — Free PDF editor in your browser.</div>
    </footer>
  );
}

function StaticPage({ route }) {
  const content = {
    privacy: { title: "Privacy Policy", body: <p>katanapdf runs locally in your browser. No files are uploaded.</p> },
    terms: { title: "Terms of Use", body: <p>Use katanapdf responsibly. We are not liable for data loss.</p> },
    about: { title: "About katanapdf", body: <p>A free, browser-based PDF editor for basic tasks.</p> },
  }[route];
  if (!content) return null;
  return (
    <div style={{ minHeight: "100vh", background: PARCHMENT, backgroundImage: CROSSHATCH, color: INK, fontFamily: FELL }}>
      <header style={{ padding: "20px", textAlign: "center" }}>
        <a href="#home" style={{ textDecoration: "none" }}><span style={{ fontFamily: CINZEL, fontSize: 18, color: INK, letterSpacing: 5, textTransform: "uppercase", fontWeight: 600 }}>katanapdf</span></a>
      </header>
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 64px" }}>
        <h1 style={{ fontFamily: CINZEL, fontSize: 30, textTransform: "uppercase" }}>{content.title}</h1>
        <div style={{ fontSize: 16, lineHeight: 1.7 }}>{content.body}</div>
        <p style={{ marginTop: 40 }}><a href="#home" style={{ color: LACQUER, textDecoration: "underline", fontFamily: CINZEL }}>← Back to editor</a></p>
      </article>
      <Footer />
    </div>
  );
}

// ========== EDITOR COMPONENTS ==========

function EditPopup({ block, zoom, onCommit, onCancel }) {
  const [text, setText] = useState(block.text || "");
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // Track drag delta
  const [dragging, setDragging] = useState(false);
  const [format, setFormat] = useState({
    fontFamily: block.fontFamily || "Arial, sans-serif",
    fontSize: Math.round((block.fontSize || 14) / SCALE), // Convert from PDF internal to CSS size
    color: block.color || "#000000",
    bgColor: block.bgColor || "transparent"
  });
  
  const dragOrigin = useRef(null);
  const taRef = useRef(null);

  useEffect(() => { if (taRef.current) { taRef.current.focus(); taRef.current.select(); } }, []);

  useEffect(() => {
    const move = (e) => { 
      if (!dragging || !dragOrigin.current) return; 
      setOffset({
        x: dragOrigin.current.ox + e.clientX - dragOrigin.current.mx,
        y: dragOrigin.current.oy + e.clientY - dragOrigin.current.my
      }); 
    };
    const up = () => setDragging(false);
    if (dragging) { window.addEventListener("mousemove", move); window.addEventListener("mouseup", up); }
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging]);

  const cssFontSize = (format.fontSize * SCALE) * zoom;
  const boxW = Math.max(block.width * zoom + 20, 260);

  return (
    <>
      {dragging && <div style={{ position: "fixed", inset: 0, zIndex: 9999, cursor: "grabbing" }} />}
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", left: offset.x, top: offset.y, zIndex: 2000,
        border: `1px solid ${LACQUER}`, background: format.bgColor === "transparent" ? "#fff" : format.bgColor,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)", width: boxW, borderRadius: 4, boxSizing: "border-box"
      }}>
        {/* Dark Toolbar */}
        <div onMouseDown={(e) => { e.preventDefault(); dragOrigin.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }; setDragging(true); }} 
          style={{ background: "#222", padding: "6px 8px", cursor: "grab", display: "flex", alignItems: "center", gap: 8, borderRadius: "3px 3px 0 0", userSelect: "none" }}>
          
          <select value={format.fontFamily} onChange={e => setFormat({...format, fontFamily: e.target.value})} onMouseDown={e=>e.stopPropagation()} style={{ fontSize: 11, background: "#fff", border: "none", borderRadius: 2, padding: "2px", width: 70 }}>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Times New Roman, serif">Times</option>
            <option value="Courier New, monospace">Courier</option>
          </select>
          
          <select value={FB_SIZES.includes(format.fontSize) ? format.fontSize : 14} onChange={e => setFormat({...format, fontSize: Number(e.target.value)})} onMouseDown={e=>e.stopPropagation()} style={{ fontSize: 11, background: "#fff", border: "none", borderRadius: 2, padding: "2px", width: 45 }}>
            {FB_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          
          <div title="Text Color" style={{ width: 18, height: 18, borderRadius: "50%", overflow: "hidden", border: "1px solid #ddd", position: "relative" }}>
            <input type="color" value={format.color} onChange={e => setFormat({...format, color: e.target.value})} onMouseDown={e=>e.stopPropagation()} style={{ position: "absolute", top: -10, left: -10, width: 40, height: 40, cursor: "pointer", border: "none" }} />
          </div>
          
          <div title="Background Color" style={{ width: 18, height: 18, borderRadius: "50%", overflow: "hidden", border: "1px dashed #aaa", position: "relative" }}>
            <input type="color" value={format.bgColor === "transparent" ? "#ffffff" : format.bgColor} onChange={e => setFormat({...format, bgColor: e.target.value})} onMouseDown={e=>e.stopPropagation()} style={{ position: "absolute", top: -10, left: -10, width: 40, height: 40, cursor: "pointer", border: "none" }} />
          </div>

          <button onClick={() => setFormat({...format, bgColor: "transparent"})} onMouseDown={e=>e.stopPropagation()} style={{ fontSize: 9, background: "none", color: "#aaa", border: "1px solid #666", borderRadius: 2, padding: "2px 4px", cursor: "pointer" }}>Clear BG</button>

          <button onClick={() => onCommit(text, offset.x, offset.y, format)} onMouseDown={e=>e.stopPropagation()} style={{ marginLeft: "auto", background: "#4CAF50", color: "#fff", border: "none", borderRadius: 3, padding: "3px 10px", cursor: "pointer", fontSize: 11, fontWeight: "bold" }}>Save</button>
        </div>
        
        <textarea ref={taRef} value={text} onChange={e => setText(e.target.value)} 
          onKeyDown={e => { if (e.key === "Escape") onCancel(); if (e.key === "Tab") { e.preventDefault(); onCommit(text, offset.x, offset.y, format); } }} 
          style={{ width: "100%", border: "none", outline: "none", background: "transparent", padding: "8px", fontSize: cssFontSize, fontFamily: format.fontFamily, color: format.color, resize: "none", overflow: "hidden", minHeight: Math.max(block.height * zoom, cssFontSize * 1.5), boxSizing: "border-box" }} />
      </div>
    </>
  );
}

function FloatingBox({ fb, isSel, zoom = 1, onSelect, onStartDrag, onStartResize, onStartRotate, onUpdate, onDelete }) {
  const taRef = useRef(null);
  useEffect(() => { if (isSel && taRef.current) { taRef.current.focus(); if (fb.text === "") taRef.current.select(); } }, [isSel, fb.text]);
  const stopAll = e => e.stopPropagation();
  
  if (!isSel) {
    return (
      <div onClick={e => { e.stopPropagation(); onSelect(); }}
        style={{
          position: "absolute", left: fb.x * zoom, top: fb.y * zoom, willChange: "transform, left, top",
          transform: `rotate(${fb.angle || 0}deg)`, transformOrigin: "center center", minWidth: 20 * zoom, zIndex: fb.z || 50, cursor: "pointer",
          padding: `${2 * zoom}px ${4 * zoom}px`, fontSize: fb.fontSize * zoom, fontFamily: fb.fontFamily, color: fb.color || "#000", background: fb.bgColor || "transparent", lineHeight: 1.5, whiteSpace: "pre-wrap"
        }}>{fb.text || "New Text"}</div>
    );
  }

  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: "absolute", left: fb.x * zoom, top: fb.y * zoom, minWidth: 260, zIndex: 1000, border: `1px solid ${fb.color || "#000"}`, borderRadius: 4, background: fb.bgColor === "transparent" ? "#fff" : fb.bgColor, boxShadow: "0 4px 20px rgba(0,0,0,0.25)", boxSizing: "border-box", transform: `rotate(${fb.angle || 0}deg)`, transformOrigin: "center center", willChange: "transform, left, top"
    }}>
       <div onMouseDown={onStartRotate} style={{ position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)", width: 12, height: 12, background: "#222", cursor: "grab", borderRadius: "50%", border: "2px solid #fff" }} />
       <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", width: 2, height: 10, background: "#222" }} />
       
       <div onMouseDown={onStartDrag} style={{ background: "#222", padding: "6px 8px", cursor: "grab", display: "flex", alignItems: "center", gap: 8, borderRadius: "3px 3px 0 0", userSelect: "none" }}>
          <select value={fb.fontFamily} onChange={e => onUpdate({ fontFamily: e.target.value })} onMouseDown={stopAll} style={{ fontSize: 11, background: "#fff", border: "none", borderRadius: 2, padding: "2px", width: 70 }}>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Times New Roman, serif">Times</option>
            <option value="Courier New, monospace">Courier</option>
          </select>
          <select value={FB_SIZES.includes(fb.fontSize) ? fb.fontSize : 14} onChange={e => onUpdate({ fontSize: Number(e.target.value) })} onMouseDown={stopAll} style={{ fontSize: 11, background: "#fff", border: "none", borderRadius: 2, padding: "2px", width: 45 }}>
            {FB_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div title="Text Color" style={{ width: 18, height: 18, borderRadius: "50%", overflow: "hidden", border: "1px solid #ddd", position: "relative" }}>
            <input type="color" value={fb.color || "#000000"} onChange={e => onUpdate({ color: e.target.value })} onMouseDown={stopAll} style={{ position: "absolute", top: -10, left: -10, width: 40, height: 40, cursor: "pointer", border: "none" }} />
          </div>
          <div title="Background Color" style={{ width: 18, height: 18, borderRadius: "50%", overflow: "hidden", border: "1px dashed #aaa", position: "relative" }}>
            <input type="color" value={fb.bgColor === "transparent" ? "#ffffff" : (fb.bgColor || "#ffffff")} onChange={e => onUpdate({ bgColor: e.target.value })} onMouseDown={stopAll} style={{ position: "absolute", top: -10, left: -10, width: 40, height: 40, cursor: "pointer", border: "none" }} />
          </div>
          <button onClick={() => onUpdate({ bgColor: "transparent" })} onMouseDown={stopAll} style={{ fontSize: 9, background: "none", color: "#aaa", border: "1px solid #666", borderRadius: 2, padding: "2px 4px", cursor: "pointer" }}>Clear BG</button>
          <button onClick={() => onDelete()} onMouseDown={stopAll} style={{ marginLeft: "auto", background: "none", border: "none", color: "#ff4444", cursor: "pointer", fontWeight: "bold" }}>✕</button>
       </div>
       
       <textarea ref={taRef} value={fb.text} onChange={e => onUpdate({ text: e.target.value })} onMouseDown={stopAll} onKeyDown={e => { if (e.key === "Tab" || e.key === "Escape") { e.preventDefault(); onSelect(); } }} style={{ width: "100%", border: "none", outline: "none", background: "transparent", padding: "8px", fontSize: fb.fontSize * zoom, fontFamily: fb.fontFamily, color: fb.color, resize: "none", minHeight: fb.fontSize * zoom * 1.5, boxSizing: "border-box" }} />
       <div onMouseDown={onStartResize} style={{ position: "absolute", bottom: -8, right: -8, width: 16, height: 16, background: "#222", cursor: "nwse-resize", borderRadius: "50%", border: "2px solid #fff" }} />
    </div>
  );
}

function FloatingImage({ fi, isSel, zoom = 1, onSelect, onStartDrag, onStartResize, onDelete, onDeselect }) {
  useEffect(() => {
    if (!isSel) return;
    const handler = (e) => { if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); onDeselect(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSel, onDeselect]);

  return (
    <div onClick={e => { e.stopPropagation(); onSelect(); }} style={{
      position: "absolute", left: fi.x * zoom, top: fi.y * zoom, width: fi.w * zoom, height: fi.h * zoom,
      zIndex: isSel ? 1000 : (fi.z || 50), willChange: "transform, left, top",
      border: isSel ? "2px solid #8B1A1A" : (fi.isEraser ? "1px dashed rgba(0,0,0,0.2)" : "none"),
      boxSizing: "border-box", boxShadow: isSel ? "0 4px 20px rgba(0,0,0,0.3)" : "none", cursor: isSel ? "default" : "pointer",
      transform: `rotate(${fi.angle || 0}deg)`
    }}>
      <img src={fi.dataUrl} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block", objectFit: "fill", pointerEvents: "none", userSelect: "none", opacity: fi.isEraser && isSel ? 0.8 : 1 }} />
      {isSel && <>
        <div onMouseDown={onStartDrag} style={{ position: "absolute", top: -24, left: 0, right: 0, background: "#8B1A1A", padding: "4px 8px", fontSize: 10, color: "#fff", cursor: "grab", display: "flex", alignItems: "center", borderRadius: "4px 4px 0 0" }}>
          <span style={{ fontWeight: 700 }}>✥ DRAG</span>
          <span onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onDelete(); }} style={{ marginLeft: "auto", cursor: "pointer", fontWeight: 700 }}>✕</span>
        </div>
        <div onMouseDown={onStartResize} style={{ position: "absolute", bottom: -8, right: -8, width: 16, height: 16, background: "#8B1A1A", cursor: "nwse-resize", borderRadius: "50%", border: "2px solid #fff" }} />
      </>}
    </div>
  );
}

function SignatureModal({ onClose, onInsert }) {
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = "#000"; }
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * (canvas.width / rect.width), y: (clientY - rect.top) * (canvas.height / rect.height) };
  };

  const startDrawing = (e) => { e.preventDefault(); isDrawing.current = true; lastPos.current = getPos(e); };
  const draw = (e) => {
    e.preventDefault(); if (!isDrawing.current) return;
    const ctx = canvasRef.current.getContext("2d"); const newPos = getPos(e);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(newPos.x, newPos.y); ctx.stroke();
    lastPos.current = newPos;
  };
  const stopDrawing = () => { isDrawing.current = false; };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: PARCHMENT, border: `2px solid ${GOLD}`, padding: "24px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: 0, fontFamily: CINZEL, color: LACQUER }}>Draw Signature</h2>
        <canvas ref={canvasRef} width={500} height={200} style={{ border: `1px solid ${LACQUER}`, background: "#fff", cursor: "crosshair", maxWidth: "100%" }} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} onTouchCancel={stopDrawing} />
        <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "space-between" }}>
          <button onClick={() => canvasRef.current?.getContext("2d").clearRect(0, 0, 500, 200)} style={{ padding: "8px 16px", cursor: "pointer" }}>Clear</button>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={onClose} style={{ padding: "8px 16px", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => onInsert(canvasRef.current.toDataURL("image/png"))} style={{ padding: "8px 24px", background: LACQUER, color: "#fff", cursor: "pointer", border: "none" }}>Insert</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN APP ==========

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
  const [pageOrder, setPageOrder] = useState([]);
  const [rotatedPages, setRotatedPages] = useState({});
  const [deletedPages, setDeletedPages] = useState(new Set());
  const [textBlocks, setTextBlocks] = useState({});
  const [floatingBoxes, setFloatingBoxes] = useState([]);
  const [floatingImages, setFloatingImages] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [highlightMode, setHighlightMode] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [fileName, setFileName] = useState("");

  const containerRef = useRef(null);
  const canvasRefs = useRef({});
  const dragOrigin = useRef(null);
  const imgDragOrigin = useRef(null);
  const imgResizeOrigin = useRef(null);
  const fbRotateOrigin = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [draggingImg, setDraggingImg] = useState(null);
  const [resizingImg, setResizingImg] = useState(null);
  const [rotatingFb, setRotatingFb] = useState(null);

  // --- Core Functions ---
  const goHome = () => { setPages([]); setPdfBytes(null); };
  const rotatePage = (num) => { setRotatedPages(prev => ({ ...prev, [num]: ((prev[num] || 0) + 90) % 360 })); };

  const clusterWordsIntoLineClusters = (pageWords) => {
    const EPS_Y = 4; if (!pageWords.length) return [];
    const sorted = [...pageWords].sort((a, b) => Math.abs(a.baselineY - b.baselineY) > EPS_Y ? b.baselineY - a.baselineY : a.x - b.x);
    const clusters = []; let c = [];
    for (const w of sorted) {
      if (!c.length) { c.push(w); continue; }
      const last = c[c.length - 1]; const sameLine = Math.abs(w.baselineY - last.baselineY) <= EPS_Y;
      const gap = w.x - (last.x + last.width);
      if (sameLine && gap <= Math.max(last.fontSize, w.fontSize) * 1.2) c.push(w);
      else { clusters.push(c); c = [w]; }
    }
    if (c.length) clusters.push(c); return clusters;
  };

  const paragraphWordsToTextBlock = (words, paraIdx) => {
    if (!words.length) return null;
    const page = words[0].page; const sorted = [...words].sort((a, b) => a.x - b.x);
    return { 
      id: `${page}-P${paraIdx}`, page, text: words.map(w => w.text).join(" ").trim(), 
      x: sorted[0].x, y: Math.min(...words.map(w => w.y)), width: Math.max(...words.map(w => w.x + w.width)) - sorted[0].x, height: Math.max(...words.map(w => w.y + w.height)) - Math.min(...words.map(w => w.y)), 
      baselineY: sorted[0].baselineY, fontSize: sorted[0].fontSize, fontFamily: sorted[0].fontFamily, color: sorted[0].color || "#000000", bgColor: "transparent", isHighlighted: false, edited: false 
    };
  };

  async function loadPdfFromBytes(bytes) {
    setPdfBytes(bytes);
    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const pageData = []; const words = {};
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i); const vp = page.getViewport({ scale: SCALE });
      const canvas = document.createElement("canvas"); canvas.width = vp.width; canvas.height = vp.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
      const content = await page.getTextContent();
      const pageWords = content.items.map(item => {
        const [, , , d, tx, ty] = item.transform;
        let hex = "#000000";
        if (item.color && item.color.length >= 3) { hex = "#" + ((1 << 24) + (Math.round(item.color[0]) << 16) + (Math.round(item.color[1]) << 8) + Math.round(item.color[2])).toString(16).slice(1); }
        return { text: item.str, x: tx * SCALE, y: vp.height - ty * SCALE - (Math.abs(d) * SCALE), baselineY: vp.height - ty * SCALE, width: item.width * SCALE, fontSize: Math.abs(d) * SCALE, page: i, color: hex, fontFamily: "Arial" };
      }).filter(w => w.text.trim());
      words[i] = clusterWordsIntoLineClusters(pageWords).map((line, idx) => paragraphWordsToTextBlock(line, idx)).filter(Boolean);
      pageData.push({ num: i, dataUrl: canvas.toDataURL("image/png"), width: vp.width, height: vp.height });
    }
    setPages(pageData); setPageOrder(pageData.map((_, i) => i)); setTextBlocks(words);
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return; setFileName(file.name);
    const bytes = new Uint8Array(await file.arrayBuffer()); await loadPdfFromBytes(bytes);
  };

  const addFloatingBox = (pageNum) => {
    const id = `float-${Date.now()}`;
    setFloatingBoxes(prev => [...prev, { id, page: pageNum, x: 50, y: 50, text: "", fontSize: 14, fontFamily: "Arial, sans-serif", color: "#000000", bgColor: "transparent", angle: 0 }]);
    setSelected(id);
  };

  const addEraser = (pageNum) => {
    const id = `img-${Date.now()}`;
    const pg = pages.find(p => p.num === pageNum);
    setFloatingImages(prev => [...prev, { id, page: pageNum, x: (pg?.width||600)/2-50, y: (pg?.height||800)/2-10, w: 100, h: 25, dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", isEraser: true }]);
    setSelected(id);
  };

  const commitEdit = (blockId, pageNum, newText, ox, oy, format, scale) => {
    setTextBlocks(prev => ({
      ...prev,
      [pageNum]: prev[pageNum].map(w => w.id === blockId ? { ...w, text: newText, x: w.x + (ox/scale), y: w.y + (oy/scale), baselineY: w.baselineY + (oy/scale), color: format.color, bgColor: format.bgColor, fontFamily: format.fontFamily, fontSize: format.fontSize * SCALE, edited: true } : w)
    }));
    setActivePopup(null); setSelected(null);
  };

  const clickTextBlock = (tb, e) => {
    e.stopPropagation();
    if (highlightMode) {
      setTextBlocks(prev => ({ ...prev, [tb.page]: prev[tb.page].map(w => w.id === tb.id ? { ...w, isHighlighted: !w.isHighlighted } : w) }));
      return;
    }
    setSelected(tb.id); setActivePopup({ blockId: tb.id, pageNum: tb.page });
  };

  const redrawPage = (canvas, dataUrl, edits, highlights) => {
    if (!canvas) return; const ctx = canvas.getContext("2d"); const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0);
      ctx.fillStyle = "rgba(255, 225, 0, 0.35)";
      highlights.forEach(h => ctx.fillRect(h.x - 2, h.y - 2, h.width + 4, h.height + 4));
      edits.forEach(e => {
        if (e.bgColor && e.bgColor !== "transparent") { ctx.fillStyle = e.bgColor; ctx.fillRect(e.x - 2, e.y - 2, e.width + 4, e.height + 4); }
        ctx.font = `${e.fontSize}px ${e.fontFamily}`; ctx.fillStyle = e.color;
        ctx.textBaseline = "alphabetic"; ctx.fillText(e.text, e.x, e.baselineY);
      });
    };
    img.src = dataUrl;
  };

  // Keep canvas synced
  useEffect(() => {
    for (const pg of pages) {
      const canvas = canvasRefs.current[pg.num]; if (!canvas) continue;
      canvas.width = pg.width; canvas.height = pg.height;
      const pageBlocks = textBlocks[pg.num] || [];
      const edits = pageBlocks.filter(w => w.edited && activePopup?.blockId !== w.id);
      const highlights = pageBlocks.filter(w => w.isHighlighted);
      redrawPage(canvas, pg.dataUrl, edits, highlights);
    }
  }, [textBlocks, pages, activePopup]);

  // Handle Dragging Events globally
  useEffect(() => {
    const move = (e) => {
      if (dragging) {
        const o = dragOrigin.current;
        setFloatingBoxes(prev => prev.map(fb => fb.id === dragging.id ? { ...fb, x: o.x + (e.clientX - o.mx)/o.scale, y: o.y + (e.clientY - o.my)/o.scale } : fb));
      }
      if (draggingImg) {
        const o = imgDragOrigin.current;
        setFloatingImages(prev => prev.map(fi => fi.id === draggingImg.id ? { ...fi, x: o.x + (e.clientX - o.mx)/o.scale, y: o.y + (e.clientY - o.my)/o.scale } : fi));
      }
      if (resizingImg) {
        const o = imgResizeOrigin.current;
        setFloatingImages(prev => prev.map(fi => fi.id === resizingImg.id ? { ...fi, w: Math.max(20, o.w + (e.clientX - o.mx)/o.scale), h: Math.max(20, o.h + (e.clientY - o.my)/o.scale) } : fi));
      }
      if (rotatingFb) {
        const o = fbRotateOrigin.current; const mouseAngle = Math.atan2(e.clientY - o.cy, e.clientX - o.cx);
        setFloatingBoxes(prev => prev.map(fb => fb.id === rotatingFb.id ? { ...fb, angle: Math.round(o.startAngle + (mouseAngle - o.startMouseAngle) * (180/Math.PI)) } : fb));
      }
    };
    const up = () => { setDragging(null); setDraggingImg(null); setResizingImg(null); setRotatingFb(null); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging, draggingImg, resizingImg, rotatingFb]);

  async function handleDownload() {
    if (!pages.length) return;
    try {
      let srcDoc;
      try { srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true }); } catch { alert("Failed to parse PDF for saving."); return; }
      
      const doc = await PDFDocument.create(); doc.registerFontkit(fontkit);
      const noto = await loadNotoFontBytes();
      const fonts = {
        helv: await doc.embedFont(noto["noto-sans-regular"], { subset: true }), times: await doc.embedFont(noto["noto-serif-regular"], { subset: true })
      };
      
      const copiedPages = await doc.copyPages(srcDoc, pageOrder);
      for (const p of copiedPages) doc.addPage(p);

      for (let displayIdx = 0; displayIdx < copiedPages.length; displayIdx++) {
        const pg = pages[pageOrder[displayIdx]]; const pdfPage = doc.getPages()[displayIdx];
        if (!pdfPage || !pg) continue;
        const { width: pdfW, height: pdfH } = pdfPage.getSize();
        const sx = pdfW / pg.width; const sy = pdfH / pg.height;

        const highlights = (textBlocks[pg.num] || []).filter(w => w.isHighlighted);
        for (const h of highlights) pdfPage.drawRectangle({ x: h.x * sx, y: pdfH - (h.y + h.height) * sy, width: h.width * sx, height: h.height * sy, color: rgb(1, 0.9, 0), opacity: 0.35 });

        const edits = (textBlocks[pg.num] || []).filter(w => w.edited);
        for (const e of edits) {
          if (e.bgColor && e.bgColor !== "transparent") pdfPage.drawRectangle({ x: e.x * sx, y: pdfH - (e.y + e.height) * sy, width: e.width * sx, height: e.height * sy, color: hexToRgb(e.bgColor) });
          try { pdfPage.drawText(e.text, { x: e.x * sx, y: pdfH - e.baselineY * sy, size: e.fontSize * sy, font: e.fontFamily.includes("Times") ? fonts.times : fonts.helv, color: hexToRgb(e.color) }); } catch {}
        }

        for (const fb of floatingBoxes.filter(f => f.page === pg.num)) {
          if (fb.bgColor && fb.bgColor !== "transparent") pdfPage.drawRectangle({ x: fb.x * sx, y: pdfH - (fb.y + (fb.fontSize*1.5)) * sy, width: 100*sx, height: fb.fontSize*1.5*sy, color: hexToRgb(fb.bgColor) });
          try { pdfPage.drawText(fb.text, { x: fb.x * sx, y: pdfH - (fb.y + fb.fontSize) * sy, size: fb.fontSize * sy, font: fb.fontFamily.includes("Times") ? fonts.times : fonts.helv, color: hexToRgb(fb.color || "#000") }); } catch {}
        }

        for (const fi of floatingImages.filter(f => f.page === pg.num)) {
          const data = await (await fetch(fi.dataUrl)).arrayBuffer();
          let img; try { img = await doc.embedPng(data); } catch { try { img = await doc.embedJpg(data); } catch { continue; } }
          pdfPage.drawImage(img, { x: fi.x * sx, y: pdfH - (fi.y + fi.h) * sy, width: fi.w * sx, height: fi.h * sy, rotate: degrees(fi.angle || 0) });
        }
      }
      
      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = (fileName || "document") + "_edited.pdf";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) { alert("Download failed. " + e.message); }
  }

  function hexToRgb(hex) {
    const m = (hex || "").match(/^#?([0-9a-f]{6})$/i); if (!m) return rgb(0, 0, 0);
    const n = parseInt(m[1], 16); return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }

  // --- Render ---
  if (route !== "home") return <StaticPage route={route} />;
  if (pages.length === 0) return <Homepage onFile={handleFile} onCreateBlank={() => loadPdfFromBytes(new Uint8Array())} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: PARCHMENT, overflow: "hidden" }} onClick={() => { setActivePopup(null); setSelected(null); }}>
      <header style={{ height: 50, background: INK, color: GOLD, display: "flex", alignItems: "center", padding: "0 20px", gap: 15, flexShrink: 0 }} onClick={e=>e.stopPropagation()}>
        <span onClick={goHome} style={{ cursor: "pointer", fontFamily: CINZEL, fontSize: 16, letterSpacing: 2 }}>KATANAPDF</span>
        <div style={{ width: 1, height: 24, background: "rgba(196,150,58,0.4)" }} />
        <button onClick={() => setHighlightMode(!highlightMode)} style={{ ...tbBtn, background: highlightMode ? "rgba(255,225,0,0.3)" : "transparent", borderColor: highlightMode ? "#ffe100" : "rgba(196,150,58,0.4)", color: highlightMode ? "#ffe100" : GOLD }}>{highlightMode ? "Done Highlighting" : "🖍 Highlight"}</button>
        <button onClick={() => setIsSignModalOpen(true)} style={tbBtn}>🖋 Sign</button>
        <label style={tbBtn}>Merge PDF <input type="file" accept="application/pdf" onChange={handleFile} style={hiddenFileInput} /></label>
        <button onClick={() => setZoom(z => z + 0.1)} style={{ ...tbBtn, padding: "5px 10px", fontSize: 16 }}>+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={{ ...tbBtn, padding: "5px 10px", fontSize: 16 }}>-</button>
        <div style={{ flex: 1 }} />
        <button onClick={handleDownload} style={{ background: LACQUER, color: "#fff", border: `1px solid ${GOLD}`, padding: "6px 16px", cursor: "pointer", fontFamily: CINZEL, fontWeight: "bold", letterSpacing: 1 }}>DOWNLOAD PDF</button>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <aside style={{ width: 260, background: PARCHMENT_2, borderRight: `1px solid ${GOLD}`, overflowY: "auto", padding: 15, flexShrink: 0 }}>
          {pageOrder.map((pIdx, i) => (
            <div key={pages[pIdx].num} style={{ marginBottom: 20, textAlign: "center", cursor: "pointer" }} onClick={() => document.querySelector(`[data-pgwrap="${pages[pIdx].num}"]`)?.scrollIntoView({ behavior: "smooth" })}>
              <img src={pages[pIdx].dataUrl} style={{ width: "100%", border: `1px solid ${GOLD}`, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }} />
              <div style={{ fontFamily: CINZEL, fontSize: 12, marginTop: 5, color: LACQUER }}>PAGE {i + 1}</div>
            </div>
          ))}
        </aside>

        <main ref={containerRef} style={{ flex: 1, overflow: "auto", padding: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 50, backgroundImage: CROSSHATCH }}>
          {pageOrder.map(pIdx => {
            const pg = pages[pIdx];
            return (
              <div key={pg.num} data-pgwrap={pg.num} style={{ position: "relative", width: pg.width * zoom, height: pg.height * zoom, background: "#fff", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
                <div style={{ position: "absolute", top: -35, left: 0, right: 0, display: "flex", gap: 10 }}>
                   <span style={{ fontFamily: CINZEL, color: LACQUER, fontWeight: "bold", marginRight: "auto" }}>PAGE {pIdx + 1}</span>
                   <button onClick={() => addFloatingBox(pg.num)} style={pageBtn}>+ Text</button>
                   <button onClick={() => addEraser(pg.num)} style={pageBtn}>+ Eraser</button>
                   <button onClick={() => rotatePage(pg.num)} style={pageBtn}>Rotate</button>
                </div>
                <canvas ref={el => { if (el) canvasRefs.current[pg.num] = el; }} style={{ width: "100%", height: "100%" }} />
                {(textBlocks[pg.num] || []).map(tb => (
                  <div key={tb.id} onClick={(e) => clickTextBlock(tb, e)} style={{ position: "absolute", left: tb.x * zoom, top: tb.y * zoom, width: tb.width * zoom, height: tb.height * zoom, cursor: highlightMode ? "crosshair" : "text", zIndex: activePopup?.blockId === tb.id ? 3000 : 10 }}>
                    {activePopup?.blockId === tb.id && <EditPopup block={tb} zoom={zoom} onCommit={(txt, x, y, fmt) => commitEdit(tb.id, pg.num, txt, x, y, fmt, zoom)} onCancel={() => setActivePopup(null)} />}
                  </div>
                ))}
                {floatingBoxes.filter(fb => fb.page === pg.num).map(fb => (
                  <FloatingBox key={fb.id} fb={fb} isSel={selected === fb.id} zoom={zoom} onSelect={() => setSelected(fb.id)} onUpdate={u => setFloatingBoxes(prev => prev.map(b => b.id === fb.id ? {...b, ...u} : b))} onDelete={() => setFloatingBoxes(prev => prev.filter(b => b.id !== fb.id))} onStartRotate={e => { setSelected(fb.id); const rect = e.currentTarget.parentElement.getBoundingClientRect(); fbRotateOrigin.current = { cx: rect.left + rect.width/2, cy: rect.top + rect.height/2, startAngle: fb.angle || 0, startMouseAngle: Math.atan2(e.clientY - (rect.top + rect.height/2), e.clientX - (rect.left + rect.width/2)) }; setRotatingFb({ id: fb.id }); }} onStartDrag={e => { setSelected(fb.id); dragOrigin.current = { mx: e.clientX, my: e.clientY, x: fb.x, y: fb.y, scale: zoom }; setDragging({ id: fb.id }); }} />
                ))}
                {floatingImages.filter(fi => fi.page === pg.num).map(fi => (
                  <FloatingImage key={fi.id} fi={fi} isSel={selected === fi.id} zoom={zoom} onSelect={() => setSelected(fi.id)} onDeselect={() => setSelected(null)} onDelete={() => setFloatingImages(prev => prev.filter(i => i.id !== fi.id))} onStartDrag={e => { setSelected(fi.id); imgDragOrigin.current = { mx: e.clientX, my: e.clientY, x: fi.x, y: fi.y, scale: zoom }; setDraggingImg({ id: fi.id }); }} onStartResize={e => { setSelected(fi.id); imgResizeOrigin.current = { mx: e.clientX, my: e.clientY, w: fi.w, h: fi.h, scale: zoom }; setResizingImg({ id: fi.id }); }} />
                ))}
              </div>
            );
          })}
        </main>
      </div>
      {isSignModalOpen && <SignatureModal onClose={() => setIsSignModalOpen(false)} onInsert={(url) => { setIsSignModalOpen(false); const num = pages[0]?.num; if (num) setFloatingImages(prev => [...prev, { id: `img-${Date.now()}`, page: num, x: 100, y: 100, w: 200, h: 80, dataUrl: url }]); }} />}
    </div>
  );
}

const hiddenFileInput = { position: "absolute", width: 0.1, height: 0.1, opacity: 0 };
const tbBtn = { padding: "5px 12px", border: `1px solid ${GOLD}`, color: GOLD, cursor: "pointer", background: "transparent", fontSize: 11, fontFamily: CINZEL, textTransform: "uppercase" };
const pageBtn = { padding: "4px 10px", border: `1px solid ${GOLD}`, color: LACQUER, background: PARCHMENT, cursor: "pointer", fontSize: 10, fontFamily: CINZEL, fontWeight: "bold" };