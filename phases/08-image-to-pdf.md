# Phase 7 — Image to PDF

**Goal:** common search query, easy to ship.
**Effort:** ~20 min
**Done when:** dropping a JPG/PNG on the homepage opens a 1-page editable PDF.

> Add image-to-PDF: when a user drops an image (JPG/PNG/WebP) instead of a PDF on the homepage, create a new PDF via `PDFDocument.create()` + `embedJpg`/`embedPng` + `addPage`, sized to the image's natural dimensions, and open it as a tab. Update the homepage `What you can do` list to add "Image to PDF".
