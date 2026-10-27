const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..');
const parentDir = path.resolve(srcDir, '..');
const destDir = path.join(parentDir, 'EcoPickApp-BACKUP-BEFORE-CLEANUP');

console.log('Copying files from', srcDir, 'to', destDir);

// Filter out node_modules, .expo to save time and space
function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    const baseName = path.basename(src);
    if (baseName === 'node_modules' || baseName === '.expo') {
      return;
    }
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  copyRecursive(srcDir, destDir);
  console.log('SUCCESS: Full backup created at:', destDir);
} catch (e) {
  console.error('Backup error:', e);
}
