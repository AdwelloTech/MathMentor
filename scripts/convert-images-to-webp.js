import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process multiple images in parallel for speed
const PARALLEL_LIMIT = 10;

async function convertImageToWebP(imagePath) {
  try {
    const ext = path.extname(imagePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) return null;

    const webpPath = imagePath.replace(/\.(png|jpe?g)$/i, '.webp');
    
    // Check if webp exists and is newer than source
    try {
      const [sourceStats, webpStats] = await Promise.all([
        fs.stat(imagePath),
        fs.stat(webpPath)
      ]);
      if (webpStats.mtime > sourceStats.mtime) {
        return null; // Skip if webp is up to date
      }
    } catch {
      // WebP doesn't exist, continue
    }

    const [inputBuffer, originalSize] = await Promise.all([
      fs.readFile(imagePath),
      fs.stat(imagePath).then(s => s.size)
    ]);

    const outputBuffer = await sharp(inputBuffer)
      .webp({ quality: 85, effort: 4 }) // Reduced effort for speed
      .toBuffer();

    await fs.writeFile(webpPath, outputBuffer);

    const savings = ((1 - outputBuffer.length / originalSize) * 100).toFixed(1);
    return {
      name: path.basename(imagePath),
      original: (originalSize / 1024).toFixed(1),
      webp: (outputBuffer.length / 1024).toFixed(1),
      savings
    };
  } catch (error) {
    console.error(`✗ Error: ${path.basename(imagePath)}`);
    return null;
  }
}

async function findImages(dir) {
  const images = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
        images.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return images;
}

async function processInBatches(items, batchSize, processor) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults.filter(r => r !== null));
    console.log(`Progress: ${Math.min(i + batchSize, items.length)}/${items.length}`);
  }
  return results;
}

async function main() {
  console.log('🖼️  Fast WebP Conversion\n');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const startTime = Date.now();
  
  console.log('📂 Finding images...');
  const images = await findImages(publicDir);
  console.log(`Found ${images.length} PNG/JPG images\n`);
  
  console.log('⚡ Converting (parallel processing)...');
  const results = await processInBatches(images, PARALLEL_LIMIT, convertImageToWebP);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Converted ${results.length} images in ${duration}s`);
  
  if (results.length > 0) {
    const totalOriginal = results.reduce((sum, r) => sum + parseFloat(r.original), 0);
    const totalWebp = results.reduce((sum, r) => sum + parseFloat(r.webp), 0);
    const totalSavings = ((1 - totalWebp / totalOriginal) * 100).toFixed(1);
    console.log(`💾 Total: ${totalOriginal.toFixed(1)}KB → ${totalWebp.toFixed(1)}KB (${totalSavings}% saved)`);
  }
}

main().catch(console.error);
