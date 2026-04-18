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

    // Fix harsh corners
    content = content.replace(/rounded-none/g, 'rounded-2xl');

    // Fix light backgrounds without dark mode
    // Standardize the off-white bg that is bleeding in dark mode
    content = content.replace(/bg-\[#fbfcfe\](?! dark:)/g, 'bg-[#fbfcfe] dark:bg-slate-900');
    
    // Some border colors without dark mode
    content = content.replace(/border-\[#ddd4c8\](?! dark:)/g, 'border-[#ddd4c8] dark:border-slate-700/50');
    
    // Fix typography on mobile where it's 10px uppercase
    content = content.replace(/text-\[10px\]/g, 'text-xs');

    // Make sure bg-white has a dark counterpart loosely
    // Note: this is a bit aggressive but we can look for specific class sets like `bg-white border`
    content = content.replace(/bg-white border border-\[#ddd4c8\](?! dark:)/g, 'bg-white dark:bg-slate-900 border border-[#ddd4c8] dark:border-slate-700/50');
    
    // Fix any double dark: assignments just in case
    content = content.replace(/dark:border-slate-700\/50 dark:border-\[#ddd4c8\]/g, 'dark:border-slate-700/50');
    content = content.replace(/dark:bg-slate-900 dark:bg-\[#111111\]/g, 'dark:bg-[#111111]');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
console.log('UI Fixes Complete!');
