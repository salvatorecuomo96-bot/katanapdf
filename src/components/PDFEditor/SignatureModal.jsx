import { useEffect, useRef, useState } from "react";
import { CINZEL, DRAW_COLORS, FELL, GOLD, INK, LACQUER, pageBtn, PARCHMENT } from "../utils/constant";

const LINE = "rgba(116,86,44,0.18)";

export default function SignatureModal({ onClose, onInsert, color, setColor }) {
  const canvasRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [signTab, setSignTab] = useState("draw");
  const [typeText, setTypeText] = useState("");
  const [selectedSignFont, setSelectedSignFont] = useState("Whisper");
  const [uploadDataUrl, setUploadDataUrl] = useState(null);
  const [sigColorOpen, setSigColorOpen] = useState(false);

  useEffect(() => {
    if (signTab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
  }, [color, signTab]);

  useEffect(() => {
    if (signTab === "type" && hiddenCanvasRef.current) {
      const canvas = hiddenCanvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (typeText) {
        ctx.fillStyle = color;
        ctx.font = `64px "${selectedSignFont}", cursive`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillText(typeText, canvas.width / 2, canvas.height / 2);
      }
    }
  }, [typeText, color, signTab, selectedSignFont]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    // Scale coords to match actual canvas resolution if CSS sizes it down
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevent scrolling on touch
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const newPos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(newPos.x, newPos.y);
    ctx.stroke();

    lastPos.current = newPos;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const handleClear = () => {
    if (signTab === "draw") {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else if (signTab === "type") {
      setTypeText("");
    } else if (signTab === "upload") {
      setUploadDataUrl(null);
    }
  };

  const handleInsert = () => {
    if (signTab === "draw") {
      const canvas = canvasRef.current;
      onInsert(canvas.toDataURL("image/png"));
    } else if (signTab === "type") {
      const canvas = hiddenCanvasRef.current;
      onInsert(canvas.toDataURL("image/png"));
    } else if (signTab === "upload") {
      if (uploadDataUrl) {
        onInsert(uploadDataUrl);
      }
    }
  };

  const handleInsertRef = useRef(null);
  handleInsertRef.current = handleInsert;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        handleInsertRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setUploadDataUrl(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(24,19,13,0.72)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(3px)" }} onClick={onClose}>
      <div style={{ background: "#fffdf8", border: `1px solid ${LINE}`, borderRadius: 10, padding: "28px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, maxWidth: "90vw", boxSizing: "border-box", boxShadow: "0 24px 64px rgba(40,24,8,0.22)" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: 0, fontFamily: CINZEL, color: LACQUER, fontSize: 22, letterSpacing: 3, textTransform: "uppercase", fontWeight: 800 }}>Sign Document</h2>

        <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${LINE}`, paddingBottom: 12, width: "100%", justifyContent: "center" }}>
          {["draw", "type", "upload"].map(tab => (
            <button key={tab} onClick={() => setSignTab(tab)} style={{ ...pageBtn, background: signTab === tab ? LACQUER : "transparent", color: signTab === tab ? "#fff" : LACQUER, border: signTab === tab ? "none" : `1px solid rgba(139,26,26,0.38)`, borderRadius: 3, padding: "7px 18px" }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {signTab === "draw" && (
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            style={{ border: `1px solid ${LACQUER}`, background: "transparent", touchAction: "none", cursor: "crosshair", maxWidth: "100%" }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
          />
        )}

        {signTab === "type" && (
          <div style={{ width: 500, maxWidth: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <input 
              type="text" 
              value={typeText} 
              onChange={e => setTypeText(e.target.value)} 
              placeholder="Type your signature..."
              style={{ padding: "12px 16px", fontSize: 18, border: `1px solid ${LACQUER}`, background: "#fff", color: "#000", outline: "none", fontFamily: "sans-serif" }}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
              {["Whisper", "Great Vibes", "Dancing Script"].map(f => (
                <label key={f} style={{
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: `"${f}", cursive`, fontSize: 32,
                  color: selectedSignFont === f ? LACQUER : INK,
                  border: selectedSignFont === f ? `2px solid ${LACQUER}` : `2px solid ${LINE}`,
                  padding: "4px 12px", borderRadius: 4, background: "rgba(0,0,0,0.02)"
                }}>
                  <input type="radio" name="signFont" value={f} checked={selectedSignFont === f} onChange={() => setSelectedSignFont(f)} style={{ display: "none" }} />
                  Signature
                </label>
              ))}
            </div>
            <canvas ref={hiddenCanvasRef} width={500} height={200} style={{ display: "none" }} />
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${LACQUER}`, color: color, fontFamily: `"${selectedSignFont}", cursive`, fontSize: 64, overflow: "hidden" }}>
              {typeText}
            </div>
          </div>
        )}

        {signTab === "upload" && (
          <div style={{ width: 500, height: 200, maxWidth: "100%", border: `1px dashed ${LACQUER}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            {uploadDataUrl ? (
              <img src={uploadDataUrl} alt="Signature preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontFamily: FELL, color: LACQUER, fontSize: 16 }}>Click to upload image</span>
            )}
            <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleUpload} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleClear} style={{ ...pageBtn, padding: "8px 16px" }}>Clear</button>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                title="Ink colour"
                onClick={() => setSigColorOpen(o => !o)}
                style={{ width: 32, height: 32, borderRadius: 4, background: color, border: "1.5px solid rgba(0,0,0,0.3)", cursor: "pointer", padding: 0, display: "block" }}
              />
              {sigColorOpen && (
                <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3, background: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 4, padding: 5, zIndex: 10000, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                  {DRAW_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => { setColor(c); setSigColorOpen(false); }}
                      style={{ width: 22, height: 22, background: c, border: color === c ? `2px solid ${LACQUER}` : "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", padding: 0 }} />
                  ))}
                  <label title="Custom" style={{ width: 22, height: 22, border: "1px solid rgba(0,0,0,0.2)", borderRadius: 3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", position: "relative", overflow: "hidden" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={LACQUER} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} onBlur={() => setSigColorOpen(false)}
                      style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
                  </label>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={onClose} style={{ ...pageBtn, padding: "8px 16px", border: `1px solid ${LINE}`, color: "rgba(24,19,13,0.5)" }}>Cancel</button>
              <button onClick={handleInsert} style={{ ...pageBtn, padding: "8px 24px", background: LACQUER, color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(139,26,26,0.22)" }} disabled={signTab === "upload" && !uploadDataUrl}>Insert Signature</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

