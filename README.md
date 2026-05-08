# katanapdf

A free PDF editor that runs entirely in your browser. Edit text, add text and images, merge PDFs, and download — without ever uploading your file. No account, no server, no watermark.

Live: [katanapdf.com](https://katanapdf.com/) · Built with React + Vite + [pdfjs-dist](https://mozilla.github.io/pdf.js/) + [pdf-lib](https://pdf-lib.js.org/).

## Develop

Requires Node 20+.

```bash
npm ci             # install
npm run dev        # vite dev server
npm run build      # production build → dist/
npm run lint       # eslint
npm run test:export  # PDF export smoke tests (must stay green)
npm run preview    # serve the built dist/ locally
```

## Project layout

```
src/App.jsx        single-file React app (homepage + editor)
src/main.jsx       React entry point
public/            static assets served as-is
tests/export-smoke.mjs   PDF round-trip smoke tests
ROADMAP.md         12-phase plan, one phase per session
QA_CHECKLIST.md    manual QA checklist + sample-PDF list
```

## Privacy

Your PDF never leaves your browser. The only outbound network request the page makes at runtime is to Google Fonts (CSS + font files for `Cinzel` and `Lora`); no PDF data is ever sent anywhere.

## Contributing

See [QA_CHECKLIST.md](QA_CHECKLIST.md) for the manual test plan and [ROADMAP.md](ROADMAP.md) for what's planned next.
