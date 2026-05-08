# Phase 10 — Text highlighting (block-level for v1)

**Goal:** let users mark up parts of a PDF with translucent highlights. Common annotation feature; ships block-level for v1, range-level (drag-select within a paragraph) is a future enhancement.
**Effort:** ~30 min
**Done when:** clicking a "Highlight" toggle while a text block is selected paints a translucent yellow background behind it; the highlight is visible in the editor and survives download (visible in another PDF viewer).

> Block-level highlighting. The user clicks an existing text block, the EditPopup opens (existing flow), and a "Highlight" toggle in its toolbar adds/removes a `highlightColor` field on the text block. The highlight renders behind the text in both the canvas overlay and the saved PDF.
>
> 1. **State.** Add an optional `highlightColor` (string, default `null`) to the `textBlock` shape produced in `loadPdfFromBytes` and `pageWordsToTextBlock`. Persist through tab snapshots like the other fields.
> 2. **Toggle UI.** In `EditPopup` toolbar (the burgundy strip with ✓), add a small highlight chip next to the existing controls. Click cycles through 4 presets — yellow `rgba(255,235,59,0.4)`, green `rgba(165,214,167,0.4)`, pink `rgba(255,182,193,0.4)`, blue `rgba(187,222,251,0.4)` — and a 5th option clears it. Update `commitEdit` so the chosen color lands on the textBlock.
> 3. **Editor render.** In `redrawPage` (canvas overlay path), draw the highlight rect first (`ctx.fillStyle = block.highlightColor; ctx.fillRect(block.x - 2, block.y - 2, block.width + 4, block.height + 4)`) before the white-rectangle / drawText path so the highlight sits behind the original-or-edited text.
> 4. **PDF export.** In `handleDownload`, before drawing the white rectangle and edited text, call `pdfPage.drawRectangle({ x, y, width, height, color: rgb(...), opacity: 0.4 })` if `highlightColor` is set. Same in `handleDownloadCanvasFallback`.
> 5. **Smoke test.** Highlighted block survives save/reload, and the saved bytes include a low-alpha rectangle near the block's coords.
> 6. Update homepage "What you can do" and "Why katanapdf" copy to mention "Highlight text".
>
> Range-level highlighting (drag-select within a paragraph) is intentionally out of scope here — it requires character-level selection coords that the current canvas-rendered architecture doesn't expose. Document as a follow-up phase if there's user demand.
