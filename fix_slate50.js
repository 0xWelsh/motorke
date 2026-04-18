const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add dark:bg-slate-900 to bg-slate-50 if it doesn't already have a dark mode class
    content = content.replace(/bg-slate-50 /g, 'bg-slate-50 dark:bg-slate-900 ');
    content = content.replace(/dark:bg-slate-900 dark:bg-/g, 'dark:bg-');

    // Make sure we also convert border-slate-200 to have dark mode
    content = content.replace(/border-slate-200 /g, 'border-slate-200 dark:border-slate-800 ');
    content = content.replace(/dark:border-slate-800 dark:border-/g, 'dark:border-');
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});
