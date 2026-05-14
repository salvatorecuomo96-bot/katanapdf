# Phase 11 — Per-page fallback + IndexedDB recovery (audit Stage 3)

**Goal:** stop one corrupt page from wiping vector quality on the whole document.
**Effort:** ~30 min
**Done when:** if pdf-lib fails on page 5 of 10, only page 5 rasterizes; the other 9 keep vectors.

> Refactor `handleDownload` so that pdf-lib failures fall back per-page instead of per-document. Wrap each page's overlay step in try/catch; on failure, raster *that page only* (use the canvas fallback's per-page logic) and continue. Also: before each download, write the current `pdfBytes` to IndexedDB under key "katanapdf:lastInput" with a 50 MB cap. On the next page load, if such a snapshot exists and is newer than 24 hours, show a small "Recover last PDF" link in the editor header.
