# Phase 5 — Reorder pages

**Goal:** first real "page management" tool. People will pay for this. We won't, but we'll ship it.
**Effort:** ~30 min
**Done when:** drag a page to a new position; downloaded PDF has new order.

> Implement page reordering. Add a drag handle to each page header (next to "Page N"). Reorder via HTML5 drag-and-drop or a simple up/down arrow control — whichever is faster to ship correctly. State: track a `pageOrder` array (indices into the original `pages[]` and `pdfBytes`). On download, build the output via `copyPages(srcDoc, pageOrder)` rather than the natural index. Update the homepage "What you can do" list to add "Reorder pages". Add a smoke test that a 3-page PDF reordered to [2, 0, 1] keeps all 3 pages and the order survives reload.
