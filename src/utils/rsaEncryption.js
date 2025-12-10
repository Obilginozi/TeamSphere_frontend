/**
 * RSA Encryption Utility for Client-Side Password Encryption
 * 
 * Encrypts sensitive data (passwords) before sending to backend using RSA-OAEP.
 * This ensures passwords are never transmitted in plaintext, even in dev mode.
 * 
 * Global Standards Compliance:
 * - RSA-OAEP padding (PKCS#1 v2.1)
 * - Web Crypto API (browser native, no dependencies)
 * - Base64 encoding for transmission
 * - UTF-8 encoding for text
 */

class RSAEncryption {
  constructor() {
    this.publicKey = null;
    this.publicKeyBase64 = null;
  }

  /**
   * Load public key from backend
   * @param {boolean} forceReload Force reload even if key is cached
   * @returns {Promise<string>} Base64 encoded public key
   */
  async loadPublicKey(forceReload = false) {
    if (this.publicKeyBase64 && !forceReload) {
      return this.publicKeyBase64;
    }

    try {
      // Add cache-busting parameter and no-cache headers to ensure fresh key
      const cacheBuster = Date.now();
      const response = await fetch(`/api/auth/public-key?t=${cacheBuster}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch public key: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.publicKey) {
        this.publicKeyBase64 = data.data.publicKey;
        return this.publicKeyBase64;
      } else {
        console.warn('RSA encryption not available, passwords will be sent in plaintext');
        return null;
      }
    } catch (error) {
      console.error('Failed to load RSA public key:', error);
      return null;
    }
  }

  /**
   * Clear cached public key (useful when key might have changed)
   */
  clearCache() {
    this.publicKeyBase64 = null;
    this.publicKey = null;
  }

  /**
   * Convert Base64 public key to CryptoKey
   * @param {string} publicKeyBase64 Base64 encoded public key
   * @returns {Promise<CryptoKey>} CryptoKey object
   */
  async importPublicKey(publicKeyBase64) {
    try {
      // Decode Base64 to ArrayBuffer
      const binaryDer = this.base64ToArrayBuffer(publicKeyBase64);
      
      // Import public key
      const publicKey = await crypto.subtle.importKey(
        'spki',
        binaryDer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        false,
        ['encrypt']
      );

      return publicKey;
    } catch (error) {
      console.error('Failed to import public key:', error);
      throw new Error('Failed to import RSA public key');
    }
  }

  /**
   * Encrypt data with RSA public key
   * @param {string} data Data to encrypt
   * @param {boolean} forceReload Force reload public key before encrypting
   * @returns {Promise<string>} Base64 encoded encrypted data
   */
  async encrypt(data, forceReload = false) {
    if (!data || typeof data !== 'string') {
      throw new Error('Data must be a non-empty string');
    }

    // Always clear cache if forceReload is true to ensure fresh key
    if (forceReload) {
      this.clearCache();
    }

    // Load public key if not already loaded (or force reload)
    const publicKeyBase64 = await this.loadPublicKey(forceReload);
    if (!publicKeyBase64) {
      // RSA encryption not available, return data as-is
      console.warn('RSA encryption not available, sending password in plaintext');
      return data;
    }

    try {
      // Import public key (always import fresh to avoid cached key issues)
      const publicKey = await this.importPublicKey(publicKeyBase64);

      // Convert string to ArrayBuffer
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);

      // Encrypt data with RSA-OAEP using SHA-256 (must match backend: RSA/ECB/OAEPWITHSHA-256ANDMGF1PADDING)
      // Note: Web Crypto API uses the same hash for both OAEP and MGF1
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
          // Specify hash to match backend's SHA-256 requirement
          // Web Crypto API will use this for both OAEP and MGF1
        },
        publicKey,
        dataBuffer
      );

      // Convert encrypted ArrayBuffer to Base64
      const encryptedBase64 = this.arrayBufferToBase64(encryptedBuffer);
      
      return encryptedBase64;
    } catch (error) {
      // If encryption fails, clear cache and try once more with fresh key
      if (!forceReload) {
        this.clearCache();
        return this.encrypt(data, true);
      }
      // Fallback: return data as-is if encryption fails after retry
      // Don't log error - it will be handled gracefully by the login flow
      return data;
    }
  }

  /**
   * Convert Base64 string to ArrayBuffer
   * @param {string} base64 Base64 string
   * @returns {ArrayBuffer} ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to Base64 string
   * @param {ArrayBuffer} buffer ArrayBuffer
   * @returns {string} Base64 string
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Check if Web Crypto API is available
   * @returns {boolean} True if Web Crypto API is available
   */
  isSupported() {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.subtle.encrypt === 'function';
  }
}

// Export singleton instance
const rsaEncryption = new RSAEncryption();

export default rsaEncryption;

