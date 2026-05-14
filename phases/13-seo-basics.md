# Phase 13 — SEO basics + per-tool routes

**Goal:** Google can find this. Don't build pages for tools that don't ship.
**Effort:** ~15 min (static SEO already done — only routes + dynamic titles remain)
**Done when:** unique title + description on every route, sitemap.xml + robots.txt exist, only shipped tools have URLs.

## Already done (as of 2026-05-15)
- `index.html`: title, meta description, keywords, og:title/description/image, Twitter card, canonical URL, robots meta, viewport meta ✅
- `public/sitemap.xml`: exists (has `/`, `#about`, `#privacy`, `#terms`) ✅
- `public/robots.txt`: exists ✅

## Still to do
> Add hash routes for shipped tools — `#merge`, `#reorder`, `#sign`, `#image-to-pdf`, `#draw`, `#shapes`. Each route renders the homepage but sets a unique `document.title` and meta-description via a `useEffect` in `PDFEditor.jsx` (which already reads `window.location.hash` on mount). Add those tool URLs to `sitemap.xml`. Skip routes for unshipped tools.
