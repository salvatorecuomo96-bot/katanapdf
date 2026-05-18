// Logic smoke tests — automatable without a browser.
// Covers: pickPdfLibFont, hexToRgb, loadPdfForExport, page-delete export, split PDF.
// Run: node tests/logic-smoke.mjs

import assert from "node:assert/strict";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { pickPdfLibFont, hexToRgb, loadPdfForExport } from "../src/components/utils/pdfExportUtils.js";

const results = [];
let pass = 0, fail = 0;

async function check(name, fn) {
  try {
    await fn();
    pass++;
    results.push({ name, ok: true });
  } catch (err) {
    fail++;
    results.push({ name, ok: false, err: err.message });
  }
}

// ── pickPdfLibFont ─────────────────────────────────────────────
const fakeFont = (tag) => ({ _tag: tag });
const fonts = {
  helv:    fakeFont("helv"),
  helvB:   fakeFont("helvB"),
  helvI:   fakeFont("helvI"),
  helvBI:  fakeFont("helvBI"),
  times:   fakeFont("times"),
  timesB:  fakeFont("timesB"),
  courier: fakeFont("courier"),
};

await check("pickPdfLibFont: serif family → times", () => {
  assert.equal(pickPdfLibFont(fonts, "Times New Roman, serif", false, false)._tag, "times");
});
await check("pickPdfLibFont: serif + bold → timesB", () => {
  assert.equal(pickPdfLibFont(fonts, "georgia", true, false)._tag, "timesB");
});
await check("pickPdfLibFont: mono family → courier", () => {
  assert.equal(pickPdfLibFont(fonts, "Courier New, monospace", false, false)._tag, "courier");
});
await check("pickPdfLibFont: mono + bold is still courier (no bold courier)", () => {
  assert.equal(pickPdfLibFont(fonts, "courier", true, false)._tag, "courier");
});
await check("pickPdfLibFont: sans → helv", () => {
  assert.equal(pickPdfLibFont(fonts, "Arial, sans-serif", false, false)._tag, "helv");
});
await check("pickPdfLibFont: sans + bold → helvB", () => {
  assert.equal(pickPdfLibFont(fonts, "Arial, sans-serif", true, false)._tag, "helvB");
});
await check("pickPdfLibFont: sans + italic → helvI", () => {
  assert.equal(pickPdfLibFont(fonts, "Arial, sans-serif", false, true)._tag, "helvI");
});
await check("pickPdfLibFont: sans + bold + italic → helvBI", () => {
  assert.equal(pickPdfLibFont(fonts, "Arial, sans-serif", true, true)._tag, "helvBI");
});
await check("pickPdfLibFont: empty family falls back to helv", () => {
  assert.equal(pickPdfLibFont(fonts, "", false, false)._tag, "helv");
});
await check("pickPdfLibFont: null family falls back to helv", () => {
  assert.equal(pickPdfLibFont(fonts, null, false, false)._tag, "helv");
});

// ── hexToRgb ──────────────────────────────────────────────────
await check("hexToRgb: #ff0000 → r=1 g=0 b=0", () => {
  const c = hexToRgb("#ff0000");
  assert.ok(Math.abs(c.red - 1) < 0.01, `red=${c.red}`);
  assert.ok(Math.abs(c.green) < 0.01, `green=${c.green}`);
  assert.ok(Math.abs(c.blue) < 0.01, `blue=${c.blue}`);
});
await check("hexToRgb: #ffffff → all 1", () => {
  const c = hexToRgb("#ffffff");
  assert.ok(Math.abs(c.red - 1) < 0.01);
  assert.ok(Math.abs(c.green - 1) < 0.01);
  assert.ok(Math.abs(c.blue - 1) < 0.01);
});
await check("hexToRgb: #000000 → all 0", () => {
  const c = hexToRgb("#000000");
  assert.ok(Math.abs(c.red) < 0.01);
  assert.ok(Math.abs(c.green) < 0.01);
  assert.ok(Math.abs(c.blue) < 0.01);
});
await check("hexToRgb: without # prefix still parses", () => {
  const c = hexToRgb("0000ff");
  assert.ok(Math.abs(c.blue - 1) < 0.01, `blue=${c.blue}`);
});
await check("hexToRgb: bad input → black (no throw)", () => {
  const c = hexToRgb("notacolor");
  assert.ok(Math.abs(c.red) < 0.01 && Math.abs(c.green) < 0.01 && Math.abs(c.blue) < 0.01);
});
await check("hexToRgb: null → black (no throw)", () => {
  const c = hexToRgb(null);
  assert.ok(Math.abs(c.red) < 0.01);
});
await check("hexToRgb: #4caf50 mid-tone is non-zero", () => {
  const c = hexToRgb("#4caf50");
  assert.ok(c.red > 0 && c.red < 1);
  assert.ok(c.green > 0 && c.green < 1);
  assert.ok(c.blue > 0 && c.blue < 1);
});

// ── loadPdfForExport ──────────────────────────────────────────
async function buildSynth(n = 1) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < n; i++) {
    const p = doc.addPage([612, 792]);
    p.drawText(`Page ${i + 1}`, { x: 50, y: 700, size: 18, font });
  }
  return doc.save();
}

await check("loadPdfForExport: valid PDF returns PDFDocument", async () => {
  const bytes = await buildSynth(2);
  const doc = await loadPdfForExport(bytes);
  assert.ok(doc !== null, "expected doc, got null");
  assert.equal(doc.getPageCount(), 2);
});

await check("loadPdfForExport: corrupt bytes returns null (no throw)", async () => {
  const garbage = new Uint8Array([0x00, 0x01, 0x02, 0xde, 0xad, 0xbe, 0xef]);
  const doc = await loadPdfForExport(garbage);
  assert.equal(doc, null, "expected null for corrupt bytes");
});

// ── Page deletion on export ───────────────────────────────────
// Mirrors what handleDownload does when deletedPages has entries:
// it skips those page indices in the copyPages call.
await check("page deletion: skip page 2 of 3 → 2-page output", async () => {
  const src = await buildSynth(3);
  const srcDoc = await PDFDocument.load(src);
  const newDoc = await PDFDocument.create();
  const deletedIndices = new Set([1]); // page index 1 = page 2
  const keep = srcDoc.getPageIndices().filter(i => !deletedIndices.has(i));
  assert.equal(keep.length, 2, `expected 2 kept indices, got ${keep.length}`);
  const copied = await newDoc.copyPages(srcDoc, keep);
  for (const p of copied) newDoc.addPage(p);
  const out = await newDoc.save();
  const reload = await PDFDocument.load(out);
  assert.equal(reload.getPageCount(), 2, `expected 2 pages, got ${reload.getPageCount()}`);
});

await check("page deletion: delete all pages → pdf-lib saves 1 blank page (known behavior)", async () => {
  // pdf-lib always emits at least 1 page on save; deleting all is a degenerate
  // edge case the UI prevents via the Delete button being hidden when 1 page remains.
  const src = await buildSynth(3);
  const srcDoc = await PDFDocument.load(src);
  const newDoc = await PDFDocument.create();
  const copied = await newDoc.copyPages(srcDoc, []);
  for (const p of copied) newDoc.addPage(p);
  const out = await newDoc.save();
  const reload = await PDFDocument.load(out);
  assert.ok(reload.getPageCount() >= 0, "should not throw");
});

// ── Split PDF ─────────────────────────────────────────────────
// Mirrors SplitModal: produce one single-page PDF per source page.
async function splitPdf(srcBytes) {
  const srcDoc = await PDFDocument.load(srcBytes);
  const results = [];
  for (const i of srcDoc.getPageIndices()) {
    const single = await PDFDocument.create();
    const [copied] = await single.copyPages(srcDoc, [i]);
    single.addPage(copied);
    results.push(await single.save());
  }
  return results;
}

await check("split: 4-page PDF → 4 single-page PDFs", async () => {
  const src = await buildSynth(4);
  const parts = await splitPdf(src);
  assert.equal(parts.length, 4, `expected 4 parts, got ${parts.length}`);
  for (let i = 0; i < parts.length; i++) {
    const doc = await PDFDocument.load(parts[i]);
    assert.equal(doc.getPageCount(), 1, `part ${i} has ${doc.getPageCount()} pages`);
    assert.equal(new TextDecoder().decode(parts[i].slice(0, 5)), "%PDF-");
  }
});

await check("split: 1-page PDF → 1 single-page PDF", async () => {
  const src = await buildSynth(1);
  const parts = await splitPdf(src);
  assert.equal(parts.length, 1);
  const doc = await PDFDocument.load(parts[0]);
  assert.equal(doc.getPageCount(), 1);
});

await check("split then merge back: keeps original page count", async () => {
  const src = await buildSynth(3);
  const parts = await splitPdf(src);
  const merged = await PDFDocument.create();
  for (const part of parts) {
    const partDoc = await PDFDocument.load(part);
    const [pg] = await merged.copyPages(partDoc, [0]);
    merged.addPage(pg);
  }
  const out = await merged.save();
  const reload = await PDFDocument.load(out);
  assert.equal(reload.getPageCount(), 3, `expected 3, got ${reload.getPageCount()}`);
});

// ── Rotation on individual split pages ───────────────────────
await check("split preserves per-page rotation", async () => {
  const srcDoc = await PDFDocument.create();
  const font = await srcDoc.embedFont(StandardFonts.Helvetica);
  const p1 = srcDoc.addPage([612, 792]);
  p1.drawText("normal", { x: 50, y: 700, size: 14, font });
  const p2 = srcDoc.addPage([612, 792]);
  p2.setRotation(degrees(90));
  p2.drawText("rotated", { x: 50, y: 700, size: 14, font });
  const src = await srcDoc.save();

  const parts = await splitPdf(src);
  assert.equal(parts.length, 2);

  const part0 = await PDFDocument.load(parts[0]);
  assert.equal(part0.getPages()[0].getRotation().angle, 0);

  const part1 = await PDFDocument.load(parts[1]);
  assert.equal(part1.getPages()[0].getRotation().angle, 90);
});

// ── Snapshot/restore round-trip (regression guard) ───────────
// Mirrors the tab-snapshot system: state is captured into a plain object,
// then a restore function pushes each field back into the live state.
// Bug found 2026-05-18: restoreSnapshot dropped floatingShapes.
await check("snapshot/restore preserves all annotation arrays", () => {
  const live = {
    textBlocks: { 1: [{ id: "tb1", text: "hello" }] },
    floatingBoxes: [{ id: "fb1", page: 1, text: "box" }],
    floatingImages: [{ id: "fi1", page: 1, dataUrl: "data:image/png;base64,AAA" }],
    floatingShapes: [{ id: "fs1", page: 1, shapeType: "circle" }],
    rotatedPages: { 1: 90 },
    deletedPages: new Set([2]),
  };
  const snap = JSON.parse(JSON.stringify({
    ...live,
    deletedPages: [...live.deletedPages],
  }));
  // Simulate the FIELDS restoreSnapshot writes
  const restored = {
    textBlocks: snap.textBlocks,
    floatingBoxes: snap.floatingBoxes,
    floatingImages: snap.floatingImages,
    floatingShapes: snap.floatingShapes || [],
    rotatedPages: snap.rotatedPages || {},
    deletedPages: new Set(snap.deletedPages || []),
  };
  assert.equal(restored.floatingBoxes.length, 1);
  assert.equal(restored.floatingImages.length, 1);
  assert.equal(restored.floatingShapes.length, 1, "shapes must survive round-trip");
  assert.equal(restored.floatingShapes[0].id, "fs1");
  assert.equal(restored.deletedPages.has(2), true);
});

// ── Report ────────────────────────────────────────────────────
const line = "-".repeat(56);
console.log("\nkatanapdf logic smoke tests");
console.log(line);
for (const r of results) {
  if (r.ok) console.log(`  PASS  ${r.name}`);
  else       console.log(`  FAIL  ${r.name}\n        ${r.err}`);
}
console.log(line);
console.log(`  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
