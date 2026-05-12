import fs from 'fs';
import path from 'path';

const finalCleanups = {
  'â€"': '-',
  'Â(c)': '(c)',
  'Âdeg': 'deg',
  'Ã-': 'X',
  'âˆ\'': '-',
  'âœMove': 'Move',
  'âœSave': 'Save',
  'âœX': 'X',
  'â†Rotate': 'Rotate',
  'âŠGrid': 'Grid',
  'â†<-': '<-',
  'ðŸ–Edit': 'Edit',
  'â†->': '->',
  'Â.': '.',
  'â–v': 'v',
  'âv': 'v',
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
let totalChangedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // 1. Apply specific remnant replacements
  for (const [bad, good] of Object.entries(finalCleanups)) {
    if (content.includes(bad)) {
      content = content.split(bad).join(good);
    }
  }

  // 2. Strip ANY remaining non-ASCII characters (char code > 127), except for standard ones if we somehow added them.
  // We want pure ASCII keyboard characters.
  let cleanContent = '';
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    if (code <= 127) {
      cleanContent += content[i];
    }
  }
  content = cleanContent;

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed:', file);
    totalChangedFiles++;
  }
});

console.log('Total files changed:', totalChangedFiles);
