# Phase 12 — Original text color (audit Stage 5)

**Goal:** small honesty fix — editing red text shouldn't silently turn it black.
**Effort:** ~15 min
**Done when:** editing red text outputs red.

> When extracting text blocks in `loadPdfFromBytes`, also call `page.getOperatorList()` and walk it to find the most recent `setFillRGBColor` operator before each text-show operator. Store that color on the text block. In `handleDownload`, pass it as the `color` to `pdfPage.drawText` instead of the hard-coded black. If extraction fails for a block, default to black (current behavior).
