/**
 * API Client for MathMentor Backend
 * Handles HTTP requests with automatic token management and error handling
 */

import type { ApiResponse } from "@/types/auth";
import {
  shouldUseEncryption,
  encryptRequest,
  decryptResponse
} from "@/utils/encryption";

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

export class ApiClientError extends Error {
  public status: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  retries?: number;
  encrypt?: boolean; // Enable encryption for this request
}


class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load tokens from localStorage (persists across sessions, cleared manually)
    this.loadTokens();
  }

  /**
   * Load tokens from localStorage (cross-tab persistence)
   */
  private loadTokens(): void {
    try {
      const tokens = localStorage.getItem('mathmentor_auth_tokens');
      if (tokens) {
        const parsed: { accessToken: string; refreshToken?: string } = JSON.parse(tokens);
        this.accessToken = parsed.accessToken;
        this.refreshToken = parsed.refreshToken || null;
        console.log('🔄 Auth tokens restored from localStorage');
      }
    } catch (error) {
      console.warn('Failed to load auth tokens:', error);
    }
  }

  /**
   * Save tokens to localStorage (cross-tab persistence)
   */
  private saveTokens(accessToken: string, refreshToken?: string): void {
    try {
      const tokens = { accessToken, refreshToken };
      localStorage.setItem('mathmentor_auth_tokens', JSON.stringify(tokens));
      this.accessToken = accessToken;
      this.refreshToken = refreshToken || null;
      console.log('💾 Auth tokens saved to localStorage');
    } catch (error) {
      console.error('Failed to save auth tokens:', error);
    }
  }

  /**
   * Set tokens with cross-tab persistence
   */
  public setTokens(accessToken: string, refreshToken?: string): void {
    this.saveTokens(accessToken, refreshToken);
  }

  /**
   * Clear tokens from memory and localStorage
   */
  public clearTokens(): void {
    console.log('🗑️ Clearing auth tokens');
    this.accessToken = null;
    this.refreshToken = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    try {
      localStorage.removeItem('mathmentor_auth_tokens');
    } catch (error) {
      console.warn('Failed to clear auth tokens:', error);
    }
  }


  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Get the current access token
   */
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new ApiClientError('No refresh token available', 401);
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      const data: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();

      if (!response.ok || !data.success) {
        throw new ApiClientError(data.error || 'Token refresh failed', response.status);
      }

      // Update tokens
      this.setTokens(data.data!.accessToken, data.data!.refreshToken);
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Handle token refresh with concurrency control
   */
  private async handleTokenRefresh(): Promise<void> {
    if (this.isRefreshing) {
      // Wait for ongoing refresh
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshAccessToken()
      .finally(() => {
        this.isRefreshing = false;
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  /**
   * Make HTTP request with automatic token handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {},
    retryCount = 0
  ): Promise<T> {
    console.log(`🌐 API CLIENT: Making request to ${endpoint}`);

    const { skipAuth = false, retries = 1, encrypt: shouldEncrypt = false, ...fetchOptions } = options;

    // Prepare headers
    const headers: Record<string, string> = {};

    // Check if we should encrypt this request
    const useEncryption = shouldEncrypt || shouldUseEncryption();

    // Handle request body encryption
    let requestBody = fetchOptions.body;
    if (useEncryption && requestBody && !(requestBody instanceof FormData)) {
      try {
        // Parse the JSON body
        const bodyData = typeof requestBody === 'string' ? JSON.parse(requestBody) : requestBody;
        
        // Encrypt the body
        const encryptedData = await encryptRequest(bodyData);
        
        // Replace body with encrypted data
        requestBody = JSON.stringify(encryptedData);
        
        // Set encryption header
        headers['X-Encrypted'] = 'true';
        headers['X-Request-Encryption'] = 'true';
      } catch (error) {
        console.error('Request encryption failed:', error);
        // Fall back to unencrypted request
      }
    }

    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (!(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // DISABLE ALL CACHING - Prevent any browser or proxy caching
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';

    // Add any additional headers
    Object.assign(headers, (fetchOptions.headers as Record<string, string>) || {});

    // Add authorization header if not skipping auth and token exists
    if (!skipAuth && this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        body: requestBody,
        headers,
      });

      // Handle token expiration
      if (response.status === 401 && !skipAuth && this.refreshToken && retryCount === 0) {
        try {
          await this.handleTokenRefresh();
          // Retry the request with new token
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        } catch (refreshError) {
          // Token refresh failed, clear tokens and notify app
          this.clearTokens();
          // Dispatch custom event to notify AuthContext of auth failure
          window.dispatchEvent(new CustomEvent('auth:expired'));
          throw new ApiClientError('Authentication expired', 401);
        }
      }

      // Handle other 401 errors (not related to token refresh)
      if (response.status === 401 && !skipAuth) {
        // Clear tokens and notify app
        this.clearTokens();
        // Dispatch custom event to notify AuthContext of auth failure
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new ApiClientError('Authentication required', 401);
      }

      // Handle other HTTP errors
      if (!response.ok) {
        console.log(`❌ API CLIENT: Request failed with status ${response.status} for ${endpoint}`);
        let errorMessage = `HTTP ${response.status}`;
        let errorCode: string | undefined;
        let errorDetails: any;

        try {
          const errorData: any = await response.json();
          console.log('❌ API CLIENT: Error response:', errorData);
          errorMessage = errorData.error || errorMessage;
          errorCode = errorData.code;
          errorDetails = errorData;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }

        throw new ApiClientError(errorMessage, response.status, errorCode, errorDetails);
      }

      // Parse successful response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data: ApiResponse<T> = await response.json();

        // Check if response is encrypted
        const xEncryptedHeader = response.headers.get('X-Encrypted') || response.headers.get('x-encrypted');
        const isEncrypted = xEncryptedHeader === 'true';

        if (isEncrypted && useEncryption) {
          try {
            // Decrypt the response
            const decryptedData = await decryptResponse(data as any);

            if (!decryptedData.success) {
              throw new ApiClientError(decryptedData.error || 'Request failed', response.status);
            }

            return decryptedData.data!;
          } catch (error) {
            console.error('Response decryption failed:', error);
            throw new ApiClientError('Failed to decrypt response', response.status);
          }
        }

        if (!data.success) {
          console.log(`❌ API CLIENT: Server returned error for ${endpoint}:`, data.error);
          throw new ApiClientError(data.error || 'Request failed', response.status);
        }

        console.log(`✅ API CLIENT: Request successful for ${endpoint}, response:`, data.data);
        return data.data!;
      } else {
        // Return response for non-JSON responses (like file downloads)
        return response as unknown as T;
      }
    } catch (error) {
      // Handle network errors and retries
      if (error instanceof TypeError && error.message.includes('fetch') && retryCount < retries) {
        console.warn(`Network error, retrying (${retryCount + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.makeRequest<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Upload file with additional data
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const headers: Record<string, string> = {};

    // Add authorization header if token exists
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData: ApiResponse<any> = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiClientError(errorMessage, response.status);
    }

    const data: ApiResponse<T> = await response.json();
    if (!data.success) {
      throw new ApiClientError(data.error || 'Upload failed', response.status);
    }

    return data.data!;
  }

  /**
   * Upload FormData (for complex forms with multiple fields)
   */
  async uploadFormData<T>(endpoint: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
    const headers: Record<string, string> = {};

    // Add authorization header if token exists
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    // Check if encryption should be used
    const shouldEncrypt = headers['X-Encrypted'] === 'true';
    const useEncryption = shouldEncrypt || shouldUseEncryption();

    const response = await fetch(url, {
      method,
      headers,
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData: ApiResponse<any> = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiClientError(errorMessage, response.status);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response JSON:', parseError);
      throw new ApiClientError('Invalid JSON response from server', response.status);
    }

    // Check if response is encrypted
    const xEncryptedHeader = response.headers.get('X-Encrypted') || response.headers.get('x-encrypted');
    const isEncrypted = xEncryptedHeader === 'true';

    if (isEncrypted && useEncryption) {
      try {
        // Decrypt the response
        const decryptedData = await decryptResponse(data);

        if (!decryptedData.success) {
          throw new ApiClientError(decryptedData.error || 'Upload failed', response.status);
        }

        return decryptedData.data!;
      } catch (error) {
        console.error('Response decryption failed:', error);
        throw new ApiClientError('Failed to decrypt response', response.status);
      }
    }

    // Handle unencrypted response
    if (!data.success) {
      throw new ApiClientError(data.error || 'Upload failed', response.status);
    }

    return data.data!;
  }
}

// Create and export singleton instance
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('🌐 API CLIENT: Using base URL:', API_BASE_URL);
const apiClient = new ApiClient(API_BASE_URL);

export default apiClient;
export { ApiClient };

