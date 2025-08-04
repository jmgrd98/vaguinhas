// rewrite-imports.cjs
const fs = require('fs');
const path = require('path');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add .js extension to relative imports
  content = content.replace(
    /from\s+['"](\.\.?\/[^'"]*)['"](?![\.\w])/g,
    'from "$1.js"'
  );
  
  fs.writeFileSync(filePath, content);
}

function processDirectory(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.js')) {
      fixImports(fullPath);
    }
  }
}

// Start processing from dist directory
const distDirectory = path.join(__dirname, 'dist');
processDirectory(distDirectory);
console.log('✅ Import paths updated successfully');