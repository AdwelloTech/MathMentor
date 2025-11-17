import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'src');

async function updateFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Replace .png with .webp in image paths
    const updated = content.replace(
      /(['"])([^'"]*\.(png|PNG))(['"])/g,
      (match, quote1, path, ext, quote2) => {
        // Keep the path but change extension to .webp
        const webpPath = path.replace(/\.(png|PNG)$/i, '.webp');
        return `${quote1}${webpPath}${quote2}`;
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
  console.log('🔄 Updating image references to WebP...\n');
  
  const startTime = Date.now();
  const files = await findReactFiles(srcDir);
  
  console.log(`Found ${files.length} source files`);
  
  const results = await Promise.all(files.map(updateFile));
  const updated = results.filter(r => r !== null);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Updated ${updated.length} files in ${duration}s`);
  if (updated.length > 0) {
    console.log('\nUpdated files:');
    updated.forEach(f => console.log(`  - ${f}`));
  }
}

main().catch(console.error);

