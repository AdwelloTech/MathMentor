import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');

// Images that should NOT be lazy loaded (above the fold / critical)
const criticalPaths = [
  'hero-bg',
  'hero-button',
  'home-bg',
  'math-mentor-logo'
];

async function addLazyLoading(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    let updated = content;
    let changes = 0;

    // Find all <img tags that don't have loading attribute
    const imgRegex = /<img\s+([^>]*?)(?<!\bloading=["'][^"']*["'])(\s*\/?>)/g;
    
    updated = content.replace(imgRegex, (match, attrs, closing) => {
      // Check if it's a critical image
      const isCritical = criticalPaths.some(path => attrs.includes(path));
      
      // Skip if already has loading attribute
      if (attrs.includes('loading=')) {
        return match;
      }
      
      // Add lazy loading for non-critical images
      if (!isCritical) {
        changes++;
        // Insert loading="lazy" before the closing of the tag
        return `<img ${attrs.trim()} loading="lazy"${closing}`;
      }
      
      return match;
    });
    
    if (changes > 0) {
      await fs.writeFile(filePath, updated);
      return { file: path.basename(filePath), changes };
    }
    return null;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return null;
  }
}

async function findReactFiles(dir) {
  const files = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (/\.(tsx?|jsx?)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function main() {
  console.log('⚡ Adding lazy loading to images...\n');
  
  const files = await findReactFiles(srcDir);
  const results = await Promise.all(files.map(addLazyLoading));
  const updated = results.filter(r => r !== null);
  
  const totalChanges = updated.reduce((sum, r) => sum + r.changes, 0);
  
  console.log(`\n✅ Added lazy loading to ${totalChanges} images in ${updated.length} files`);
  if (updated.length > 0 && updated.length <= 20) {
    updated.forEach(r => console.log(`  - ${r.file}: ${r.changes} images`));
  }
}

main().catch(console.error);

