const fs = require('fs');
const path = require('path');

const replacements = {
  'â€”': '—',
  'âŠž': '⊞',
  'â†»': '↻',
  'âœ•': '✕',
  'â†©': '↩',
  'âˆ’': '−',
  'âœ“': '✓',
  'Â·': '·',
  'â†’': '→',
  'â†': '←',
  'Â©': '©',
  'âœ¥': '✥',
  'Â°': '°',
  'ðŸ–‹': '🖋',
  'Ã—': '×'
};

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
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  for (const [bad, good] of Object.entries(replacements)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
