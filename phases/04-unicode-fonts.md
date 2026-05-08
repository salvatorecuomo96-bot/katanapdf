# Phase 4 — Unicode fonts (audit Stage 4)

**Goal:** stop turning `é` into `?` on edit. Single biggest correctness fix not in the ChatGPT plan.
**Effort:** ~30–45 min — biggest phase, plan the day around it. Use `@fontsource/*` npm packages so font acquisition isn't a multi-step manual download. Commit in 3 atomic steps so any interruption leaves a green tree.

> Add Unicode font support to PDF export.
>
> **Step A (commit):** install deps + ship fonts.
> 1. `npm install @pdf-lib/fontkit @fontsource/noto-sans @fontsource/noto-serif @fontsource/noto-sans-mono`.
> 2. Copy the 7 weight/style files we need from `node_modules/@fontsource/*` into `public/fonts/`: Noto Sans Regular/Bold/Italic/BoldItalic, Noto Serif Regular/Bold, Noto Sans Mono Regular. Prefer the `latin-ext` subsets to keep size down.
>
> **Step B (commit):** wire fontkit + drop the WinAnsi shim.
> 3. In `handleDownload`, register fontkit (`doc.registerFontkit(fontkit)`) and embed the Noto fonts via `await doc.embedFont(await (await fetch('/fonts/...')).arrayBuffer(), { subset: true })` instead of `StandardFonts`.
> 4. Update `pickPdfLibFont` to map Arial→Noto Sans, Times→Noto Serif, Courier→Noto Sans Mono.
> 5. Delete `sanitiseForStdFont` and its calls — Noto handles full Unicode.
>
> **Step C (commit):** add the regression guard.
> 6. Add a smoke test that round-trips text containing `café résumé piñata` through pdf-lib with embedded Noto Sans (load font from `public/fonts/` via fs in the test) and asserts the bytes contain those exact code points after parse-back.

