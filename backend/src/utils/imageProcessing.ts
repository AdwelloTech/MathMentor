import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { FileUploadService } from '../services/fileUploadService';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ProcessedImageResult {
  originalPath: string;
  processedPath: string;
  thumbnailPath?: string;
  dimensions: ImageDimensions;
  fileSize: number;
  format: string;
}

/**
 * Get image dimensions
 */
export const getImageDimensions = async (filePath: string): Promise<ImageDimensions> => {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return { width: 0, height: 0 };
  }
};

/**
 * Resize image maintaining aspect ratio
 */
export const resizeImage = async (
  inputPath: string,
  outputPath: string,
  maxWidth: number,
  maxHeight: number,
  quality: number = 80
): Promise<ImageDimensions> => {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let resizeOptions: any = {
      withoutEnlargement: true, // Don't enlarge if smaller than max dimensions
      fit: 'inside' // Maintain aspect ratio
    };

    // Only resize if image is larger than max dimensions
    if (metadata.width && metadata.width > maxWidth) {
      resizeOptions.width = maxWidth;
    }
    if (metadata.height && metadata.height > maxHeight) {
      resizeOptions.height = maxHeight;
    }

    const processedImage = image.resize(resizeOptions);

    // Convert to JPEG for better compression, maintain original format if already JPEG
    if (metadata.format !== 'jpeg') {
      processedImage.jpeg({ quality });
    }

    await processedImage.toFile(outputPath);

    const newMetadata = await sharp(outputPath).metadata();
    return {
      width: newMetadata.width || 0,
      height: newMetadata.height || 0
    };
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
};

/**
 * Create thumbnail
 */
export const createThumbnail = async (
  inputPath: string,
  outputPath: string,
  size: number = 150,
  quality: number = 70
): Promise<ImageDimensions> => {
  try {
    const image = sharp(inputPath);

    // Create square thumbnail
    await image
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality })
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();
    return {
      width: metadata.width || size,
      height: metadata.height || size
    };
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw error;
  }
};

/**
 * Optimize image for web
 */
export const optimizeImage = async (
  inputPath: string,
  outputPath: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult> => {
  try {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 80,
      format = 'jpeg',
      generateThumbnail = true,
      thumbnailSize = 150
    } = options;

    // Get original dimensions
    const originalDimensions = await getImageDimensions(inputPath);

    // Resize image
    const processedPath = outputPath;
    const newDimensions = await resizeImage(inputPath, processedPath, maxWidth, maxHeight, quality);

    // Create thumbnail if requested
    let thumbnailPath: string | undefined;
    if (generateThumbnail) {
      const thumbnailFileName = path.basename(processedPath, path.extname(processedPath)) + '_thumb.jpg';
      thumbnailPath = path.join(path.dirname(processedPath), thumbnailFileName);
      await createThumbnail(processedPath, thumbnailPath, thumbnailSize, 70);
    }

    // Get file size
    const stats = await FileUploadService.getFileStats(processedPath);
    const fileSize = stats?.size || 0;

    return {
      originalPath: inputPath,
      processedPath,
      thumbnailPath,
      dimensions: newDimensions,
      fileSize,
      format
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
};

/**
 * Convert image format
 */
export const convertImageFormat = async (
  inputPath: string,
  outputPath: string,
  format: 'jpeg' | 'png' | 'webp',
  quality: number = 80
): Promise<void> => {
  try {
    const image = sharp(inputPath);

    switch (format) {
      case 'jpeg':
        await image.jpeg({ quality }).toFile(outputPath);
        break;
      case 'png':
        await image.png({ quality }).toFile(outputPath);
        break;
      case 'webp':
        await image.webp({ quality }).toFile(outputPath);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    console.error('Error converting image format:', error);
    throw error;
  }
};

/**
 * Generate multiple sizes for responsive images
 */
export const generateResponsiveImages = async (
  inputPath: string,
  outputDir: string,
  baseName: string,
  sizes: number[] = [400, 800, 1200]
): Promise<Array<{ path: string; width: number; size: number }>> => {
  try {
    const results: Array<{ path: string; width: number; size: number }> = [];

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `${baseName}_${size}.jpg`);
      const dimensions = await resizeImage(inputPath, outputPath, size, size);

      const stats = await FileUploadService.getFileStats(outputPath);
      const fileSize = stats?.size || 0;

      results.push({
        path: outputPath,
        width: dimensions.width,
        size: fileSize
      });
    }

    return results;
  } catch (error) {
    console.error('Error generating responsive images:', error);
    throw error;
  }
};

/**
 * Validate image integrity
 */
export const validateImageIntegrity = async (filePath: string): Promise<boolean> => {
  try {
    // Try to get metadata - if this fails, image is corrupted
    const metadata = await sharp(filePath).metadata();
    return !!(metadata.width && metadata.height && metadata.format);
  } catch (error) {
    console.error('Image integrity validation failed:', error);
    return false;
  }
};

/**
 * Get image format info
 */
export const getImageFormat = async (filePath: string): Promise<string | null> => {
  try {
    const metadata = await sharp(filePath).metadata();
    return metadata.format || null;
  } catch (error) {
    console.error('Error getting image format:', error);
    return null;
  }
};

/**
 * Compress image for storage efficiency
 */
export const compressImage = async (
  inputPath: string,
  outputPath: string,
  targetSizeKB: number = 500
): Promise<ProcessedImageResult> => {
  try {
    let quality = 80;
    let dimensions = await getImageDimensions(inputPath);
    let fileSize = (await FileUploadService.getFileStats(inputPath))?.size || 0;

    // Binary search for optimal quality to reach target size
    let minQuality = 10;
    let maxQuality = 95;
    let bestQuality = quality;

    while (minQuality <= maxQuality && fileSize > targetSizeKB * 1024) {
      quality = Math.floor((minQuality + maxQuality) / 2);

      await resizeImage(inputPath, outputPath, dimensions.width, dimensions.height, quality);

      const newStats = await FileUploadService.getFileStats(outputPath);
      const newSize = newStats?.size || 0;

      if (newSize <= targetSizeKB * 1024) {
        bestQuality = quality;
        minQuality = quality + 1;
        fileSize = newSize;
      } else {
        maxQuality = quality - 1;
      }
    }

    // Final compression with best quality found
    const finalDimensions = await resizeImage(inputPath, outputPath, dimensions.width, dimensions.height, bestQuality);
    const finalStats = await FileUploadService.getFileStats(outputPath);
    const finalSize = finalStats?.size || 0;

    return {
      originalPath: inputPath,
      processedPath: outputPath,
      dimensions: finalDimensions,
      fileSize: finalSize,
      format: 'jpeg'
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

export default {
  getImageDimensions,
  resizeImage,
  createThumbnail,
  optimizeImage,
  convertImageFormat,
  generateResponsiveImages,
  validateImageIntegrity,
  getImageFormat,
  compressImage
};
