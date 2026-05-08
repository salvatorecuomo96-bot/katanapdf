# Phase 11 — SEO basics + per-tool routes

**Goal:** Google can find this. Don't build pages for tools that don't ship.
**Effort:** ~30 min
**Done when:** unique title + description on every route, sitemap.xml + robots.txt exist, only shipped tools have URLs.

> Add SEO. In `index.html`: real title, meta description, og:title/description/image. Add `public/sitemap.xml` and `public/robots.txt`. Add hash routes for shipped tools only — `#merge`, `#reorder`, `#sign`, `#image-to-pdf` etc. Each route renders the homepage but with a unique `document.title` and meta-description set in a `useEffect`. Skip routes for tools that aren't yet shipped.
