# katanapdf roadmap (Salvatore-edition)

15 phases. Each is one Claude session. Phase prompts live in [`phases/`](phases/).

## Status

Update this table at the end of every session so any device can see where we are.

| Phase | Title | Status | Date | File |
|---|---|---|---|---|
| 1 | Production cleanup leftovers | ✅ Done | 2026-05-08 | [01](phases/01-production-cleanup.md) |
| 2 | Add "Merge PDF" to top toolbar | ✅ Done | 2026-05-08 | [02](phases/02-merge-pdf-toolbar.md) |
| 3 | Encrypted PDF policy | ✅ Done | 2026-05-08 | [03](phases/03-encrypted-pdf-policy.md) |
| 4 | Install fontkit + ship Noto fonts | ✅ Done | 2026-05-08 | [04](phases/04-noto-fonts-install.md) |
| 5 | Wire Noto fonts + Unicode smoke test | ✅ Done | 2026-05-08 | [05](phases/05-unicode-fonts-wire.md) |
| 6 | Reorder pages | ✅ Done | 2026-05-08 | [06](phases/06-reorder-pages.md) |
| 7 | Delete + rotate pages | ✅ Done | 2026-05-09 | [07](phases/07-delete-rotate-pages.md) |
| 8 | Image to PDF | ✅ Done | 2026-05-09 | [08](phases/08-image-to-pdf.md) |
| 9 | Signature pad | ✅ Done | 2026-05-10 | [09](phases/09-signature-pad.md) |
| 10 | Text highlighting | ⏳ Next | — | [10](phases/10-text-highlighting.md) |
| 11 | Per-page fallback + IndexedDB recovery | Pending | — | [11](phases/11-per-page-fallback.md) |
| 12 | Original text color | Pending | — | [12](phases/12-original-text-color.md) |
| 13 | SEO basics + per-tool routes | Pending | — | [13](phases/13-seo-basics.md) |
| 14 | Mobile-friendly pass (whole site) | Pending | — | [14](phases/14-mobile-friendly.md) |
| 15 | Pre-launch QA + ship | Pending | — | [15](phases/15-prelaunch-qa.md) |

Pre-roadmap groundwork (already shipped):
- Stage 0 — `tests/export-smoke.mjs` + `npm run test:export` ✅
- Stage 1 — `+ Add PDF` silent merge bug fix ✅
- Stage 2 — rotated pages → canvas fallback (rotation guard) ✅
- Homepage redesign + logo iterations ✅
- Wordmark-in-toolbar returns to homepage ✅ (small fix between phases 3 and 4)
- GitHub Actions CI (lint informational, build + test required) ✅

Post-roadmap UX sessions (shipped 2026-05-14):
- Responsive layout: auto-zoom on load, collapsible sidebar (mobile overlay, desktop shrink), mobile icon-only page buttons via CSS media queries ✅
- Draw mode: freehand brush with colour + width controls; deactivates automatically when another tool is selected ✅
- Shapes: circle/square with fill/outline toggle and colour picker ✅
- Multi-tab: EditorHeader tab bar (dark INK background, gold underline on active tab) ✅
- EditorNotices: centered card with shadow instead of full-width flush banner ✅
- Per-page zoom controls: − % + grouped control replacing toolbar zoom, caps auto-zoom at 90% ✅
- MOVE TO: custom popup replacing native `<select>` ✅
- Draggable text boxes: unselected state shows grab cursor, drag moves, click enters edit ✅
- Text box drag fixed: removed unwanted mode-switch during drag; drag grip added to editing toolbar ✅
- All toolbars (FloatingBox, EditPopup) redesigned to LACQUER crimson style matching FloatingShape ✅
- Removed Tab/Esc hint text from all toolbars and modals ✅
- Sidebar height fixed: uses flex stretch instead of calc(100vh - N) hack ✅
- Empty text boxes auto-deleted when clicking outside ✅

## Rules
- **At session start**, run `git fetch && git status`. If behind `origin/main`, pull before any edits. The laptop pushes from a different machine, so the worktree is often stale at session start — discover that on turn 1, not turn 5.
- **When picking the next phase**, read only this `ROADMAP.md` (status table + rules) and the one phase file you're about to execute. Don't read all 15 phase files.
- One phase per Claude session. Don't bundle.
- **At the end of every task**, provide a summary of changes and a clear testing checklist **in the chat** for the user to manually verify.
- After each phase: `npm run lint && npm run build && npm run test:export`. If green, commit + push.
- After each phase: also update the **Status** table above so progress is visible from any device.
- If a phase blocks (limit hit, weird behaviour), stop and resume next day. Don't fight it.
- Don't run more than one phase per day on Pro until you have real users.

## Optional / post-launch
- **Phase 16 — Real text replacement (audit Stage 7)**, behind `?redact=real` flag. Hard, risky, save for after you have feedback.
- **Phase 17 — Split PDF** (extract page range as new PDF). Easy, but page-tools cover most of the same need.
- **Phase 18 — Range-level text highlighting** (drag-select within a paragraph, not just block). Requires character-coord access; only worth it if users ask.

## Things explicitly skipped
- **Compress PDF.** No clean browser-only path that actually compresses. Promising it would lie.
- **OCR.** Real OCR is heavy (Tesseract.js is 10MB+); not for v1.
- **Accounts / cloud sync.** Defeats the privacy angle.
- **Real text replacement before launch.** Phantom-text is a known limitation; document it in the FAQ, fix later.

## How to use this on Pro
- Start of session: just say "continue" or "next phase". Claude does the session-start `git fetch && git status` (per Rules), reads this table, picks the first phase whose status is not `✅ Done`, opens its file in `phases/`, and runs the prompt block inside.
- Claude does build/lint/test, commits + pushes, and updates the **Status** table.
- If a session hits the limit mid-phase: stop, commit what's done, mark the phase as `🟡 In progress` in the table, resume next day from the same phase.
- Don't ask Claude to "do phases 5 through 8" in one go. That's a Max-plan request.
