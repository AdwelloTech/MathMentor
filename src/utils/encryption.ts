/**
 * Frontend Encryption Utility
 * Provides end-to-end encryption for sensitive API communications
 * Uses Web Crypto API for AES-256-GCM encryption
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 16; // 128 bits

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hexString: string): Uint8Array {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to hex string
 */
function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get or generate encryption key
 * In production, this should be derived from a secure key exchange
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Get key from environment or generate
  const envKey = import.meta.env.VITE_ENCRYPTION_KEY;
  
  let keyMaterial: Uint8Array;
  
  if (envKey) {
    // Use provided key
    keyMaterial = hexToUint8Array(envKey);
  } else {
    // Generate a random key (for development only)
    console.warn('⚠️  No VITE_ENCRYPTION_KEY found. Using random key for this session.');
    keyMaterial = crypto.getRandomValues(new Uint8Array(32));
  }
  
  // Import key for AES-GCM
  return await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-256-GCM (compatible with Node.js crypto)
 */
export async function encrypt(data: string | object): Promise<{
  encrypted: string;
  iv: string;
  authTag: string;
}> {
  try {
    // Convert to string if object
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);

    // Get encryption key
    const key = await getEncryptionKey();

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encode plaintext
    const encodedText = new TextEncoder().encode(plaintext);

    // Encrypt using Web Crypto API
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: 128 // 128-bit auth tag
      },
      key,
      encodedText
    );

    // Web Crypto API returns ciphertext + auth tag concatenated
    // We need to split them to match Node.js crypto format
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const authTagLength = 16; // 128 bits = 16 bytes
    const ciphertext = encryptedArray.slice(0, -authTagLength);
    const authTag = encryptedArray.slice(-authTagLength);

    return {
      encrypted: uint8ArrayToHex(ciphertext),
      iv: uint8ArrayToHex(iv),
      authTag: uint8ArrayToHex(authTag)
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decrypt(
  encrypted: string,
  iv: string,
  authTag: string
): Promise<string> {
  try {
    // Get encryption key
    const key = await getEncryptionKey();
    
    // Convert hex strings to Uint8Array
    const ivArray = hexToUint8Array(iv);
    const ciphertext = hexToUint8Array(encrypted);
    const authTagArray = hexToUint8Array(authTag);
    
    // Combine ciphertext and auth tag (GCM expects them together)
    const encryptedData = new Uint8Array(ciphertext.length + authTagArray.length);
    encryptedData.set(ciphertext);
    encryptedData.set(authTagArray, ciphertext.length);
    
    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivArray,
        tagLength: 128
      },
      key,
      encryptedData
    );
    
    // Decode to string
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if encryption is enabled
 */
export function isEncryptionEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_ENCRYPTION === 'true';
}

/**
 * Check if encryption should be used globally
 */
export function shouldUseEncryption(): boolean {
  return import.meta.env.VITE_ENABLE_ENCRYPTION === 'true';
}

/**
 * Encrypt request payload
 */
export async function encryptRequest(payload: any): Promise<{
  encrypted: string;
  iv: string;
  authTag: string;
}> {
  return await encrypt(payload);
}

/**
 * Decrypt response payload
 */
export async function decryptResponse(response: {
  encrypted: string;
  iv: string;
  authTag: string;
}): Promise<any> {
  const decryptedStr = await decrypt(
    response.encrypted,
    response.iv,
    response.authTag
  );
  
  try {
    return JSON.parse(decryptedStr);
  } catch {
    return decryptedStr;
  }
}

/**
 * Hash data using SHA-256 (one-way)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  return uint8ArrayToHex(hashArray);
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return uint8ArrayToHex(bytes);
}

/**
 * Secure comparison to prevent timing attacks
 */
export async function secureCompare(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) {
    return false;
  }
  
  // Hash both strings to make comparison constant-time
  const hashA = await hashData(a);
  const hashB = await hashData(b);
  
  return hashA === hashB;
}

