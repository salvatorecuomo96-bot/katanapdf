// This hook file is reserved for the next safe step: moving PDFEditor state/actions here.
// Keeping the editor logic in components/PDFEditor/PDFEditor.jsx avoids a risky rewrite of all
// drag, download, tab, and canvas references in one go.
export function usePDFEditor() {
  throw new Error("usePDFEditor is not wired yet; PDFEditor.jsx currently owns the editor state.");
}

