# Phase 8 — Signature pad

**Goal:** ship the missing "Sign PDF" feature properly.
**Effort:** ~30 min
**Done when:** click a Sign button → draw signature → place it as an image overlay on the current page.

> Add a signature pad. New "Sign" button on the per-page toolbar (next to "+ Add image"). Opens a modal with an HTML canvas the user can draw on (mousedown/mousemove/mouseup, with touch events for mobile). Buttons: Clear, Cancel, Place. On Place, export the canvas as transparent PNG and add it to `floatingImages` on the current page so it can be dragged/resized like any other image. Update the homepage `What you can do` list to add "Sign PDF".
