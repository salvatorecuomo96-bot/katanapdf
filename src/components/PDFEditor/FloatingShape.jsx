import { useEffect } from "react";
import { INK, GOLD, CINZEL } from "../utils/constant";

export default function FloatingShape({ shape, isSel, zoom = 1, onSelect, onStartDrag, onStartResize, onDelete, onUpdate, onDeselect }) {
  const { x, y, w, h, shapeType, shapeColor, shapeFill, z } = shape;

  useEffect(() => {
    if (!isSel) return;
    const handler = (e) => {
      if (e.key === "Tab" || e.key === "Escape") {
        e.preventDefault();
        onDeselect();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isSel, onDeselect]);

  return (
    <div
      onClick={e => { e.stopPropagation(); onSelect(); }}
      style={{
        position: 'absolute',
        left: x * zoom, top: y * zoom,
        width: w * zoom, height: h * zoom,
        zIndex: isSel ? 1000 : (z || 50),
        border: isSel ? '2px solid #8B1A1A' : 'none',
        boxSizing: 'border-box',
        boxShadow: isSel ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
        cursor: isSel ? 'default' : 'pointer',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        {shapeType === 'circle' ? (
          <ellipse
            cx="50" cy="50" rx="47" ry="47"
            fill={shapeFill ? shapeColor : 'none'}
            stroke={shapeColor}
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <rect
            x="3" y="3" width="94" height="94"
            fill={shapeFill ? shapeColor : 'none'}
            stroke={shapeColor}
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {isSel && (
        <>
          <div
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: -28, left: 0, right: 0,
              background: '#8B1A1A', padding: '4px 8px', fontSize: 10,
              color: '#fff', cursor: 'default', display: 'flex',
              alignItems: 'center', gap: 6, borderRadius: '4px 4px 0 0',
            }}
          >
            <button
              type="button"
              onMouseDown={e => { e.stopPropagation(); onStartDrag(e); }}
              title="Drag to move"
              style={{ height: 18, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2, background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 9, cursor: 'grab', padding: '1px 4px', display: 'inline-flex', alignItems: 'center', gap: 2, userSelect: 'none', flexShrink: 0 }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:'block'}}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
            </button>
            <span style={{ fontWeight: 700, letterSpacing: 2 }}>{shapeType === 'circle' ? 'CIRCLE' : 'SQUARE'}</span>
            <input
              type="color"
              value={shapeColor}
              onChange={e => onUpdate({ shapeColor: e.target.value })}
              onMouseDown={e => e.stopPropagation()}
              style={{ width: 18, height: 18, cursor: 'pointer', border: 'none', background: 'none', padding: 0, flexShrink: 0 }}
              title="Shape color"
            />
            <span
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onUpdate({ shapeFill: !shapeFill }); }}
              style={{ fontSize: 9, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.5)', padding: '1px 4px', borderRadius: 2 }}
              title="Toggle fill"
            >
              {shapeFill ? 'FILLED' : 'OUTLINE'}
            </span>
            <span
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ marginLeft: 'auto', cursor: 'pointer', fontWeight: 700 }}
            >X</span>
          </div>
          <div
            onMouseDown={onStartResize}
            style={{
              position: 'absolute', bottom: -8, right: -8,
              width: 16, height: 16, background: '#8B1A1A',
              cursor: 'nwse-resize', borderRadius: '50%', border: '2px solid #fff',
            }}
          />
        </>
      )}
    </div>
  );
}
