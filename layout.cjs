const fs = require('fs');
let code = fs.readFileSync('src/components/PDFEditor/PDFEditor.jsx', 'utf8');

const startTag = '<div data-edit-toolbar';
const endTag = '<div style={{ display: \'flex\', flex: 1, minHeight: 0, width: \'100%\', position: \'relative\' }}>';
const asideStart = '{/* Left Sidebar */}';
const rightMainArea = '{/* Right Main Area */}';

const part1 = code.slice(0, code.indexOf(startTag)); 
const middle = code.slice(code.indexOf(startTag), code.indexOf(endTag)); 
const remaining = code.slice(code.indexOf(endTag)); 

const asideContent = remaining.slice(remaining.indexOf(asideStart), remaining.indexOf(rightMainArea));
const mainArea = remaining.slice(remaining.indexOf(rightMainArea)); 

let modifiedMainArea = mainArea.replace('          </div>\n        </>\n      )}\n      {isSignModalOpen', '        </div>\n        </div>\n      )}\n      {isSignModalOpen');

const finalCode = part1 + 
  "<div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>\n" + 
  asideContent.replace('borderRight: `1px solid rgba(139,26,26,0.5)`', 'borderRight: `1px solid rgba(139,26,26,0.5)`, borderTop: `1px solid rgba(139,26,26,0.5)`') + 
  "          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative' }}>\n" +
  middle + 
  modifiedMainArea;

fs.writeFileSync('src/components/PDFEditor/PDFEditor.jsx', finalCode.replace(/<>\\n/, ""));
console.log('Layout updated.');
