import fs from 'fs';
import path from 'path';

// Extract keys exactly as they appear in fix-encoding.js
const fixEncodingContent = fs.readFileSync('fix-encoding.js', 'utf8');
const lines = fixEncodingContent.split('\n');
let inReplacements = false;
let originalKeys = {};

for (const line of lines) {
  if (line.includes('const replacements = {')) {
    inReplacements = true;
    continue;
  }
  if (inReplacements && line.includes('};')) {
    break;
  }
  if (inReplacements) {
    const match = line.match(/'(.*?)':/);
    if (match) {
      const key = match[1];
      originalKeys[key] = true;
    }
  }
}

// Map the extracted Mojibake keys (and standard unicode keys) to ASCII
const asciiMap = {
  // Map based on fix-encoding keys exactly as they are in the file:
  // We'll iterate through originalKeys. But we know what they meant.
};

// Instead of matching keys, let's just use exact Unicode characters we know we need to replace:

const replacements = {
  // UTF-8 standard mappings
  '✕': 'X',
  '×': 'X',
  '✓': 'Save',
  '✥': 'Move',
  '↻': 'Rotate',
  '⏷': 'v',
  '▼': 'v',
  '⊞': 'Grid',
  '—': '-',
  '“': '"',
  '”': '"',
  '‘': "'",
  '’': "'",
  '©': '(c)',
  '←': '<-',
  '→': '->',
  '−': '-',
  '·': '.',
  '°': 'deg',
  '🖋': 'Edit',
  '↩': '<-',
};

// Add all original keys from fix-encoding.js mapped to their ASCII equivalents
const fixToAscii = {
  '—': '-',    // Just in case it's the em-dash in fix-encoding.js
  '⊞': 'Grid',
  '↻': 'Rotate',
  '✕': 'X',
  '↩': '<-',
  '−': '-',
  '✓': 'Save',
  '·': '.',
  '→': '->',
  '←': '<-',
  '©': '(c)',
  '✥': 'Move',
  '°': 'deg',
  '🖋': 'Edit',
  '×': 'X'
};

// To handle Mojibake, we just run the original fix-encoding.js logic conceptually, 
// BUT we replace the final string with our ASCII version instead of the UTF-8 one.
const mojibakeToUtf8 = {
  'â€”': '—',
  'âŠž': '⊞',
  'â†»': '↻',
  'âœ•': '✕',
  'â†©': '↩',
  'âˆ’': '−',
  'âœ“': '✓',
  'Â·': '·',
  'â†’': '→',
  'â†': '←', // note: as is in fix-encoding.js
  'Â©': '©',
  'âœ¥': '✥',
  'Â°': '°',
  'ðŸ–‹': '🖋',
  'Ã—': '×'
};

for (const [mojibake, utf8] of Object.entries(mojibakeToUtf8)) {
   replacements[mojibake] = fixToAscii[utf8] || utf8;
}

// Add the original keys from fix-encoding just to be perfectly sure we use the same exact strings
const fixLines = fixEncodingContent.split('\n');
for (const line of fixLines) {
  const match = line.match(/'(.*?)':\s*'(.*?)'/);
  if (match) {
    const bad = match[1];
    const good = match[2];
    if (fixToAscii[good]) {
       replacements[bad] = fixToAscii[good];
    }
  }
}

// Add smart quote mojibakes which might be present
replacements['â€œ'] = '"';
replacements['â€\x9d'] = '"';
replacements['â€˜'] = "'";
replacements['â€™'] = "'";
replacements['â–¼'] = 'v';
replacements['â\x8f·'] = 'v';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fileDir = path.join(dir, file);
    const stat = fs.statSync(fileDir);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fileDir));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      results.push(fileDir);
    }
  });
  return results;
}

const files = walk('./src');
let totalChangedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  for (const [bad, good] of Object.entries(replacements)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
    }
  }

  // Final fallback to clean up any remaining literal UTF-8
  const utf8ToAscii = {
    '✕': 'X', '×': 'X', '✓': 'Save', '✥': 'Move', '↻': 'Rotate', 
    '⏷': 'v', '▼': 'v', '⊞': 'Grid', '—': '-', '“': '"', '”': '"', 
    '‘': "'", '’': "'", '©': '(c)', '←': '<-', '→': '->', '−': '-', 
    '·': '.', '°': 'deg', '🖋': 'Edit', '↩': '<-'
  };
  for (const [bad, good] of Object.entries(utf8ToAscii)) {
     if (content.includes(bad)) {
        content = content.split(bad).join(good);
     }
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
    totalChangedFiles++;
  }
});

console.log('Total files changed:', totalChangedFiles);