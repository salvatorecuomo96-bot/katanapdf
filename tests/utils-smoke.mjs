import assert from "node:assert/strict";
import { makeTabId, clusterWordsIntoLineClusters, pageWordsToTextBlocks } from "../src/components/utils/pdfUtils.js";

async function check(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    console.log(`  FAIL  ${name}\n        ${err.message}`);
    process.exit(1);
  }
}

await check("makeTabId generates unique IDs", () => {
  const id1 = makeTabId();
  const id2 = makeTabId();
  assert.ok(id1.startsWith("tab-"));
  assert.notEqual(id1, id2);
});

await check("clusterWordsIntoLineClusters groups words by baseline", () => {
  const words = [
    { text: "Hello", baselineY: 100, x: 10, width: 40, fontSize: 12 },
    { text: "World", baselineY: 100, x: 60, width: 40, fontSize: 12 },
    { text: "Second", baselineY: 120, x: 10, width: 50, fontSize: 12 },
  ];
  const clusters = clusterWordsIntoLineClusters(words);
  assert.equal(clusters.length, 2);
  // The current implementation sorts by baselineY descending (bottom-to-top if baselineY is from top)
  // or ascending if baselineY is from bottom. 
  // Given b.baselineY - a.baselineY, larger baselineY comes first.
  const line100 = clusters.find(c => c[0].baselineY === 100);
  const line120 = clusters.find(c => c[0].baselineY === 120);
  assert.equal(line100.length, 2);
  assert.equal(line120.length, 1);
});

await check("pageWordsToTextBlocks converts words to blocks", () => {
  const words = [
    { text: "Hello", baselineY: 100, x: 10, width: 40, fontSize: 12, y: 90, height: 14, page: 1, fontFamily: "Arial", isBold: false, isItalic: false },
    { text: "World", baselineY: 100, x: 60, width: 40, fontSize: 12, y: 90, height: 14, page: 1, fontFamily: "Arial", isBold: false, isItalic: false },
  ];
  const blocks = pageWordsToTextBlocks(words);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].text, "Hello World");
  assert.equal(blocks[0].page, 1);
});

console.log("\npdfUtils unit tests passed!");
