# Phase 6 — Delete + rotate pages

**Goal:** the other two page-management tools. Lets us drop the Stage 2 rotation raster fallback.
**Effort:** ~30 min
**Done when:** delete and rotate both work; rotated pages export at vector quality (no canvas fallback).

> Implement delete-page and rotate-page.
> 1. ✕ button on page header → remove from `pages`, `textBlocks`, `floatingBoxes`, `floatingImages`, and rebuild `pdfBytes` minus that index.
> 2. ↻ button → track per-page rotation delta (0/90/180/270) in state. On download, set the page's rotation via `pdfPage.setRotation(degrees(...))` and translate overlay coords accordingly so they land in the right place visually.
> 3. Remove the Stage 2 "rotated → canvas fallback" guard now that we handle rotation properly.
> 4. Update homepage list. Add smoke tests for both.
