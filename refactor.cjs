const fs = require('fs');
let code = fs.readFileSync('src/components/PDFEditor/PDFEditor.jsx', 'utf8');

const asideStart = code.indexOf('            {/* Left Sidebar */}');
const rightMainArea = code.indexOf('            {/* Right Main Area */}');
if (asideStart === -1 || rightMainArea === -1) {
  console.error('Markers not found');
  process.exit(1);
}
const asideBlock = code.slice(asideStart, rightMainArea);

// Remove the aside block
code = code.slice(0, asideStart) + code.slice(rightMainArea);

// Replace the original flex container wrapper that was around aside and right main area
const search1 = `          <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>\n            {/* Right Main Area */}`;
const replace1 = `          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative' }}>\n            {/* Right Main Area */}`;
code = code.replace(search1, replace1);

// Now, replace the `<>` with `<div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>` + asideBlock
const search2 = `      ) : (\n        <>`;
const replace2 = `      ) : (\n        <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>\n` + asideBlock;
code = code.replace(search2, replace2);

// Add borderTop to aside
code = code.replace(
  `background: PARCHMENT_2, borderRight: \`1px solid rgba(139,26,26,0.5)\`, overflowY: 'auto'`,
  `background: PARCHMENT_2, borderRight: \`1px solid rgba(139,26,26,0.5)\`, borderTop: \`1px solid rgba(139,26,26,0.5)\`, overflowY: 'auto'`
);

// Finally, replace `</>` with `</div>`
const search3 = `            </div>\n          </div>\n        </>\n      )}\n      {isSignModalOpen`;
const replace3 = `            </div>\n          </div>\n        </div>\n      )}\n      {isSignModalOpen`;
code = code.replace(search3, replace3);

fs.writeFileSync('src/components/PDFEditor/PDFEditor.jsx', code);
console.log('Done');
