# katanapdf QA Checklist

Manual smoke test for every release. Goal: catch regressions before they ship.
Tick boxes in a copy of this file per run; do not commit the ticked copy.

---

## 0. Setup

```
npm install            # only the first time, or after package.json changes
npm run lint           # static checks
npm run build          # production build (must succeed)
npm run test:export    # export-pipeline smoke test (Stage 0; see below)
npm run dev            # local server, usually http://localhost:5173
```

Open the URL printed by `npm run dev`.

### Automated export smoke test

`npm run test:export` runs `tests/export-smoke.mjs`, a small Node script that
exercises the same `pdf-lib` primitives `handleDownload` uses (load,
drawRectangle, drawText, save) and asserts the output is a valid PDF with the
expected page count.

It also roundtrips every file in `local-test-pdfs/` through the same
overlay pipeline and confirms the page count doesn't drift. Drop more
fixtures into that folder to widen coverage; the folder is `.gitignore`d so
your private PDFs never ship.

Exit code 0 = all pass, 1 = at least one failure. Run it before manual QA
to catch obvious regressions in seconds.

Things this script intentionally does **not** cover yet (those land in later
stages):

- Text-content assertions on the exported PDF
- The React state -> export glue inside `App.jsx`
- Page rotation, encryption, and the `+ Add PDF` merge bug

### Sample PDFs

Put your test files in a folder called `local-test-pdfs/` at the repo root.
This folder is in `.gitignore` — its contents are never committed.

Collect manually (do **not** use private documents you don't want to risk
losing):

- **simple-1page.pdf** — one page of plain text
- **multipage-text.pdf** — 5–20 pages, real text layer
- **scanned.pdf** — image-only / scanned PDF, no text layer
- **with-images.pdf** — pages that mix text and embedded images
- **invoice.pdf** — receipt / invoice layout (tables, columns, mixed fonts)
- **large.pdf** — 50+ pages or 20+ MB
- **weird name (with spaces &).pdf** — filename with spaces and special chars
- **legacy.pdf** — old or complex PDF (PDF 1.3, scanned-then-OCR'd, etc.)
- **forms.pdf** — PDF with fillable form fields or hyperlinks (optional, may
  not render perfectly — that's fine, we just want it to not crash)

---

## 1. Homepage checks

- [ ] Page loads without console errors (DevTools → Console).
- [ ] Logo is visible and not absurdly tall (no big empty space above/below).
- [ ] H1 reads "Free PDF editor that runs in your browser".
- [ ] Subhead reads "Edit PDFs without uploading files. No account, no
      watermark, no artificial limits."
- [ ] All four trust badges visible: 100% Free, No Upload, No Sign-Up, No
      Watermark.
- [ ] **Open PDF** button is large and obvious, in burgundy/lacquer.
- [ ] **Create a blank PDF** link sits below the main button.
- [ ] Drag/drop hint text is visible.
- [ ] Privacy line ("Your PDF never leaves your device…") is visible.
- [ ] "What you can do" lists exactly: Edit supported text, Add text, Add
      images, Merge PDFs.
- [ ] "Your files stay private" block lists the four bullets.
- [ ] "How to edit a PDF online" shows 4 numbered steps.
- [ ] "Why katanapdf" shows 6 dark cards.
- [ ] FAQ section title is centered between the gold rules (not visibly
      shifted left/right).
- [ ] FAQ details expand and collapse on click.
- [ ] Footer About / Privacy / Terms links work and the back-to-editor link
      returns home.

## 2. Mobile checks

Use the iPhone or Android Chrome viewport in DevTools, or a real phone.

- [ ] At ~375px wide, hero (badges + H1 + subhead + Open PDF) fits in roughly
      one screenful — no need to scroll past the fold to find the button.
- [ ] Open PDF button is comfortably tappable (≥ 44px tall).
- [ ] No horizontal scroll bar appears anywhere on the homepage.
- [ ] Logo never overflows or stretches.
- [ ] Trust badges wrap onto multiple lines without breaking layout.
- [ ] Tapping Open PDF shows the native file picker.

## 3. Open PDF checks

For each sample PDF in `local-test-pdfs/`:

- [ ] File opens within ~10 s on a normal laptop.
- [ ] All pages render — none are blank or cut off.
- [ ] If the PDF has no text layer (scanned), the dismissable yellow notice
      appears and explains you can still add text/images.
- [ ] Filename appears in the tab strip (without the `.pdf` extension).
- [ ] Closing all tabs returns to the homepage.
- [ ] Opening a second PDF creates a new tab; switching tabs preserves edits
      per tab.
- [ ] Re-picking the same file (after closing) opens it again.
- [ ] No console errors during open.

## 4. Add text checks

- [ ] **+ Add text** button on each page inserts a new editable text box.
- [ ] Typing into the box updates the text live.
- [ ] Text box can be dragged.
- [ ] Tab or Esc deselects the box.
- [ ] Re-selecting the box reopens the editing UI.
- [ ] Bold / Italic / font / size buttons in the top toolbar affect the
      selected box.
- [ ] Deleting the box (✕) removes it.
- [ ] Undo (↩) reverses the most recent add/edit/delete.

## 5. Edit supported text checks

Use a PDF that **has** a text layer (e.g. `simple-1page.pdf`,
`multipage-text.pdf`).

- [ ] Clicking on existing text opens the in-place editor at the right place.
- [ ] Edited paragraph replaces the original text on screen (white box +
      new text drawn on top of the rasterized page).
- [ ] Pressing Tab or clicking outside commits the edit.
- [ ] Editing the same block twice keeps the latest version.
- [ ] Multi-line paragraphs preserve line breaks after edit.
- [ ] On a PDF without a text layer (`scanned.pdf`), clicking text does
      nothing destructive (no crash; the no-text-layer banner is shown).

## 6. Add image checks

- [ ] **+ Add image** picks an image (PNG / JPG) and drops it onto the page.
- [ ] Image can be dragged.
- [ ] Resize handle on the image works in both axes.
- [ ] Delete (✕) removes the image.
- [ ] Image survives Tab / Esc deselect.
- [ ] Image survives switching tabs (if multiple PDFs open).
- [ ] **+ Add PDF** appends pages from a second PDF onto the current
      document; new pages appear at the bottom, numbered correctly.

## 7. Signature / draw checks

**Not implemented.** katanapdf currently has no signature pad or freehand
drawing tool. Workaround: users can take a photo of a signature and use
**+ Add image** to drop it on a page.

If a signature feature is added in the future, fill in:

- [ ] Signature pad opens.
- [ ] Drawing produces a smooth stroke.
- [ ] Saved signature can be placed and resized like an image.

## 8. Reorder / delete / rotate page checks

**Not implemented.** No page-level reorder, delete, or rotate UI today.

If those features are added in the future, fill in:

- [ ] Drag-to-reorder updates the page list and the downloaded PDF.
- [ ] Delete page removes the page and renumbers the rest.
- [ ] Rotate page rotates only the selected page; downloaded PDF reflects
      the rotation.

## 9. Download / export checks

For each tested PDF:

- [ ] **Download PDF** in the top toolbar produces a file with the same name
      (or `<name>-edited.pdf`).
- [ ] The downloaded file opens in another viewer (Acrobat, Edge, Preview)
      without errors.
- [ ] Edited text is selectable / copyable in the downloaded file (real text,
      not just rasterized pixels).
- [ ] Added text and images appear at the same position they had on screen.
- [ ] Appended pages from "+ Add PDF" appear after the original pages.
- [ ] No watermark anywhere in the output.
- [ ] File size is reasonable (not 10× the input for a one-line edit).

## 10. Privacy / no-upload claim checks

These verify the marketing copy is actually true.

- [ ] DevTools → Network → record a full session: open PDF, edit, download.
- [ ] **No request** sends the PDF bytes to any server. Filter by `Method =
      POST` and check no PDF payload leaves the browser.
- [ ] Allowed network traffic: `localhost:5173/...` (dev), the deployed
      origin, font CDNs, and ad-related requests. Nothing PDF-shaped.
- [ ] Unplug the network (airplane mode / DevTools → Offline) and confirm
      open + edit + download still work end-to-end after the page is loaded.
- [ ] No prompt asks for an email, account, or sign-in.
- [ ] No prompt for payment, "upgrade", or "remove watermark".

## 11. Browser checks

Run the **shortest** smoke (homepage loads, Open PDF works, edit one block,
download, downloaded file opens) on every browser you care about.

- [ ] Chrome (latest) — desktop
- [ ] Edge or Brave (latest) — desktop, both are Chromium so behaviour
      should match Chrome closely
- [ ] Firefox (latest) — desktop
- [ ] Android Chrome — real device or DevTools emulation
- [ ] iPhone Safari — real device only (emulation does not catch iOS-specific
      file-picker bugs)

Watch for:

- File picker actually opens on iOS.
- pdfjs renders correctly on Safari ≤ 16 (we ship the legacy build for this).
- No font fallback weirdness on Android.

---

## Pass / fail criteria (use this as the bar)

A run is **PASS** only if all of the following are true:

- App loads in every targeted browser without console errors.
- Each sample PDF opens.
- Edits (text / add text / add image) appear on screen as expected.
- Download produces a valid PDF that opens elsewhere.
- The downloaded PDF reflects the edits and has no watermark.
- No file leaves the browser during open / edit / download (Network tab is
  clean of PDF uploads).
- No crash on mobile (no white screen, no frozen tap).

Any **fail** above blocks release. Any other observation goes into a "Known
issues" note in the PR.

---

## Commands cheat sheet

Before testing:

```
npm install            # if dependencies changed
npm run lint           # surface obvious mistakes early
npm run build          # ensure production build still works
npm run dev            # start the local server
```

After testing:

```
git status             # confirm no accidental commits of test PDFs
ls local-test-pdfs/    # confirm sample folder is still ignored
git check-ignore -v local-test-pdfs/anything.pdf   # should print the rule
```

If a test PDF accidentally appears in `git status`, **do not commit it**.
Move it back into `local-test-pdfs/` or delete the staged path with
`git restore --staged <path>`.
