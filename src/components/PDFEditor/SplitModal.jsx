import { useState, useMemo } from "react";
import { CINZEL, FELL, LACQUER, INK } from "../utils/constant";


const GC = [
  { bg: "rgba(219,234,254,0.7)",  bd: "rgba(59,130,246,0.22)"  },
  { bg: "rgba(220,252,231,0.7)",  bd: "rgba(34,197,94,0.22)"   },
  { bg: "rgba(254,249,195,0.7)",  bd: "rgba(234,179,8,0.22)"   },
  { bg: "rgba(252,231,243,0.7)",  bd: "rgba(236,72,153,0.22)"  },
  { bg: "rgba(237,233,254,0.7)",  bd: "rgba(139,92,246,0.22)"  },
  { bg: "rgba(255,237,213,0.7)",  bd: "rgba(249,115,22,0.22)"  },
  { bg: "rgba(204,251,241,0.7)",  bd: "rgba(20,184,166,0.22)"  },
  { bg: "rgba(255,228,196,0.7)",  bd: "rgba(180,83,9,0.22)"    },
];

export default function SplitModal({ pages, pageOrder, deletedPages, onSplitDownload, onExtractDownload, onClose }) {
  const [cuts, setCuts] = useState(new Set()); // display-idx after which a cut exists
  const [sel,  setSel]  = useState(new Set()); // selected display-idx

  const finalOrder = useMemo(
    () => pageOrder.filter(pIdx => pages[pIdx] && !deletedPages.has(pages[pIdx].num)),
    [pageOrder, deletedPages, pages]
  );

  // Array of arrays of pIdx, one per split group
  const groups = useMemo(() => {
    if (!cuts.size) return null;
    const out = []; let cur = [];
    finalOrder.forEach((pIdx, di) => {
      cur.push(pIdx);
      if (cuts.has(di)) { out.push(cur); cur = []; }
    });
    if (cur.length) out.push(cur);
    return out;
  }, [finalOrder, cuts]);

  // displayIdx → group index (for coloring)
  const groupOf = useMemo(() => {
    const map = new Map();
    let gi = 0;
    finalOrder.forEach((_, di) => { map.set(di, gi); if (cuts.has(di)) gi++; });
    return di => map.get(di) ?? 0;
  }, [finalOrder, cuts]);

  const toggleCut = di => {
    if (di >= finalOrder.length - 1) return;
    setSel(new Set());
    setCuts(prev => { const n = new Set(prev); n.has(di) ? n.delete(di) : n.add(di); return n; });
  };

  const toggleSel = di => {
    setCuts(new Set());
    setSel(prev => { const n = new Set(prev); n.has(di) ? n.delete(di) : n.add(di); return n; });
  };

  const doSplit   = () => { onSplitDownload(groups);                                                onClose(); };
  const doExtract = () => { onExtractDownload([...sel].sort((a,b)=>a-b).map(di=>finalOrder[di])); onClose(); };

  const hasCuts = cuts.size > 0;
  const hasSel  = sel.size  > 0;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.52)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "24px 16px",
        backdropFilter: "blur(4px)",
        overflowY: "auto",
      }}
    >
      <style>{`
        .sm-page   { transition: border-color .13s, background .13s; }
        .sm-page:hover { border-color: rgba(139,26,26,0.28) !important; }
        .sm-cut    { transition: opacity .13s, transform .13s, color .13s; }
        .sm-cut:not(.on) { opacity: 0.22; }
        .sm-cut:not(.on):hover { opacity: 0.7; color: ${LACQUER}; }
        .sm-cut.on { opacity: 1; color: ${LACQUER}; transform: scale(1.18); }
      `}</style>

      <div style={{
        background: "#fff", borderRadius: 10,
        width: "min(940px, 100%)",
        maxHeight: "calc(100vh - 48px)",
        display: "flex", flexDirection: "column",
        boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{ padding: "22px 28px 14px", borderBottom: "1px solid rgba(0,0,0,0.07)", flexShrink: 0, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: CINZEL, fontSize: 19, fontWeight: 800, color: INK, letterSpacing: 0.5 }}>
              Split PDF
            </h2>
            <p style={{ margin: "5px 0 0", fontFamily: FELL, fontSize: 13, color: "rgba(0,0,0,0.44)", lineHeight: 1.5 }}>
              {hasCuts
                ? `${groups.length} file${groups.length !== 1 ? "s" : ""} — click ✂ again to remove a cut`
                : hasSel
                ? `${sel.size} page${sel.size !== 1 ? "s" : ""} selected — click more pages to add`
                : "Click ✂ between pages to add a cut point · or click a thumbnail to select pages"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "rgba(0,0,0,0.3)", padding: "2px 4px", marginLeft: 16, flexShrink: 0, lineHeight: 1 }}>✕</button>
        </div>

        {/* ── Page grid ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px 8px", background: "#f5f5f5" }}>
          <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 760, margin: "0 auto" }}>
            {finalOrder.map((pIdx, di) => {
              const pg = pages[pIdx];
              if (!pg) return null;
              const isLast    = di === finalOrder.length - 1;
              const isSelected = sel.has(di);
              const cutHere   = cuts.has(di);
              const gi        = groupOf(di);
              const gc        = hasCuts ? GC[gi % GC.length] : null;

              return (
                <div key={pIdx} style={{ display: "flex", alignItems: "center" }}>

                  {/* Page card */}
                  <div
                    className="sm-page"
                    onClick={() => toggleSel(di)}
                    style={{
                      width: 112, cursor: "pointer",
                      borderRadius: 5, padding: "6px 6px 4px",
                      background: gc ? gc.bg : isSelected ? "rgba(139,26,26,0.06)" : "#fff",
                      border: isSelected
                        ? `2px solid ${LACQUER}`
                        : gc ? `2px solid ${gc.bd}` : "2px solid transparent",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                      margin: "4px 0",
                      userSelect: "none",
                    }}
                  >
                    <div style={{ position: "relative", paddingBottom: "141%", background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 2, overflow: "hidden" }}>
                      <img
                        src={pg.dataUrl}
                        alt={`Page ${di + 1}`}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                      />
                    </div>
                    <div style={{
                      textAlign: "center", marginTop: 5,
                      fontFamily: CINZEL, fontSize: 10, letterSpacing: 0.5,
                      color: isSelected ? LACQUER : "rgba(0,0,0,0.45)",
                      fontWeight: isSelected ? 700 : 500,
                    }}>
                      {di + 1}
                    </div>
                  </div>

                  {/* Scissor between this page and next */}
                  {!isLast && (
                    <button
                      className={`sm-cut${cutHere ? " on" : ""}`}
                      onClick={() => toggleCut(di)}
                      title={cutHere ? "Remove cut point" : "Cut here"}
                      style={{
                        width: 28, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                        color: cutHere ? LACQUER : "rgba(0,0,0,0.5)",
                        fontSize: 17, lineHeight: 1,
                        marginBottom: 16,
                      }}
                    >
                      ✂
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, background: "#fff" }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setCuts(new Set()); setSel(new Set(finalOrder.map((_, i) => i))); }}
              style={{ fontFamily: CINZEL, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", cursor: "pointer", padding: "8px 16px", background: "transparent", border: "1px solid rgba(0,0,0,0.18)", color: INK, borderRadius: 3 }}
            >
              Select all
            </button>
            <button
              onClick={() => { setCuts(new Set()); setSel(new Set()); }}
              disabled={!hasCuts && !hasSel}
              style={{ fontFamily: CINZEL, fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", cursor: hasCuts || hasSel ? "pointer" : "default", padding: "8px 16px", background: "transparent", border: "1px solid rgba(0,0,0,0.18)", color: INK, borderRadius: 3, opacity: hasCuts || hasSel ? 1 : 0.35 }}
            >
              Reset
            </button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {!hasSel && !hasCuts && (
              <button disabled style={{ fontFamily: CINZEL, fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, cursor: "default", padding: "10px 24px", background: "rgba(0,0,0,0.06)", color: "rgba(0,0,0,0.25)", border: "none", borderRadius: 4 }}>
                Split / Extract
              </button>
            )}
            {hasSel && (
              <button onClick={doExtract} style={{ fontFamily: CINZEL, fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 800, cursor: "pointer", padding: "10px 26px", background: LACQUER, color: "#fff", border: "none", borderRadius: 4, boxShadow: "0 4px 16px rgba(139,26,26,0.24)" }}>
                Download {sel.size} page{sel.size !== 1 ? "s" : ""}
              </button>
            )}
            {hasCuts && (
              <button onClick={doSplit} style={{ fontFamily: CINZEL, fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 800, cursor: "pointer", padding: "10px 26px", background: LACQUER, color: "#fff", border: "none", borderRadius: 4, boxShadow: "0 4px 16px rgba(139,26,26,0.24)" }}>
                Split into {groups.length} file{groups.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
