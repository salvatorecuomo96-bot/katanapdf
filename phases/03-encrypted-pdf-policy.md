# Phase 3 — Encrypted PDF policy ✅ Done 2026-05-08

**Goal:** stop silently re-saving encrypted PDFs as unencrypted.
**Effort:** ~15 min
**Done when:** opening an encrypted PDF either decrypts (empty password) or shows a clear "this PDF is password-protected" message instead of half-broken output.

> In `loadPdfFromBytes`, detect encryption via pdf-lib's `PDFDocument.load(bytes, { ignoreEncryption: false })` first. If it throws an encryption error, retry with `ignoreEncryption: true` AND show a banner: "This PDF is password-protected. Decrypted contents may not save correctly. Decrypt it first, then re-open." In `handleDownload`, also remove the silent `ignoreEncryption: true` — replace it with the same upfront check. Add a smoke test: an encrypted synthetic PDF triggers the banner path.

**Outcome:** Added `isEncrypted` + `encryptionNoticeDismissed` state, plumbed through tab snapshots. `loadPdfFromBytes` does an upfront strict pdf-lib probe — pdfjs renders the document either way, but the strict probe sets `isEncrypted` so a parchment banner ("Password-protected PDF — decrypted contents may not save correctly") appears with a dismissible ✕. `handleDownload` no longer silently strips encryption. New smoke test verifies pdf-lib's strict load throws on `/Encrypt`-trailer PDFs and that `ignoreEncryption: true` still loads them. Tests now 8/8.
