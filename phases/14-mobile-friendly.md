# Phase 12 — Mobile-friendly pass (whole site)

**Goal:** the site is unusable on phones today. Editor toolbar wraps to 3 rows and the tab strip's hardcoded `top: 52` overlaps the wrapped buttons; plus the rest of the site (per-page controls, in-place text editor, FloatingBox toolbar, modal popups, page width) hasn't been audited at 375–414 px. Fix everything that breaks.
**Effort:** ~45 min — bigger than a typical phase, plan the day around it.
**Done when:** at 375 px and 414 px viewports the homepage and the editor are both usable: no element overlap, no horizontal scroll on the homepage, all primary actions (Open, Merge, Undo, Zoom, Download, + Add text/image/PDF, edit existing text, drag floating boxes) reachable in one tap, font controls accessible (a "Format" dropdown is fine), and the `EditPopup` / `FloatingBox` toolbars don't run off the side of the page.

> Make the site mobile-friendly across the board. Don't ship a separate mobile/desktop component tree — same components, responsive styles only.
>
> 1. **Editor toolbar** (search `data-edit-toolbar` in App.jsx). Currently `flex-wrap: wrap` with hardcoded `height: 52`; tab strip uses `position: sticky; top: 52`. When buttons wrap, tab strip overlaps them.
>    - Replace hardcoded `height: 52` with `minHeight: 52`. Replace tab strip's `top: 52` with a ref-measured offset (read `toolbarRef.current.getBoundingClientRect().height` post-mount + on resize, stash in state, use as `top`).
>    - Below 720 px viewport, collapse: hide font-family + font-size selectors and Bold/Italic behind a single "Format" `<details>` dropdown; keep Open / Merge / Undo / +/- zoom / Download inline. Download can be an icon if needed to fit.
> 2. **Per-page controls** ("+ Add text", "+ Add image", "+ Add PDF" above each page). These overflow on narrow viewports — wrap them or collapse into a single "+ Add" menu.
> 3. **In-place text editor** (`EditPopup`) and **FloatingBox** toolbar. Both are absolutely positioned at the click point and can render off-screen on phones. Clamp `left`/`top` so the editor stays within the viewport, and shrink the FloatingBox top toolbar (size selector, B, I, color, font-family, ✕) so all its controls fit on a 375 px row — currently the family `<select>` overflows.
> 4. **Homepage**. Drop the heavy-padding hero (`padding: "24px 20px 28px"`) on narrow viewports; ensure the OPEN PDF button doesn't get cut off; verify card grids fall to one column gracefully (they should, but spot-check the new minmax 260/280 values from Phase 1's widening).
> 5. **Static pages** (privacy / terms / about). They're already narrow (`maxWidth: 720`), should be fine — confirm.
> 6. Add a `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` to `index.html` if not already there. (Spot check: it is, but verify scale handling.)
> 7. Manual QA: screenshot homepage + editor (with a 3-page PDF open, one floating box selected) at 375 × 812 and 414 × 896 in Chrome devtools. No overlap, no horizontal scroll, all actions tappable. Capture before/after.
