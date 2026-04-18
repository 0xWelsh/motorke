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
    let originalContent = content;

    // Any generic bg-white lacking a dark mode gets a safe dark mode alternative, to prevent literal white text on literal white cards
    content = content.replace(/bg-white border /g, 'bg-white dark:bg-[#111111] border ');
    
    // Clean up any duplicates we might have just created 
    content = content.replace(/dark:bg-\[#111111\] dark:bg-/g, 'dark:bg-');
    
    // Fix transitions
    content = content.replace(/transition-none/g, 'transition-all');
    
    // Drop shadow-none since it overrides the UI
    content = content.replace(/shadow-none /g, '');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
