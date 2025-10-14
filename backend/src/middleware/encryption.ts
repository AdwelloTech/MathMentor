import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Request/Response Encryption Middleware
 * Provides end-to-end encryption for sensitive API endpoints
 */

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (envKey) {
    // Ensure key is proper length
    const key = Buffer.from(envKey, 'hex');
    if (key.length === KEY_LENGTH) {
      return key;
    }
    // Hash the key to get proper length
    return crypto.createHash('sha256').update(envKey).digest();
  }
  
  // Generate a new key (should be saved to env in production)
  const newKey = crypto.randomBytes(KEY_LENGTH);
  console.warn('⚠️  WARNING: Using generated encryption key. Set ENCRYPTION_KEY in .env for production!');
  console.warn(`Generated key: ${newKey.toString('hex')}`);
  return newKey;
}

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypt data using AES-256-GCM (compatible with Web Crypto API)
 */
export function encrypt(data: string | object): { 
  encrypted: string; 
  iv: string; 
  authTag: string;
} {
  try {
    // Convert to string if object
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM (compatible with Web Crypto API)
 */
export function decrypt(
  encrypted: string,
  iv: string,
  authTag: string
): string {
  try {
    // Create decipher
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      ENCRYPTION_KEY,
      Buffer.from(iv, 'hex')
    );
    
    // Set auth tag
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'hex')),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Middleware to decrypt incoming encrypted requests
 */
export const decryptRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if request is encrypted
    const isEncrypted = req.headers['x-encrypted'] === 'true';
    
    if (!isEncrypted) {
      // Request is not encrypted, proceed normally
      return next();
    }
    
    const { encrypted, iv, authTag } = req.body;
    
    if (!encrypted || !iv || !authTag) {
      res.status(400).json({
        success: false,
        error: 'Invalid encrypted request format'
      });
      return;
    }
    
    // Decrypt the payload
    const decryptedStr = decrypt(encrypted, iv, authTag);
    const decryptedData = JSON.parse(decryptedStr);
    
    // Replace body with decrypted data
    req.body = decryptedData;
    
    // Mark request as originally encrypted
    (req as any).wasEncrypted = true;
    
    next();
  } catch (error: any) {
    console.error('Request decryption error:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to decrypt request'
    });
  }
};

/**
 * Middleware to encrypt outgoing responses
 */
export const encryptResponse = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if encryption is enabled globally
  const encryptionEnabled = process.env.ENABLE_ENCRYPTION === 'true';

  if (!encryptionEnabled) {
    return next();
  }

  // All responses are encrypted when encryption is enabled globally
  // (or when specific headers indicate encryption is requested)
  const shouldEncrypt =
    req.headers['x-request-encryption'] === 'true' ||
    (req as any).wasEncrypted ||
    encryptionEnabled; // Always encrypt when globally enabled

  if (!shouldEncrypt) {
    return next();
  }
  
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to encrypt response
  res.json = function(body: any): Response {
    try {
      // Encrypt the response
      const encrypted = encrypt(body);

      // Set header to indicate encrypted response
      res.setHeader('X-Encrypted', 'true');

      // Send encrypted response
      const encryptedResponse = {
        encrypted: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag
      };
      return originalJson(encryptedResponse);
    } catch (error) {
      console.error('Response encryption error:', error);
      // Fallback to unencrypted response
      return originalJson(body);
    }
  };
  
  next();
};

/**
 * Encrypt sensitive data in response (selective encryption)
 */
export const encryptSensitiveFields = (
  fields: string[]
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);
    
    res.json = function(body: any): Response {
      try {
        if (body && typeof body === 'object') {
          const encryptedBody = { ...body };
          
          // Encrypt specified fields
          fields.forEach(field => {
            if (body[field]) {
              const encrypted = encrypt(body[field]);
              encryptedBody[field] = {
                encrypted: encrypted.encrypted,
                iv: encrypted.iv,
                authTag: encrypted.authTag,
                _encrypted: true
              };
            }
          });
          
          return originalJson(encryptedBody);
        }
        
        return originalJson(body);
      } catch (error) {
        console.error('Selective encryption error:', error);
        return originalJson(body);
      }
    };
    
    next();
  };
};

/**
 * Hash sensitive data (one-way)
 */
export function hashData(data: string): string {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto
    .randomBytes(length)
    .toString('hex');
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
}

