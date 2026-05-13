import { LACQUER, PARCHMENT, CROSSHATCH, CINZEL, pageBtn } from "../utils/constant";

export default function GridView({
  visiblePages,
  rotatedPages,
  deletedPages,
  pageOrder,
  pages,
  setIsGridView,
  rotatePage,
  deletePage,
  movePageTo,
  draggedPageNum,
  setDraggedPageNum,
  dragOverPageNum,
  setDragOverPageNum,
  containerRef,
  canvasRefs
}) {
  return (
    <div ref={containerRef} style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'auto', padding: '40px 60px 80px 60px', background: PARCHMENT, backgroundImage: CROSSHATCH, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", alignItems: "start", gap: 20, boxSizing: "border-box" }}>
      {visiblePages.map((pg, displayIdx) => {
        if (!pg) return null;
        const rotation = rotatedPages[pg.num] || 0;
        const swap = rotation === 90 || rotation === 270;
        const scale = Math.min(240 / (swap ? pg.height : pg.width), 0.5);
        const dispW = (swap ? pg.height : pg.width) * scale;
        const dispH = (swap ? pg.width : pg.height) * scale;

        return (
          <div key={pg.num}
               draggable={true}
               onDragStart={e => {
                 e.dataTransfer.effectAllowed = "move";
                 setTimeout(() => setDraggedPageNum(pg.num), 0);
               }}
               onDragOver={e => {
                 if (draggedPageNum !== null && draggedPageNum !== pg.num) {
                   e.preventDefault();
                   e.dataTransfer.dropEffect = "move";
                   setDragOverPageNum(pg.num);
                 }
               }}
               onDragLeave={() => {
                 if (dragOverPageNum === pg.num) setDragOverPageNum(null);
               }}
               onDrop={e => {
                 if (draggedPageNum !== null) {
                   e.preventDefault();
                   movePageTo(draggedPageNum, displayIdx);
                   setDraggedPageNum(null);
                   setDragOverPageNum(null);
                 }
               }}
               onDragEnd={() => {
                 setDraggedPageNum(null);
                 setDragOverPageNum(null);
               }}
               style={{
                 opacity: draggedPageNum === pg.num ? 0.5 : 1,
                 border: dragOverPageNum === pg.num ? `2px dashed ${LACQUER}` : "2px solid transparent",
                 padding: 4,
                 boxSizing: "border-box"
               }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
               <span style={{ fontFamily: CINZEL, fontSize: 11, color: LACQUER, letterSpacing: 4, textTransform: "uppercase", fontWeight: 600 }}>Page {displayIdx + 1}</span>
               <button onClick={e => { e.stopPropagation(); deletePage(pg.num); }} aria-label={`Delete page ${displayIdx + 1}`} title="Delete page" style={{ ...pageBtn, padding: "2px 6px", fontSize: 10 }}>X</button>
            </div>
            <div data-pgwrap={pg.num} onClick={e => { 
              e.stopPropagation(); 
              setIsGridView(false);
              setTimeout(() => {
                const container = containerRef.current;
                const el = container?.querySelector(`[data-pgwrap="${pg.num}"]`);
                if (container && el) container.scrollTo({ top: el.offsetTop - 40, behavior: 'smooth' });
              }, 50);
            }} style={{ position: "relative", width: dispW, height: dispH, maxWidth: "100%", boxShadow: "0 4px 6px rgba(0,0,0,0.2), 0 24px 64px rgba(0,0,0,0.6)", overflow: "visible", cursor: "pointer" }}>
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
