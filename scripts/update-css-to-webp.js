import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');

async function updateCSSFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Replace .png with .webp in CSS url() functions
    const updated = content.replace(
      /url\((['"]?)([^'"()]*\.png)(['"]?)\)/gi,
      (match, quote1, path, quote2) => {
        const webpPath = path.replace(/\.png$/i, '.webp');
        return `url(${quote1}${webpPath}${quote2})`;
      }
    );
    
    if (updated !== content) {
      await fs.writeFile(filePath, updated);
      return path.basename(filePath);
    }
    return null;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return null;
  }
}

async function findCSSFiles(dir) {
  const files = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (/\.css$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function main() {
  console.log('🎨 Updating CSS files to WebP...\n');
  
  const files = await findCSSFiles(srcDir);
  console.log(`Found ${files.length} CSS files`);
  
  const results = await Promise.all(files.map(updateCSSFile));
  const updated = results.filter(r => r !== null);
  
  console.log(`\n✅ Updated ${updated.length} CSS files`);
  if (updated.length > 0) {
    updated.forEach(f => console.log(`  - ${f}`));
  }
}

main().catch(console.error);

