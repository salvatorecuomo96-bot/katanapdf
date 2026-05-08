# Phase 5 — Wire Noto fonts in handleDownload + Unicode smoke test (Step B+C)

**Goal:** stop turning `é` into `?` on edit. The single biggest correctness fix.
**Effort:** ~30 min
**Done when:** editing "café résumé piñata" through the editor produces a downloaded PDF that contains those exact code points.

> Prereq: Phase 4 done (fontkit installed, fonts in `public/fonts/`).
>
> Commit in 2 steps so any interruption lands on a green tree.
>
> **Step B (commit):** wire fontkit + drop the WinAnsi shim.
> 1. In `handleDownload`, register fontkit (`doc.registerFontkit(fontkit)`) and embed the Noto fonts via `await doc.embedFont(await (await fetch('/fonts/noto-sans-...')).arrayBuffer(), { subset: true })` instead of `StandardFonts.*`.
> 2. Update `pickPdfLibFont` to map Arial → Noto Sans, Times → Noto Serif, Courier → Noto Sans Mono. Keep the bold / italic / bold-italic key structure.
> 3. Delete `sanitiseForStdFont` and remove its call sites — Noto handles the full Unicode range we care about.
> 4. Apply the same in the canvas fallback (`handleDownloadCanvasFallback`) where applicable, or note it's a known limitation if it'd require restructuring.
>
> **Step C (commit):** the regression guard.
> 5. Add a smoke test that loads `public/fonts/noto-sans-regular.woff2` (or whichever path you used) via `fs.readFile`, builds a doc with `await doc.embedFont(bytes, { subset: true })`, draws "café résumé piñata", saves, parses back, and asserts the output bytes contain those exact code points (or that re-parsed text content equals the input).
