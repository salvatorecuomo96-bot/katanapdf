# Phase 4 — Install fontkit + ship Noto fonts (Step A of Unicode work)

**Goal:** get `@pdf-lib/fontkit` and the Noto font files into the project so Phase 5 can wire them up. No behavior change yet — `sanitiseForStdFont` still strips non-Latin characters on save.
**Effort:** ~15 min, low risk
**Done when:** fontkit installed; 7 Noto woff2/ttf files in `public/fonts/`; `package-lock.json` reflects the new deps; `npm run lint && npm run build && npm run test:export` still green.

> Set up the font infrastructure for the Unicode fix without changing export behavior yet.
>
> 1. `npm install @pdf-lib/fontkit @fontsource/noto-sans @fontsource/noto-serif @fontsource/noto-sans-mono` (use the `latin-ext` subsets if @fontsource exposes them).
> 2. Find the actual font files inside `node_modules/@fontsource/noto-sans/files/` etc. and copy 7 weight/style variants into `public/fonts/`:
>    - Noto Sans: regular, bold, italic, bold-italic
>    - Noto Serif: regular, bold
>    - Noto Sans Mono: regular
>    Use the `latin-ext` subset if available, else `latin` — anything broader bloats the bundle. Total target: under 800 KB across all 7.
> 3. Run `npm run lint && npm run build && npm run test:export`. All must stay green (this phase changes no source code).
> 4. Commit + push. Update Status table.
>
> Phase 5 will wire these into `handleDownload` and delete `sanitiseForStdFont`.
