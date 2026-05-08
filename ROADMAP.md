# katanapdf roadmap (Salvatore-edition)

12 phases. Each is one Claude session.

## Rules
- One phase per Claude session. Don't bundle.
- After each phase: `npm run lint && npm run build && npm run test:export`. If green, commit + push.
- If a phase blocks (limit hit, weird behaviour), stop and resume next day. Don't fight it.
- Don't run more than one phase per day on Pro until you have real users.

---

## Phase 1 — Production cleanup leftovers
**Goal:** finish the cleanup ChatGPT's Prompt 1 didn't.
**Effort:** ~15 min
**Done when:** build clean, no `AdSlot` in code, real README, no Vite template files, lint count down.

> Finish the production cleanup. Do these things only:
> 1. Remove `AdSlot` component, all its usages, and the AdSense `<script>` if present in `index.html`. We're not running ads.
> 2. Replace the default Vite README.md with a real one for katanapdf (one paragraph what it is, install/dev/build/test commands, link to QA_CHECKLIST.md).
> 3. Delete `src/assets/react.svg` and `public/vite.svg` if they exist and aren't referenced.
> 4. Reduce lint baseline: remove unused `KatanaLogo` and `KatanaLogoSVG` helpers, the unused `_pageNum` arg, and unused `zoom` prop — only the ones safe to delete. Don't touch the `Date.now`/`Math.random` ones (those are fine in non-render context).
> Build, lint, commit, push.

---

## Phase 2 — Add "Merge PDF" to top toolbar
**Goal:** stop users (including me) from getting lost between three different "add a PDF" entry points.
**Effort:** ~10 min
**Done when:** there's a `Merge PDF` button next to `Open` in the editor toolbar that appends to the current document.

> Add a `Merge PDF` button to the top editor toolbar in App.jsx, next to the existing `Open` button. Wire it to `handleAddPdfAsImage` (same as the per-page button) so it appends pages to the current tab. Style it the same as the existing `Open` button (`tbBtn`). Add a tooltip clarifying "appends pages into the current document".

---

## Phase 3 — Encrypted PDF policy (audit Stage 6)
**Goal:** stop silently re-saving encrypted PDFs as unencrypted.
**Effort:** ~15 min
**Done when:** opening an encrypted PDF either decrypts (empty password) or shows a clear "this PDF is password-protected" message instead of half-broken output.

> In `loadPdfFromBytes`, detect encryption via pdf-lib's `PDFDocument.load(bytes, { ignoreEncryption: false })` first. If it throws an encryption error, retry with `ignoreEncryption: true` AND show a banner: "This PDF is password-protected. Decrypted contents may not save correctly. Decrypt it first, then re-open." In `handleDownload`, also remove the silent `ignoreEncryption: true` — replace it with the same upfront check. Add a smoke test: an encrypted synthetic PDF triggers the banner path.

---

## Phase 4 — Unicode fonts (audit Stage 4)
**Goal:** stop turning `é` into `?` on edit. Single biggest correctness fix not in the ChatGPT plan.
**Effort:** ~45 min — biggest phase, plan the day around it.
**Done when:** editing "café" outputs "café", not "caf?".

> Add Unicode font support to PDF export.
> 1. `npm install @pdf-lib/fontkit`.
> 2. Add subsetted Noto Sans Regular/Bold/Italic/BoldItalic + Noto Serif Regular/Bold + Noto Sans Mono to `public/fonts/`. Use Google Fonts → download → keep only the Latin-Extended + minimal-CJK subsets to stay under 500 KB total.
> 3. In `handleDownload`, register fontkit (`doc.registerFontkit(fontkit)`) and embed the Noto fonts via `fetch + doc.embedFont(bytes)` instead of `StandardFonts`.
> 4. Update `pickPdfLibFont` to map Arial→Noto Sans, Times→Noto Serif, Courier→Noto Sans Mono.
> 5. Delete `sanitiseForStdFont` and its calls — Noto handles full Unicode.
> 6. Add a smoke test: edit a synthetic PDF with text containing `café résumé piñata` and assert the round-trip preserves them.

---

## Phase 5 — Reorder pages
**Goal:** first real "page management" tool. People will pay for this. We won't, but we'll ship it.
**Effort:** ~30 min
**Done when:** drag a page to a new position; downloaded PDF has new order.

> Implement page reordering. Add a drag handle to each page header (next to "Page N"). Reorder via HTML5 drag-and-drop or a simple up/down arrow control — whichever is faster to ship correctly. State: track a `pageOrder` array (indices into the original `pages[]` and `pdfBytes`). On download, build the output via `copyPages(srcDoc, pageOrder)` rather than the natural index. Update the homepage "What you can do" list to add "Reorder pages". Add a smoke test that a 3-page PDF reordered to [2, 0, 1] keeps all 3 pages and the order survives reload.

---

## Phase 6 — Delete + rotate pages
**Goal:** the other two page-management tools. Lets us drop the Stage 2 rotation raster fallback.
**Effort:** ~30 min
**Done when:** delete and rotate both work; rotated pages export at vector quality (no canvas fallback).

> Implement delete-page and rotate-page.
> 1. ✕ button on page header → remove from `pages`, `textBlocks`, `floatingBoxes`, `floatingImages`, and rebuild `pdfBytes` minus that index.
> 2. ↻ button → track per-page rotation delta (0/90/180/270) in state. On download, set the page's rotation via `pdfPage.setRotation(degrees(...))` and translate overlay coords accordingly so they land in the right place visually.
> 3. Remove the Stage 2 "rotated → canvas fallback" guard now that we handle rotation properly.
> 4. Update homepage list. Add smoke tests for both.

---

## Phase 7 — Image to PDF
**Goal:** common search query, easy to ship.
**Effort:** ~20 min
**Done when:** dropping a JPG/PNG on the homepage opens a 1-page editable PDF.

> Add image-to-PDF: when a user drops an image (JPG/PNG/WebP) instead of a PDF on the homepage, create a new PDF via `PDFDocument.create()` + `embedJpg`/`embedPng` + `addPage`, sized to the image's natural dimensions, and open it as a tab. Update the homepage `What you can do` list to add "Image to PDF".

---

## Phase 8 — Signature pad
**Goal:** ship the missing "Sign PDF" feature properly.
**Effort:** ~30 min
**Done when:** click a Sign button → draw signature → place it as an image overlay on the current page.

> Add a signature pad. New "Sign" button on the per-page toolbar (next to "+ Add image"). Opens a modal with an HTML canvas the user can draw on (mousedown/mousemove/mouseup, with touch events for mobile). Buttons: Clear, Cancel, Place. On Place, export the canvas as transparent PNG and add it to `floatingImages` on the current page so it can be dragged/resized like any other image. Update the homepage `What you can do` list to add "Sign PDF".

---

## Phase 9 — Per-page fallback + IndexedDB recovery (audit Stage 3)
**Goal:** stop one corrupt page from wiping vector quality on the whole document.
**Effort:** ~30 min
**Done when:** if pdf-lib fails on page 5 of 10, only page 5 rasterizes; the other 9 keep vectors.

> Refactor `handleDownload` so that pdf-lib failures fall back per-page instead of per-document. Wrap each page's overlay step in try/catch; on failure, raster *that page only* (use the canvas fallback's per-page logic) and continue. Also: before each download, write the current `pdfBytes` to IndexedDB under key "katanapdf:lastInput" with a 50 MB cap. On the next page load, if such a snapshot exists and is newer than 24 hours, show a small "Recover last PDF" link in the editor header.

---

## Phase 10 — Original text color (audit Stage 5)
**Goal:** small honesty fix — editing red text shouldn't silently turn it black.
**Effort:** ~15 min
**Done when:** editing red text outputs red.

> When extracting text blocks in `loadPdfFromBytes`, also call `page.getOperatorList()` and walk it to find the most recent `setFillRGBColor` operator before each text-show operator. Store that color on the text block. In `handleDownload`, pass it as the `color` to `pdfPage.drawText` instead of the hard-coded black. If extraction fails for a block, default to black (current behavior).

---

## Phase 11 — SEO basics + per-tool routes
**Goal:** Google can find this. Don't build pages for tools that don't ship.
**Effort:** ~30 min
**Done when:** unique title + description on every route, sitemap.xml + robots.txt exist, only shipped tools have URLs.

> Add SEO. In `index.html`: real title, meta description, og:title/description/image. Add `public/sitemap.xml` and `public/robots.txt`. Add hash routes for shipped tools only — `#merge`, `#reorder`, `#sign`, `#image-to-pdf` etc. Each route renders the homepage but with a unique `document.title` and meta-description set in a `useEffect`. Skip routes for tools that aren't yet shipped.

---

## Phase 12 — Pre-launch QA + ship
**Goal:** ship.
**Effort:** ~30 min Claude work + ~1 hour your manual testing
**Done when:** QA_CHECKLIST passes on a real device.

> Final pre-launch pass. Run `npm run lint && npm run build && npm run test:export` and report. Walk through QA_CHECKLIST.md and tell me which items I should manually test on Chrome desktop, iOS Safari, and Android Chrome. Fix obvious bugs only — no new features. Verify: no AdSlot left, no Vite template README, homepage works on a 375px viewport, downloaded PDFs open in another viewer.

---

## Optional / post-launch
- **Phase 13 — Real text replacement (audit Stage 7)**, behind `?redact=real` flag. Hard, risky, save for after you have feedback.
- **Phase 14 — Split PDF** (extract page range as new PDF). Easy, but page-tools cover most of the same need.

## Things explicitly skipped
- **Compress PDF.** No clean browser-only path that actually compresses. Promising it would lie.
- **OCR.** Real OCR is heavy (Tesseract.js is 10MB+); not for v1.
- **Accounts / cloud sync.** Defeats the privacy angle.
- **Real text replacement before launch.** Phantom-text is a known limitation; document it in the FAQ, fix later.

---

## How to use this on Pro

- Start of session: paste **only the prompt block** of one phase.
- Claude does build/lint/test and commit + push.
- If a session hits the limit mid-phase: stop, commit what's done, resume next day from the same phase.
- Don't ask Claude to "do phases 5 through 8" in one go. That's a Max-plan request.
