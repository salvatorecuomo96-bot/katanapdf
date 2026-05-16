import { GOLD, LACQUER, PARCHMENT, PARCHMENT_2, CINZEL, hiddenFileInput } from "../utils/constant";

export const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

export const RotateIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);

export default function PageSidebar({
  visiblePages = [],
  rotatedPages = {},
  isGridView,
  setIsGridView,
  handleAppendFile,
  rotatePage,
  deletePage,
  addBlankPage,
  movePageTo,
  containerRef,
  draggedPageNum,
  setDraggedPageNum,
  dragOverPageNum,
  setDragOverPageNum
}) {
  return (
    <aside
      style={{
        width: "340px",
        flex: "0 0 340px",
         height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        background: PARCHMENT_2,
        borderRight: `1px solid rgba(139,26,26,0.5)`,
        borderTop: `1px solid rgba(139,26,26,0.2)`,
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
        alignSelf: "stretch",
      }}
    >
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: PARCHMENT_2, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(139,26,26,0.1)' }}>
        <button onClick={() => setIsGridView(g => !g)} title={isGridView ? "Exit Grid" : "Grid View"} style={{ width: 32, height: 32, border: `1px solid rgba(196,150,58,0.4)`, borderRadius: '4px', background: PARCHMENT, color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GridIcon />
        </button>
        <label title="Add PDF or Image" style={{ width: 32, height: 32, border: `1px solid rgba(196,150,58,0.4)`, borderRadius: '4px', background: PARCHMENT, color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600 }}>
          +
          <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleAppendFile} style={hiddenFileInput} />
        </label>
      </div>
      
      <div
        style={{
          padding: "16px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          minHeight: 0,
        }}
      >      {visiblePages.map((pg, i) => {
        const rotation = rotatedPages[pg.num] || 0;
        const swap = rotation === 90 || rotation === 270;
        return (
          <div key={`side-${pg.num}`}
               draggable={true}
               onClick={() => {
                 if (isGridView) setIsGridView(false);
                 setTimeout(() => {
                   const container = containerRef.current;
                   const el = container?.querySelector(`[data-pgwrap="${pg.num}"]`);
                   if (container && el) container.scrollTo({ top: el.offsetTop - 40, behavior: 'smooth' });
                 }, 50);
               }}
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
                   movePageTo(draggedPageNum, i);
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
                 borderBottom: dragOverPageNum === pg.num ? `4px solid ${LACQUER}` : "none",
                 transition: 'opacity 0.2s'
               }}>
            <div style={{ 
              position: 'relative', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', border: `1px solid ${GOLD}`, cursor: 'pointer',
              aspectRatio: swap ? `${pg.height} / ${pg.width}` : `${pg.width} / ${pg.height}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
            }}>
              <img src={pg.dataUrl} alt={`Page ${i+1}`} 
                style={{ 
                  transform: `rotate(${rotation}deg)`, 
                  width: swap ? 'auto' : '100%', 
                  height: swap ? '100%' : 'auto',
                  display: 'block' 
                }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontFamily: CINZEL, fontSize: 10, color: LACQUER, fontWeight: 600 }}>{i + 1}</span>
              <button onClick={(e) => { e.stopPropagation(); rotatePage(pg.num); }} style={{ width: 26, height: 26, border: '1px solid rgba(196,150,58,0.4)', borderRadius: '4px', background: PARCHMENT, color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Rotate">
                <RotateIcon size={14} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); addBlankPage(pg.num); }} style={{ width: 26, height: 26, border: '1px solid rgba(196,150,58,0.4)', borderRadius: '4px', background: PARCHMENT, color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Add blank page after">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="12" y2="19"/><line x1="9" y1="16" x2="15" y2="16"/></svg>
              </button>
              <button onClick={(e) => { e.stopPropagation(); deletePage(pg.num); }} style={{ width: 26, height: 26, border: '1px solid rgba(196,150,58,0.4)', borderRadius: '4px', background: PARCHMENT, color: LACQUER, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }} title="Delete">X</button>
            </div>
            
            {i < visiblePages.length - 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                <label style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: GOLD, color: PARCHMENT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>
                  +
                  <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleAppendFile} style={hiddenFileInput} />
                </label>
              </div>
            )}
          </div>
        );
      })}

      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '20px 10px', border: `1px dashed ${LACQUER}`, background: 'rgba(139,26,26,0.05)', color: LACQUER, cursor: 'pointer', marginTop: 12 }}>
        <span style={{ fontSize: 20 }}>+</span>
        <span style={{ fontFamily: CINZEL, fontSize: 10, letterSpacing: 1, fontWeight: 600 }}>Add PDF, image files</span>
        <input type="file" accept="application/pdf,.pdf,image/*" onChange={handleAppendFile} style={hiddenFileInput} />
      </label>
      </div>
    </aside>
  );
}
