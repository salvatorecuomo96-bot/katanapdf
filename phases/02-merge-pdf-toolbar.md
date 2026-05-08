# Phase 2 — Add "Merge PDF" to top toolbar ✅ Done 2026-05-08

**Goal:** stop users (including me) from getting lost between three different "add a PDF" entry points.
**Effort:** ~10 min
**Done when:** there's a `Merge PDF` button next to `Open` in the editor toolbar that appends to the current document.

> Add a `Merge PDF` button to the top editor toolbar in App.jsx, next to the existing `Open` button. Wire it to `handleAddPdfAsImage` (same as the per-page button) so it appends pages to the current tab. Style it the same as the existing `Open` button (`tbBtn`). Add a tooltip clarifying "appends pages into the current document".

**Outcome:** New "Merge PDF" `<label>` wired to `handleAddPdfAsImage` lives between Open and Undo in the editor toolbar; styled with `tbBtn`; tooltip on hover. Existing per-page "+ Add PDF" button left in place for in-context use.
