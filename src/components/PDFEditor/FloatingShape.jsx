import { useEffect } from "react";

const SHAPE_LABELS = { circle: 'CIRCLE', square: 'SQUARE', checkmark: 'CHECKMARK', cross: 'CROSS', line: 'LINE', arrow: 'ARROW' };

export default function FloatingShape({ shape, isSel, zoom = 1, rotation = 0, onSelect, onStartDrag, onStartResize, onDelete, onUpdate, onDeselect }) {
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

  const isLineShape = shapeType === 'checkmark' || shapeType === 'cross' || shapeType === 'line' || shapeType === 'arrow';

  // Toolbar positioning: place it at the visual "above" edge for the viewer based on page rotation.
  // rotation=0  → toolbar above shape in page space  → appears above to viewer ✓
  // rotation=90 → toolbar left of shape in page space → appears above to viewer (page rotated 90°CW) ✓
  // rotation=180→ toolbar below shape in page space  → appears above to viewer (page is upside-down) ✓
  // rotation=270→ toolbar right of shape in page space→ appears above to viewer ✓
  const r = ((rotation % 360) + 360) % 360;
  const TH = 28;
  const toolbarWrap = r === 0
    ? { position: 'absolute', top: -TH, left: 0, right: 0, height: TH, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : r === 90
    ? { position: 'absolute', left: -TH, top: 0, bottom: 0, width: TH, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : r === 180
    ? { position: 'absolute', bottom: -TH, left: 0, right: 0, height: TH, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : /* 270 */ { position: 'absolute', right: -TH, top: 0, bottom: 0, width: TH, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  const toolbarContent = {
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6,
    background: '#8B1A1A', padding: '4px 8px', fontSize: 10, color: '#fff',
    cursor: 'default', whiteSpace: 'nowrap', height: TH, boxSizing: 'border-box',
    borderRadius: r === 0 ? '4px 4px 0 0' : r === 90 ? '4px 0 0 4px' : r === 180 ? '0 0 4px 4px' : '0 4px 4px 0',
    // Counter-rotate content so it's readable regardless of page rotation
    transform: r !== 0 ? `rotate(${-rotation}deg)` : undefined,
    // For r=0/180 stretch full width; for 90/270 let it overflow from center
    ...(r === 0 || r === 180 ? { width: '100%' } : {}),
  };

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
          <ellipse cx="50" cy="50" rx="47" ry="47" fill={shapeFill ? shapeColor : 'none'} stroke={shapeColor} strokeWidth="4" vectorEffect="non-scaling-stroke" />
        ) : shapeType === 'square' ? (
          <rect x="3" y="3" width="94" height="94" fill={shapeFill ? shapeColor : 'none'} stroke={shapeColor} strokeWidth="4" vectorEffect="non-scaling-stroke" />
        ) : shapeType === 'checkmark' ? (
          <polyline points="10,60 38,85 90,18" fill="none" stroke={shapeColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ) : shapeType === 'cross' ? (
          <>
            <line x1="12" y1="12" x2="88" y2="88" stroke={shapeColor} strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <line x1="88" y1="12" x2="12" y2="88" stroke={shapeColor} strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </>
        ) : shapeType === 'line' ? (
          <line x1="5" y1="50" x2="95" y2="50" stroke={shapeColor} strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ) : shapeType === 'arrow' ? (
          <>
            <line x1="5" y1="50" x2="82" y2="50" stroke={shapeColor} strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <polyline points="60,22 92,50 60,78" fill="none" stroke={shapeColor} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </>
        ) : null}
      </svg>

      {isSel && (
        <>
          {/* Toolbar: positioned at the correct visual edge, content counter-rotated to be readable */}
          <div onMouseDown={e => e.stopPropagation()} style={toolbarWrap}>
            <div style={toolbarContent}>
              <button
                type="button"
                onMouseDown={e => { e.stopPropagation(); onStartDrag(e); }}
                title="Drag to move"
                style={{ height: 18, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2, background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 9, cursor: 'grab', padding: '1px 4px', display: 'inline-flex', alignItems: 'center', gap: 2, userSelect: 'none', flexShrink: 0 }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:'block'}}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
              </button>
              <span style={{ fontWeight: 700, letterSpacing: 2 }}>{SHAPE_LABELS[shapeType] || shapeType.toUpperCase()}</span>
              <input
                type="color"
                value={shapeColor}
                onChange={e => onUpdate({ shapeColor: e.target.value })}
                onMouseDown={e => e.stopPropagation()}
                style={{ width: 18, height: 18, cursor: 'pointer', border: 'none', background: 'none', padding: 0, flexShrink: 0 }}
                title="Shape color"
              />
              {!isLineShape && (
                <span
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onUpdate({ shapeFill: !shapeFill }); }}
                  style={{ fontSize: 9, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.5)', padding: '1px 4px', borderRadius: 2 }}
                  title="Toggle fill"
                >
                  {shapeFill ? 'FILLED' : 'OUTLINE'}
                </span>
              )}
              <span
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onDelete(); }}
                style={{ marginLeft: 'auto', cursor: 'pointer', fontWeight: 700 }}
              >X</span>
            </div>
          </div>
          {/* Bottom-center resize handle */}
          <div
            onMouseDown={e => { e.stopPropagation(); onStartResize(e, 's'); }}
            style={{
              position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
              width: 22, height: 10, background: '#8B1A1A',
              cursor: 's-resize', borderRadius: 2, border: '2px solid #fff',
            }}
          />
          {/* Right-center resize handle */}
          <div
            onMouseDown={e => { e.stopPropagation(); onStartResize(e, 'e'); }}
            style={{
              position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
              width: 10, height: 22, background: '#8B1A1A',
              cursor: 'e-resize', borderRadius: 2, border: '2px solid #fff',
            }}
          />
          {/* Bottom-right corner resize handle */}
          <div
            onMouseDown={e => { e.stopPropagation(); onStartResize(e, 'se'); }}
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
