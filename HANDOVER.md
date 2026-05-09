# katanapdf — Handover

_Last updated: 2026-05-08_

## Context summary (2 sentences)
katanapdf is a fully client-side PDF editor (React 19 + Vite 8) that opens a PDF, lets the user edit existing text, add text/images, merge PDFs, and download — no server, no upload, no account; deployed at katanapdf.com. The work is structured as a 15-phase ROADMAP (Phases 1–5 shipped, Phase 6 next); each phase is one Claude Code session, all changes land on `main` via GitHub Actions CI.

## Tech stack
- **Frontend**: React 19, Vite 8, single-file `src/App.jsx` (~1900 lines), inline styles, ESLint flat config
- **PDF rendering**: `pdfjs-dist` v5 — legacy build (`pdfjs-dist/legacy/build/pdf.mjs`) for iOS Safari compatibility
- **PDF save / mutate**: `pdf-lib` v1 + `@pdf-lib/fontkit` (registered per save call)
- **Fonts**: `@fontsource/noto-sans`, `@fontsource/noto-serif`, `@fontsource/noto-sans-mono` — 7 latin-ext woff2 variants shipped at `public/fonts/` (~407 KB total). Embedded via `embedFont(bytes, { subset: true })`.
- **Tests**: bare Node `tests/export-smoke.mjs` (no Jest/Vitest), **9 round-trip checks** including a Unicode roundtrip (`café résumé piñata`).
- **CI**: GitHub Actions `.github/workflows/ci.yml` — `npm ci && lint && build && test:export`. Lint is `continue-on-error: true` (informational); build + test are required.
- **Hosting**: katanapdf.com (deployment outside the repo)

## Architecture

### File handling (100% client-side, no network for PDF data)
- **Open**: `<input type="file">` → `file.arrayBuffer()` → `Uint8Array` stored as `pdfBytes` state. Both pdfjs (render) and pdf-lib (save) consume the same buffer.
- **Render**: each page → `<canvas>` at 2× scale via `pdfjsLib.getDocument(...).getPage(i).render(...)`. The canvas `dataUrl` is cached on `pages[i]` and re-blitted via `redrawPage(canvas, dataUrl, edits)` whenever edits change.
- **Text extraction**: `page.getTextContent()` → words → `clusterWordsIntoLineClusters` → `mergeLineClustersIntoParagraphs` → array of `textBlock`s with `{x, y, baselineY, width, height, fontSize, fontFamily, isBold, isItalic, edited, text, lineBaselines}`.
- **Editing existing text**: click a textBlock → `EditPopup` opens (transparent bg, lifted z) → on Tab/click-outside, `commitEdit` mutates the block (`edited: true`, new text). The canvas redraws with a white rect + new text. While the popup is open, the active block is white-out blanked on the canvas so the original text doesn't bleed through the transparent popup.
- **Floating overlays**: `floatingBoxes` (text) and `floatingImages` (images) are absolutely-positioned React divs. Each gets a unique `id` and creation-order `z = 50 + counter` so newer overlays render above older ones. EditPopup-active wrapper z is 3000 to lift above floating images.
- **Save**: `handleDownload` reloads `pdfBytes` via `pdf-lib` → registers fontkit → `loadNotoFontBytes()` (cached) fetches the 7 woff2 from `/fonts/` and caches the buffers → embeds each with `{ subset: true }` → for each edited block draws white rect + `pdfPage.drawText` → for each floating image, `embedJpg`/`embedPng` + `drawImage` → `doc.save()` → `Blob` → object URL → `<a download>` click. **No bytes leave the browser.**
- **Canvas fallback** (`handleDownloadCanvasFallback`): rasterizes pages as PNG and emits image-only PDF. Triggered when (a) pdf-lib can't parse the source for a non-encryption reason, (b) `pdfBytes` page count < state page count (Stage 1 merge guard), or (c) any page has non-zero rotation (Stage 2 guard).
- **Multi-tab**: `tabsList` + `tabSnapshots` (in a ref) preserve full state per open PDF; switch via `restoreSnapshot`.
- **Undo**: `history` array, max 30 entries; deep-clones via `JSON.parse(JSON.stringify(...))`.
- **Encryption**: strict `PDFDocument.load` probe at open time → if it throws an encryption error, set `isEncrypted = true` and show a parchment banner. `handleDownload` then falls back to `ignoreEncryption: true` only after the banner.

### Folder structure
```
src/
  App.jsx              ~1900 lines — homepage + editor + EditPopup + FloatingBox/Image + helpers
  main.jsx             React entry (StrictMode)
  App.css, index.css   global resets only; most styling inline
public/
  logo.png             800×800, ~60 KB (header + og:image)
  favicon.svg
  fonts/               7 Noto woff2 (latin-ext, ~407 KB)
  robots.txt, sitemap.xml
tests/
  export-smoke.mjs     9 smoke tests; runs via `node tests/export-smoke.mjs`
  ../local-test-pdfs/  optional fixture dir, gitignored
phases/                15 per-phase markdown files (one prompt each)
ROADMAP.md             Status table + rules + index → phases/
QA_CHECKLIST.md        manual test plan
HANDOVER.md            this file
.github/workflows/ci.yml
index.html             SEO meta + Google Fonts preconnect (only outbound network at runtime)
```

### Key state slots in App (read these first when picking up)
`pdfBytes`, `pages`, `textBlocks`, `floatingBoxes`, `floatingImages`, `history`, `tabsList`, `tabSnapshots` (ref), `activeTabId`, `isEncrypted`, `hasTextLayer`, plus `dragging`/`resizingImg`/`resizingFb` transient drag state.

## Roadmap

**Done (commits on `main`):**
1. ✅ Production cleanup (AdSlot removed, real README, lint −5)
2. ✅ "Merge PDF" toolbar button
3. ✅ Encrypted PDF policy (banner + strict-first load)
4. ✅ fontkit + 7 Noto fonts shipped to `public/fonts/`
5. ✅ Wire fontkit + Noto fonts in `handleDownload`, drop `sanitiseForStdFont`, Unicode round-trip smoke test (`café résumé piñata`)

**Pending:**
- 6: ⏳ **Reorder pages** (drag handle on page header → `pageOrder[]` → `copyPages`)
- 7: Delete + rotate pages (drops the Stage 2 raster fallback)
- 8: Image to PDF (drop JPG/PNG on homepage → 1-page editable PDF)
- 9: Signature pad (modal canvas → transparent PNG → floatingImage)
- 10: Text highlighting (block-level, 4 color presets, low-alpha rectangle behind text)
- 11: Per-page fallback + IndexedDB recovery (50 MB cap, 24 h freshness)
- 12: Original text color (walk operator list for `setFillRGBColor`)
- 13: SEO basics + per-tool hash routes (`#merge`, `#sign`, etc.)
- 14: **Mobile-friendly pass** (whole site — see Issues)
- 15: Pre-launch QA + ship

**Optional post-launch:** real text replacement (phantom-text fix, feature-flagged), split PDF, range-level highlighting.

**Explicitly skipped:** compress PDF, OCR (Tesseract.js too heavy), accounts/cloud sync.

## Current issues / quirks

| Issue | Impact | Notes |
|---|---|---|
| **Phantom original text** | search/copy in saved PDF returns pre-edit text | Documented; Phase 16 fixes via real text replacement behind feature flag |
| **Edited text hides behind floating images** | post-save, the new canvas-drawn text is below z 50+ images | EditPopup itself is lifted (z 3000) during edit; only the saved result is affected. Real fix: render edits as overlays not canvas |
| **Mobile editor unusable** | toolbar wraps to 3 rows + tab strip's hardcoded `top: 52` overlaps wrapped buttons | Phase 14 — full mobile pass; also covers per-page `+ Add` controls and EditPopup/FloatingBox off-screen positioning |
| **Lint baseline ~4 errors** | not blocking | Pre-existing — `Date.now`/`Math.random` purity (not in render context) + 2 empty catch blocks with comments. CI is `continue-on-error: true` for lint |
| **Encrypted PDFs save unencrypted** | banner warns user | `loadPdfFromBytes` strict-probes; `handleDownload` falls back to `ignoreEncryption: true` only after the banner |
| **Multi-machine drift** | `main` can be ahead of local | ROADMAP rule: `git fetch && git status` at session start, pull before edits |
| **woff2 + fontkit in Node** | smoke tests can't `fetch('/fonts/...')` | Use `fs.readFile` and pass the Buffer directly to `embedFont(bytes, {subset:true})` — the Phase 5 step C test does this |

## Resume instructions

1. `git clone https://github.com/salvatorecuomo96-bot/katanapdf && cd katanapdf && npm ci`
2. `npm run dev` (Vite) — open http://localhost:5173. `npm run build` + `npm run test:export` before any commit; CI enforces both.
3. Read `ROADMAP.md` Status table → pick first phase not `✅ Done` → open `phases/NN-*.md` → execute the prompt block inside.
4. One phase per session. Commit + push after each phase. Update Status table in same commit.
5. If anything blocks mid-phase: commit partial, mark phase 🟡 In progress, exit. Pinned bugs (if any) live in a `## Pinned bugs` section of ROADMAP.md and are fixed before the next phase.
