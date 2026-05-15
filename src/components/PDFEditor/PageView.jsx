import { CINZEL, INK, LACQUER, pageBtn, PARCHMENT, hiddenFileInput } from "../utils/constant";
import EditPopup from "./EditPopup";
import FloatingBox from "./FloatingBox";
import FloatingImage from "./FloatingImage";

export const RotateIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);

export default function PageView({
  pg,
  displayIdx,
  visiblePages = [],
  zoom = 1,
  rotatedPages = {},
  textBlocks = {},
  activePopup = null,
  selected = null,
  floatingBoxes = [],
  floatingImages = [],
  canvasRefs = { current: {} },
  fontFamily,
  fontSize,
  isBold,
  isItalic,
  clickTextBlock,
  commitEdit,
  cancelEdit,
  addFloatingBox,
  updateFloatingBox,
  deleteFloatingBox,
  handleAddImage,
  deleteFloatingImage,
  startDragFloat,
  startResizeFb,
  startRotateFb,
  startDragImg,
  startResizeImg,
  setSelected,
  setActivePopup,
  movePageTo,
  rotatePage,
  deletePage
}) {
  const rotation = rotatedPages[pg.num] || 0;
  const swap = rotation === 90 || rotation === 270;
  const scale = zoom;
  const dispW = (swap ? pg.height : pg.width) * scale;
  const dispH = (swap ? pg.width : pg.height) * scale;

  return (
    <div style={{
      opacity: 1,
      border: "2px solid transparent",
      padding: 0,
      boxSizing: "border-box"
    }}>
      <div onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, width: dispW, maxWidth: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Page {displayIdx + 1}</span>
          <div style={{ ...pageBtn, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 3, fontWeight: 600 }}>MOVE TO:</span>
            <select 
              value={displayIdx + 1}
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val !== displayIdx + 1) movePageTo(pg.num, val - 1);
              }}
              style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, fontWeight: 600, background: "transparent", border: "none" }}
            >
              {visiblePages.map((_, i) => (
                <option key={i} value={i + 1} style={{ background: PARCHMENT, color: INK }}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>
          <button onClick={e => { e.stopPropagation(); rotatePage(pg.num); }} aria-label={`Rotate page ${displayIdx + 1}`} title="Rotate page" style={{ ...pageBtn, padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RotateIcon size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); deletePage(pg.num); }} aria-label={`Delete page ${displayIdx + 1}`} title="Delete page" style={{ ...pageBtn, padding: "4px 8px" }}>X</button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => addFloatingBox(pg.num)} style={pageBtn}>+ Add text</button>
          <label style={pageBtn}>
            + Add image
            <input type="file" accept="image/*" onChange={e => handleAddImage(e, pg.num)} style={hiddenFileInput} />
          </label>
        </div>
      </div>
      <div data-pgwrap={pg.num} onClick={e => { 
        e.stopPropagation(); 
        setSelected(null); 
        setActivePopup(null); 
      }} style={{ position: "relative", width: dispW, height: dispH, maxWidth: "100%", boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 24px 64px rgba(0,0,0,0.6)", overflow: "visible", cursor: "default" }}>
        <div style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: pg.width * scale,
          height: pg.height * scale,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          transformOrigin: "center center"
        }}>
          <canvas ref={(el) => { if (el) canvasRefs.current[pg.num] = el; else delete canvasRefs.current[pg.num]; }} style={{ display: "block", width: pg.width * scale, height: pg.height * scale }} />
          {(textBlocks[pg.num] || []).map(tb => {
            const isOpen = activePopup?.blockId === tb.id;
            return (
              <div key={tb.id} style={{
                position: "absolute", left: tb.x * scale, top: tb.y * scale,
                width: Math.max(tb.width * scale, 8),
                height: Math.max(tb.height * scale, tb.fontSize * scale * 0.9),
                zIndex: isOpen ? 3000 : 10, cursor: "text",
              }} onClick={e => clickTextBlock(tb, e)}>
                {isOpen && (
                  <EditPopup
                    block={tb}
                    zoom={scale}
                    rotation={rotation}
                    offsetX={activePopup.offsetX ?? 0}
                    offsetY={activePopup.offsetY ?? 0}
                    onOffsetChange={(ox, oy) =>
                      setActivePopup(ap =>
                        ap && ap.blockId === tb.id ? { ...ap, offsetX: ox, offsetY: oy } : ap
                      )
                    }
                    onCommit={(newText, ox, oy, fmt) =>
                      commitEdit(tb.id, tb.page, newText, ox, oy, fmt)
                    }
                    onCancel={cancelEdit}
                  />
                )}
              </div>
            );
          })}
          {floatingBoxes.filter(fb => fb.page === pg.num).map(fb => (
            <FloatingBox key={fb.id} fb={fb} isSel={selected === fb.id}
              zoom={scale}
              rotation={rotation}
              onSelect={() => setSelected(fb.id)}
              onStartDrag={e => startDragFloat(e, fb)}
              onStartResize={e => startResizeFb(e, fb)}
              onStartRotate={e => startRotateFb(e, fb)}
              onUpdate={u => updateFloatingBox(fb.id, u)}
              onCommit={() => setSelected(null)}
              onDelete={() => deleteFloatingBox(fb.id)} />
          ))}
          {floatingImages.filter(fi => fi.page === pg.num).map(fi => (
            <FloatingImage key={fi.id} fi={fi} isSel={selected === fi.id} zoom={scale}
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
}
