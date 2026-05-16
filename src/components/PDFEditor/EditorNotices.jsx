import { LACQUER, INK, CINZEL, FELL } from "../utils/constant";

const BTN = {
  fontFamily: CINZEL,
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase",
  background: LACQUER,
  color: "#fff",
  border: "none",
  borderRadius: 3,
  padding: "5px 14px",
  cursor: "pointer",
  marginTop: 8,
  display: "inline-block",
};

const BTN_GHOST = {
  ...BTN,
  background: "transparent",
  color: LACQUER,
  border: `1px solid rgba(139,26,26,0.4)`,
  marginLeft: 8,
};

function NoticeBox({ title, children, onDismiss, ariaLabel }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        boxSizing: "border-box",
        margin: "12px 16px",
        padding: "12px 20px",
        background: "rgba(255,253,248,0.96)",
        borderLeft: `3px solid ${LACQUER}`,
        border: `1px solid rgba(116,86,44,0.2)`,
        borderLeftWidth: 3,
        borderLeftColor: LACQUER,
        borderRadius: 4,
        boxShadow: "0 2px 12px rgba(40,24,8,0.08)",
        fontFamily: FELL,
        fontSize: 13,
        lineHeight: 1.5,
        color: INK,
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        pointerEvents: "auto",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong
          style={{
            fontFamily: CINZEL,
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
            display: "block",
            marginBottom: 4,
            whiteSpace: "normal",
          }}
        >
          {title}
        </strong>

        <div style={{ overflowWrap: "anywhere" }}>
          {children}
        </div>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label={ariaLabel || "Dismiss notice"}
          style={{
            flex: "0 0 auto",
            background: "transparent",
            border: "none",
            color: LACQUER,
            fontFamily: CINZEL,
            fontSize: 14,
            cursor: "pointer",
            padding: "0 4px",
            fontWeight: 700,
          }}
        >
          X
        </button>
      )}
    </div>
  );
}

export default function EditorNotices({
  pages = [],
  hasTextLayer,
  textLayerNoticeDismissed,
  setTextLayerNoticeDismissed,
  isEncrypted,
  encryptionNoticeDismissed,
  setEncryptionNoticeDismissed,
  ocrState,
  ocrProgress,
  ocrError,
  onActivateOCR,
  onCancelOCR,
  onDismissOCRDone,
}) {
  if (pages.length === 0) return null;

  const hasOCRNotice = ocrState === 'running' || ocrState === 'done';
  if (
    !hasOCRNotice &&
    (!isEncrypted || encryptionNoticeDismissed) &&
    (hasTextLayer || textLayerNoticeDismissed)
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: "relative",
        zIndex: 500,
        width: "100%",
        flexShrink: 0,
      }}
    >
      {isEncrypted && !encryptionNoticeDismissed && (
        <NoticeBox
          title="Password-protected PDF"
          onDismiss={() => setEncryptionNoticeDismissed(true)}
          ariaLabel="Dismiss password-protected notice"
        >
          This PDF is password-protected. Decrypted contents may not save correctly. Decrypt it first, then re-open.
        </NoticeBox>
      )}

      {ocrState === 'running' && (
        <NoticeBox
          title="Reading text…"
          onDismiss={onCancelOCR}
          ariaLabel="Cancel OCR"
        >
          Reading page {ocrProgress.page} of {ocrProgress.total}
          {ocrProgress.pct > 0 ? ` — ${ocrProgress.pct}%` : "…"}
          <button onClick={onCancelOCR} style={BTN_GHOST}>Cancel</button>
        </NoticeBox>
      )}

      {ocrState === 'done' && (
        <NoticeBox
          title="OCR Complete"
          onDismiss={onDismissOCRDone}
          ariaLabel="Dismiss OCR complete notice"
        >
          OCR complete. Click the scanned text to edit it.
        </NoticeBox>
      )}

      {!hasTextLayer && !textLayerNoticeDismissed && ocrState !== 'running' && ocrState !== 'done' && (
        <NoticeBox
          title="Scanned PDF"
          onDismiss={() => setTextLayerNoticeDismissed(true)}
          ariaLabel="Dismiss scanned PDF notice"
        >
          {ocrState === 'error' ? (
            <>
              OCR failed.{ocrError ? ` (${ocrError})` : ' Try a clearer scan or a smaller file.'}{" "}
              <button onClick={onActivateOCR} style={BTN}>Try again</button>
            </>
          ) : (
            <>
              This looks like a scanned PDF. Activate OCR to detect editable text.
              <br />
              <button onClick={onActivateOCR} style={BTN}>Activate OCR</button>
            </>
          )}
        </NoticeBox>
      )}
    </div>
  );
}
