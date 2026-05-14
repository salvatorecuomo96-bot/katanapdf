# Phase 14 — Mobile-friendly pass (whole site)

**Goal:** editor and homepage usable on phones at 375–414 px. Most major items already shipped in post-roadmap sessions — this phase completes the remaining gaps.
**Effort:** ~20 min (most work already done)
**Done when:** at 375 px and 414 px viewports — no element overlap, no horizontal scroll on the homepage, EditPopup/FloatingBox toolbars don't run off-screen.

## Already done (as of 2026-05-15)
- viewport meta in `index.html` ✅
- Auto-zoom on load (caps at 90%) ✅
- Collapsible sidebar: mobile overlay, desktop shrink ✅
- Mobile icon-only page buttons via CSS media queries ✅
- Editor toolbar `flexWrap: nowrap` (toolbar no longer splits) ✅

## Still to do
> Make the site mobile-friendly across the board. Don't ship a separate mobile/desktop component tree — same components, responsive styles only.
>
> 1. **Editor toolbar** — already `nowrap`. Change `height: 52` to `minHeight: 52` so it can grow if needed. Update tab strip's `top: 52` to a ref-measured offset (read toolbar height post-mount + on resize).
>    - Below 720 px viewport, collapse font-family + font-size + Bold/Italic behind a single "Format" `<details>` dropdown; keep Open / Merge / Undo / zoom / Download inline.
> 2. **Per-page controls** ("+ Add text", "+ Add image", "+ Add PDF"). These overflow on narrow viewports — wrap them or collapse into a single "+ Add" menu.
> 3. **`EditPopup` and `FloatingBox` toolbar clamping.** Both are absolutely positioned at the click point and can render off-screen on phones. Clamp `left`/`top` so they stay within the viewport. Shrink FloatingBox toolbar so all controls fit on a 375 px row.
> 4. **Homepage**. Verify hero padding and OPEN PDF button on narrow viewports; card grids should fall to one column (spot-check).
> 5. **Static pages** (privacy / terms / about). Already narrow (`maxWidth: 720`) — confirm.
> 6. Update `viewport` meta to add `viewport-fit=cover`: `width=device-width, initial-scale=1, viewport-fit=cover`.
> 7. Manual QA at 375 × 812 and 414 × 896 in Chrome devtools.
