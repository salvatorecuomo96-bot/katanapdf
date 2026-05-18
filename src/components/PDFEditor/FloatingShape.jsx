import { useEffect, useState } from "react";
import { DRAW_COLORS, GOLD, INK, LACQUER, PARCHMENT } from "../utils/constant";
import HexColorInput from "./HexColorInput";

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

  const [colorOpen, setColorOpen] = useState(false);
  const isLineShape = shapeType === 'checkmark' || shapeType === 'cross' || shapeType === 'line' || shapeType === 'arrow';

  // Toolbar positioning: place it at the visual "above" edge for the viewer based on page rotation.
  // rotation=0  → toolbar above shape in page space  → appears above to viewer ✓
  // rotation=90 → toolbar left of shape in page space → appears above to viewer (page rotated 90°CW) ✓
  // rotation=180→ toolbar below shape in page space  → appears above to viewer (page is upside-down) ✓
  // rotation=270→ toolbar right of shape in page space→ appears above to viewer ✓
  const r = ((rotation % 360) + 360) % 360;
  const TH = 32;
  const toolbarWrap = r === 0
    ? { position: 'absolute', top: -TH, left: 0, right: 0, height: TH, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : r === 90
    ? { position: 'absolute', left: -TH, top: 0, bottom: 0, width: TH, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : r === 180
    ? { position: 'absolute', bottom: -TH, left: 0, right: 0, height: TH, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }
    : /* 270 */ { position: 'absolute', right: -TH, top: 0, bottom: 0, width: TH, overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  const toolbarContent = {
    display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6,
    background: '#fffdf8', padding: '4px 8px', fontSize: 10, color: INK,
    cursor: 'default', whiteSpace: 'nowrap', height: TH, boxSizing: 'border-box',
    border: '1px solid rgba(116,86,44,0.25)',
    boxShadow: '0 4px 16px rgba(40,24,8,0.12)',
    borderRadius: r === 0 ? '4px 4px 0 0' : r === 90 ? '4px 0 0 4px' : r === 180 ? '0 0 4px 4px' : '0 4px 4px 0',
    transform: r !== 0 ? `rotate(${-rotation}deg)` : undefined,
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
                onTouchStart={e => { e.stopPropagation(); const t = e.touches[0]; onStartDrag({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => {}, stopPropagation: () => {} }); }}
                title="Drag to move"
                style={{ height: 22, border: '1px solid rgba(116,86,44,0.22)', borderRadius: 2, background: 'rgba(139,26,26,0.04)', color: INK, fontSize: 9, cursor: 'grab', padding: '1px 5px', display: 'inline-flex', alignItems: 'center', gap: 2, userSelect: 'none', flexShrink: 0 }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,display:'block'}}><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
              </button>
              <span style={{ fontWeight: 700, letterSpacing: 2 }}>{SHAPE_LABELS[shapeType] || shapeType.toUpperCase()}</span>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  title="Shape colour"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); setColorOpen(o => !o); }}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: shapeColor, border: '1.5px solid rgba(0,0,0,0.35)', cursor: 'pointer', padding: 0, display: 'block' }}
                />
                {colorOpen && (
                  <div onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, display: 'flex', flexDirection: 'column', background: PARCHMENT, border: `1px solid ${GOLD}`, borderRadius: 4, padding: 5, zIndex: 10000, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                      {DRAW_COLORS.map(c => (
                        <button key={c} type="button" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onUpdate({ shapeColor: c }); setColorOpen(false); }}
                          style={{ width: 20, height: 20, background: c, border: shapeColor === c ? `2px solid ${LACQUER}` : '1px solid rgba(0,0,0,0.2)', borderRadius: 3, cursor: 'pointer', padding: 0 }} />
                      ))}
                    </div>
                    <HexColorInput value={shapeColor} onChange={v => onUpdate({ shapeColor: v })} onDone={() => setColorOpen(false)} />
                  </div>
                )}
              </div>
              {!isLineShape && (
                <span
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onUpdate({ shapeFill: !shapeFill }); }}
                  style={{ fontSize: 9, cursor: 'pointer', border: '1px solid rgba(116,86,44,0.25)', padding: '1px 6px', borderRadius: 2, height: 22, display: 'inline-flex', alignItems: 'center', background: shapeFill ? 'rgba(139,26,26,0.10)' : 'rgba(139,26,26,0.04)', color: INK }}
                  title="Toggle fill"
                >
                  {shapeFill ? 'FILLED' : 'OUTLINE'}
                </span>
              )}
              <button
                type="button"
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onDelete(); }}
                style={{ marginLeft: 'auto', background: LACQUER, color: '#fff', border: `1px solid ${LACQUER}`, borderRadius: 3, padding: '1px 8px', cursor: 'pointer', fontWeight: 700, fontSize: 10, height: 22 }}
              >×</button>
            </div>
          </div>
          {/* Bottom-center resize handle */}
          <div
            onMouseDown={e => { e.stopPropagation(); onStartResize(e, 's'); }}
            style={{
              position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
              width: 22, height: 10, background: '#ff2222',
              cursor: 's-resize', borderRadius: 2, border: '2px solid #fff',
            }}
          />
          {/* Right-center resize handle */}
          <div
            onMouseDown={e => { e.stopPropagation(); onStartResize(e, 'e'); }}
            style={{
              position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
              width: 10, height: 22, background: '#ff2222',
              cursor: 'e-resize', borderRadius: 2, border: '2px solid #fff',
            }}
          />
          {/* Bottom-right corner resize handle */}
          <div
            onMouseDown={e => { e.stopPropagation(); onStartResize(e, 'se'); }}
            style={{
              position: 'absolute', bottom: -8, right: -8,
              width: 16, height: 16, background: '#ff2222',
              cursor: 'nwse-resize', borderRadius: '50%', border: '2px solid #fff',
            }}
          />
        </>
      )}
    </div>
  );
}
