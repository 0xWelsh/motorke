const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Find elements that have dark backgrounds AND text-white in the same className string
  // This handles the simple cases.
  const classMatches = content.match(/className=(?:\{`|'|")([^'"`\{\}]+)(?:`|'|"|\})/g);
  if (classMatches) {
    classMatches.forEach(clsStr => {
      if (
        (clsStr.includes('bg-slate-900') || clsStr.includes('bg-slate-800') || clsStr.includes('bg-black') || clsStr.includes('bg-[#0a0a0a]')) &&
        (clsStr.includes('text-white') || clsStr.includes('text-slate-200') || clsStr.includes('text-slate-300'))
      ) {
        // Intelligently replace text colors in this specific string
        let newClsStr = clsStr
          .replace(/\btext-white\b/g, 'text-pureWhite')
          .replace(/\btext-white\//g, 'text-pureWhite/')
          .replace(/\btext-slate-200\b/g, 'text-slate-300') // just making it a bit darker maybe? Actually leave it or use pureWhite
          .replace(/\btext-slate-300\b/g, 'text-slate-400');
        
        if (newClsStr !== clsStr) {
          content = content.replace(clsStr, newClsStr);
          changed = true;
        }
      }
    });
  }

  // 2. Globally replace unreadable slate/gray text that are used without dark backgrounds
  // E.g., text-slate-400 becomes dark:text-slate-400 text-slate-600
  // text-slate-500 becomes dark:text-slate-500 text-slate-600
  // But wait, what if it ALREADY has dark: ?
  const fixes = [
    { from: /(?<!dark:)\btext-slate-400\b/g, to: 'dark:text-slate-400 text-slate-600' },
    { from: /(?<!dark:)\btext-slate-500\b/g, to: 'dark:text-slate-500 text-slate-600' },
    { from: /(?<!dark:)\btext-slate-300\b/g, to: 'dark:text-slate-300 text-slate-500' },
    { from: /(?<!dark:)\btext-gray-400\b/g, to: 'dark:text-gray-400 text-gray-600' },
    { from: /(?<!dark:)\btext-gray-500\b/g, to: 'dark:text-gray-500 text-gray-600' },
  ];

  fixes.forEach(fix => {
    if (fix.from.test(content)) {
      content = content.replace(fix.from, fix.to);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed unreadable text in:', file);
  }
});
