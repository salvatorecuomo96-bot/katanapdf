// Stage-0 export smoke test for katanapdf.
//
// What it covers:
//   1. pdf-lib can build a synthetic multi-page PDF.
//   2. The same overlay primitives handleDownload uses (drawRectangle,
//      drawText, save) round-trip cleanly.
//   3. The output has a valid PDF header + trailer and the same page count.
//   4. Optional: every PDF in local-test-pdfs/ survives an open -> overlay
//      -> save -> reopen roundtrip with no page-count drift.
//
// What it does NOT yet cover (for later stages):
//   - Text-content assertions via pdfjs (Stage 1+).
//   - The React state -> export glue inside App.jsx (needs an extraction).
//
// Run: npm run test:export
// Exit code: 0 = all pass, 1 = at least one failure.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const fixturesDir = path.join(repoRoot, "local-test-pdfs");

const results = [];
let pass = 0, fail = 0;

async function check(name, fn) {
  try {
    await fn();
    pass++;
    results.push({ name, status: "PASS" });
  } catch (err) {
    fail++;
    results.push({ name, status: "FAIL", err: err.message });
  }
}

async function buildSynth(numPages = 3) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= numPages; i++) {
    const p = doc.addPage([612, 792]);
    p.drawText(`ORIGINAL on page ${i}`, { x: 50, y: 700, size: 18, font, color: rgb(0, 0, 0) });
  }
  return await doc.save();
}

// Mirrors what handleDownload does to "edit" original text: white rectangle
// over the area, new text drawn on top. Same primitives, same library.
async function overlayEdits(srcBytes) {
  const doc = await PDFDocument.load(srcBytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  for (const p of doc.getPages()) {
    p.drawRectangle({ x: 40, y: 690, width: 220, height: 28, color: rgb(1, 1, 1) });
    p.drawText("EDIT", { x: 50, y: 700, size: 18, font, color: rgb(0.5, 0, 0) });
  }
  return await doc.save();
}

await check("pdf-lib builds a synthetic 3-page PDF", async () => {
  const out = await buildSynth(3);
  assert.ok(out.byteLength > 100, `byteLength=${out.byteLength}`);
  assert.equal(new TextDecoder().decode(out.slice(0, 5)), "%PDF-", "missing %PDF- header");
  const reload = await PDFDocument.load(out);
  assert.equal(reload.getPageCount(), 3);
});

await check("overlayEdits preserves page count on synthetic PDF", async () => {
  const src = await buildSynth(3);
  const out = await overlayEdits(src);
  const after = await PDFDocument.load(out);
  assert.equal(after.getPageCount(), 3, `page count drift: ${after.getPageCount()}`);
});

await check("overlayEdits output has %PDF- header and %%EOF trailer", async () => {
  const src = await buildSynth(2);
  const out = await overlayEdits(src);
  assert.equal(new TextDecoder().decode(out.slice(0, 5)), "%PDF-", "missing header");
  const tail = new TextDecoder().decode(out.slice(-1024));
  assert.ok(tail.includes("%%EOF"), "missing %%EOF trailer");
});

await check("overlayEdits is idempotent on repeated runs (no growth blowup)", async () => {
  const src = await buildSynth(2);
  const once = await overlayEdits(src);
  const twice = await overlayEdits(once);
  // Each pass adds the same constant overlay; size growth must stay sane.
  // Allow up to 4x of the first pass before flagging — this is a smoke check,
  // not a binary equality check.
  assert.ok(twice.byteLength < once.byteLength * 4,
    `size blew up on second pass: ${once.byteLength} -> ${twice.byteLength}`);
});

// Stage 1: appended PDFs survive the merge primitive used by handleAddPdfAsImage.
// Regression guard against the "+ Add PDF silently drops pages on download" bug.
await check("merge two synthetic PDFs preserves all pages (3 + 2 = 5)", async () => {
  const a = await buildSynth(3);
  const b = await buildSynth(2);
  const docA = await PDFDocument.load(a);
  const docB = await PDFDocument.load(b);
  const copied = await docA.copyPages(docB, docB.getPageIndices());
  for (const p of copied) docA.addPage(p);
  const out = await docA.save();
  const reload = await PDFDocument.load(out);
  assert.equal(reload.getPageCount(), 5, `expected 5 pages, got ${reload.getPageCount()}`);
});

// Stage 2: rotation is preserved through a save/load round-trip and is
// detectable via getRotation().angle so handleDownload can route rotated
// pages to the canvas fallback.
await check("rotation survives save/load and is detectable", async () => {
  const doc = await PDFDocument.create();
  const p = doc.addPage([612, 792]);
  p.setRotation(degrees(90));
  const out = await doc.save();
  const reload = await PDFDocument.load(out);
  const r = reload.getPages()[0].getRotation();
  assert.equal(r.angle, 90, `expected 90, got ${r.angle}`);
});

// Phase 3: encryption detection. The App.jsx encryption probe relies on
// pdf-lib's strict load throwing when the trailer has /Encrypt, and on the
// same load with `ignoreEncryption: true` succeeding. Verify both.
async function buildEncryptedFixture() {
  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);

  // Fake but well-formed Standard /Encrypt dict. The values don't decrypt
  // anything (there's no encrypted content), but pdf-lib's parser only
  // checks the trailer for an Encrypt entry — that's enough to trigger
  // EncryptedPDFError when ignoreEncryption is false.
  const encryptDict = doc.context.obj({
    Filter: "Standard",
    V: 1,
    R: 2,
    Length: 40,
    O: "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO",
    U: "UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU",
    P: -4,
  });
  const encryptRef = doc.context.register(encryptDict);
  doc.context.trailerInfo.Encrypt = encryptRef;
  // ID is required alongside Encrypt in the trailer per the PDF spec.
  doc.context.trailerInfo.ID = doc.context.obj([
    "1234567890abcdef1234567890abcdef",
    "1234567890abcdef1234567890abcdef",
  ]);
  return await doc.save({ useObjectStreams: false });
}

await check("encryption detected: strict load throws, ignoreEncryption:true succeeds", async () => {
  const enc = await buildEncryptedFixture();

  let strictErr = null;
  try {
    await PDFDocument.load(enc, { ignoreEncryption: false });
  } catch (e) {
    strictErr = e;
  }
  assert.ok(strictErr, "expected strict load to throw on /Encrypt PDF");
  assert.match(
    strictErr.message,
    /encrypt/i,
    `expected encryption-flavoured error, got: ${strictErr.message}`
  );

  // Sanity: the same bytes should still be loadable when we explicitly
  // ignore encryption — that's the path handleDownload falls back to once
  // the user has been warned via the banner.
  const lenient = await PDFDocument.load(enc, { ignoreEncryption: true });
  assert.equal(lenient.getPageCount(), 1, "ignoreEncryption load should expose the 1 page");
});

// Phase 5 step C: Noto + fontkit handles full Unicode (café résumé piñata)
// where StandardFonts would have stripped to "?". Confirms the woff2 in
// public/fonts/ are loadable via embedFont and round-trip non-Latin chars.
await check("Unicode round-trip: café résumé piñata via Noto Sans woff2", async () => {
  const fontPath = path.join(repoRoot, "public", "fonts", "noto-sans-regular.woff2");
  const fontBytes = await readFile(fontPath);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const noto = await doc.embedFont(fontBytes, { subset: true });
  const page = doc.addPage([612, 792]);
  const phrase = "café résumé piñata";
  page.drawText(phrase, { x: 50, y: 700, size: 18, font: noto, color: rgb(0, 0, 0) });
  const out = await doc.save();
  assert.equal(new TextDecoder().decode(out.slice(0, 5)), "%PDF-", "missing %PDF- header");
  // Round-trip: parse back and confirm the doc still reports 1 page (drawText
  // didn't throw an encoding error, which it would have for Standard fonts).
  const reload = await PDFDocument.load(out);
  assert.equal(reload.getPageCount(), 1);
  // Also verify the saved bytes contain a Tj/TJ text-show op near our phrase
  // (subsetting rewrites glyph indices, so we can't grep raw UTF-8) — instead
  // confirm the file is non-trivial in size, indicating real glyph data was embedded.
  assert.ok(out.byteLength > 2000, `expected real font data embedded; got ${out.byteLength} bytes`);
});

// Phase 6: reorder pages via copyPages([2, 0, 1]). Mirrors what handleDownload
// does on save when the user has reordered pageOrder. Verifies all pages survive
// and the new doc reports the right count; a follow-up byte-level check would
// need pdfjs to read text content (out of scope for smoke).
await check("reorder pages: copyPages([2, 0, 1]) keeps all 3 pages", async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 3; i++) {
    const p = doc.addPage([612, 792]);
    p.drawText(`PAGE ${i}`, { x: 50, y: 700, size: 18, font });
  }
  const src = await doc.save();

  const srcDoc = await PDFDocument.load(src);
  const newDoc = await PDFDocument.create();
  const order = [2, 0, 1];
  const reordered = await newDoc.copyPages(srcDoc, order);
  for (const p of reordered) newDoc.addPage(p);
  const out = await newDoc.save();

  const reload = await PDFDocument.load(out);
  assert.equal(reload.getPageCount(), 3, `expected 3 pages, got ${reload.getPageCount()}`);
  // Sanity: the saved bytes contain page content streams; non-trivial size.
  assert.ok(out.byteLength > 1000, `expected real content; got ${out.byteLength} bytes`);
});

await check("merge then overlay edits keeps merged page count", async () => {
  const a = await buildSynth(2);
  const b = await buildSynth(2);
  const docA = await PDFDocument.load(a);
  const docB = await PDFDocument.load(b);
  const copied = await docA.copyPages(docB, docB.getPageIndices());
  for (const p of copied) docA.addPage(p);
  const merged = await docA.save();
  const edited = await overlayEdits(merged);
  const reload = await PDFDocument.load(edited);
  assert.equal(reload.getPageCount(), 4, `expected 4 pages, got ${reload.getPageCount()}`);
});

// --- Optional fixture roundtrip ---

let fixtures = [];
try {
  const entries = await readdir(fixturesDir);
  fixtures = entries.filter(f => f.toLowerCase().endsWith(".pdf"));
} catch {
  // local-test-pdfs/ doesn't exist yet — that's fine, it's gitignored.
}

for (const f of fixtures) {
  await check(`fixture roundtrip: ${f}`, async () => {
    const src = await readFile(path.join(fixturesDir, f));
    const before = await PDFDocument.load(src, { ignoreEncryption: true });
    const beforePages = before.getPageCount();
    const out = await overlayEdits(src);
    assert.ok(out.byteLength > 0, "0-byte output");
    const after = await PDFDocument.load(out, { ignoreEncryption: true });
    assert.equal(
      after.getPageCount(),
      beforePages,
      `page count drift: ${beforePages} -> ${after.getPageCount()}`
    );
  });
}

// --- Report ---

const line = "-".repeat(56);
console.log("\nkatanapdf export smoke test");
console.log(line);
for (const r of results) {
  if (r.status === "PASS") console.log(`  PASS  ${r.name}`);
  else console.log(`  FAIL  ${r.name}\n        ${r.err}`);
}
console.log(line);
const fixtureNote = fixtures.length
  ? `${fixtures.length} fixture(s) tested`
  : "no local fixtures present (drop PDFs into local-test-pdfs/ to test more)";
console.log(`  ${pass} passed, ${fail} failed - ${fixtureNote}\n`);
process.exit(fail ? 1 : 0);
