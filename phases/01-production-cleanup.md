# Phase 1 — Production cleanup leftovers ✅ Done 2026-05-08

**Goal:** finish the cleanup ChatGPT's Prompt 1 didn't.
**Effort:** ~15 min
**Done when:** build clean, no `AdSlot` in code, real README, no Vite template files, lint count down.

> Finish the production cleanup. Do these things only:
> 1. Remove `AdSlot` component, all its usages, and the AdSense `<script>` if present in `index.html`. We're not running ads.
> 2. Replace the default Vite README.md with a real one for katanapdf (one paragraph what it is, install/dev/build/test commands, link to QA_CHECKLIST.md).
> 3. Delete `src/assets/react.svg` and `public/vite.svg` if they exist and aren't referenced.
> 4. Reduce lint baseline: remove unused `KatanaLogo` and `KatanaLogoSVG` helpers, the unused `_pageNum` arg, and unused `zoom` prop — only the ones safe to delete. Don't touch the `Date.now`/`Math.random` ones (those are fine in non-render context).
> Build, lint, commit, push.

**Outcome:** AdSlot + AdSense markers + Logo helpers + unused args removed; real README written; template assets deleted; lint 21 → 16 (the 5 ROADMAP-targeted errors gone, the rest deferred to later phases).
