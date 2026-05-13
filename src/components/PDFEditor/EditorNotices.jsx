import { PARCHMENT_2, LACQUER, INK, CINZEL, FELL } from "../utils/constant";

export default function EditorNotices({
  pages,
  hasTextLayer,
  textLayerNoticeDismissed,
  setTextLayerNoticeDismissed,
  isEncrypted,
  encryptionNoticeDismissed,
  setEncryptionNoticeDismissed
}) {
  if (pages.length === 0) return null;
  if ((!isEncrypted || encryptionNoticeDismissed) && (hasTextLayer || textLayerNoticeDismissed)) return null;

  return (
    <div style={{ position: 'relative', zIndex: 500, background: 'transparent', paddingBottom: 20 }}>
      {isEncrypted && !encryptionNoticeDismissed && (
        <div onClick={e => e.stopPropagation()} style={{
          maxWidth: 1600, margin: "20px auto 0", padding: "14px 20px",
          background: PARCHMENT_2, borderLeft: `3px solid ${LACQUER}`,
          fontFamily: FELL, fontSize: 14, lineHeight: 1.5, color: INK,
          display: "flex", alignItems: "flex-start", gap: 12,
          pointerEvents: 'auto',
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontFamily: CINZEL, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              Password-protected PDF
            </strong>
            This PDF is password-protected. Decrypted contents may not save correctly. Decrypt it first, then re-open.
          </div>
          <button onClick={() => setEncryptionNoticeDismissed(true)} aria-label="Dismiss password-protected notice" style={{
            background: "transparent", border: "none", color: LACQUER,
            fontFamily: CINZEL, fontSize: 14, cursor: "pointer", padding: "0 4px", fontWeight: 700,
          }}>X</button>
        </div>
      )}

      {!hasTextLayer && !textLayerNoticeDismissed && (
        <div onClick={e => e.stopPropagation()} style={{
          maxWidth: 1600, margin: "20px auto 0", padding: "14px 20px",
          background: PARCHMENT_2, borderLeft: `3px solid ${LACQUER}`,
          fontFamily: FELL, fontSize: 14, lineHeight: 1.5, color: INK,
          display: "flex", alignItems: "flex-start", gap: 12,
          pointerEvents: 'auto',
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <div style={{ flex: 1 }}>
            <strong style={{ fontFamily: CINZEL, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              No editable text in this PDF
            </strong>
            This PDF doesn't have a selectable text layer - it's likely a scanned image or printed from a browser. You can't edit the existing text, but you can still <em>add new text and images</em> on top using the buttons on each page.
          </div>
          <button onClick={() => setTextLayerNoticeDismissed(true)} style={{
            background: "transparent", border: "none", color: LACQUER,
            fontFamily: CINZEL, fontSize: 14, cursor: "pointer", padding: "0 4px", fontWeight: 700,
          }}>X</button>
        </div>
      )}
    </div>
  );
}
