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
//   - Page rotation, encryption, merge-of-appended-pages bug.
//
// Run: npm run test:export
// Exit code: 0 = all pass, 1 = at least one failure.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

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
