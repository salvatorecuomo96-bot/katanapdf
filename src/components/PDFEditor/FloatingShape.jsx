import { useEffect } from "react";

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
            onMouseDown={onStartDrag}
            style={{
              position: 'absolute', top: -28, left: 0, right: 0,
              background: '#8B1A1A', padding: '4px 8px', fontSize: 10,
              color: '#fff', cursor: 'grab', display: 'flex',
              alignItems: 'center', gap: 6, borderRadius: '4px 4px 0 0',
            }}
          >
            <span style={{ fontWeight: 700, letterSpacing: 2 }}>{shapeType === 'circle' ? 'CIRCLE' : 'SQUARE'}</span>
            <span style={{ opacity: 0.6, fontSize: 8, letterSpacing: '1.5px', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>· Tab ↵</span>
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
