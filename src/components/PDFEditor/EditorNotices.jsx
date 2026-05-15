import { C, LACQUER, CINZEL, FELL } from "../utils/constant";

function NoticeBox({ title, children, onDismiss, ariaLabel }) {
  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        boxSizing: "border-box",
        margin: "12px 16px",
        padding: "12px 20px",
        background: C.card,
        borderLeft: `3px solid ${LACQUER}`,
        borderRadius: 4,
        boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
        fontFamily: FELL,
        fontSize: 13,
        lineHeight: 1.5,
        color: C.text,
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
}) {
  if (pages.length === 0) return null;
  if ((!isEncrypted || encryptionNoticeDismissed) && (hasTextLayer || textLayerNoticeDismissed)) {
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

      {!hasTextLayer && !textLayerNoticeDismissed && (
        <NoticeBox
          title="No editable text in this PDF"
          onDismiss={() => setTextLayerNoticeDismissed(true)}
          ariaLabel="Dismiss no editable text notice"
        >
          This PDF doesn't have a selectable text layer - it's likely a scanned image or printed from a browser. You can't edit the existing text, but you can still{" "}
          <em>add new text and images</em> on top using the buttons on each page.
        </NoticeBox>
      )}
    </div>
  );
}