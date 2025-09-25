/**
 * API Client for MathMentor Backend
 * Handles HTTP requests with automatic token management and error handling
 */

import type { ApiResponse } from "@/types/auth";

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
}

interface Tokens {
  accessToken: string;
  refreshToken?: string;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadTokens();
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokens(): void {
    try {
      const tokens = localStorage.getItem('mathmentor_tokens');
      if (tokens) {
        const parsed: Tokens = JSON.parse(tokens);
        this.accessToken = parsed.accessToken;
        this.refreshToken = parsed.refreshToken || null;
      }
    } catch (error) {
      console.warn('Failed to load tokens from localStorage:', error);
    }
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokens(tokens: Tokens): void {
    try {
      localStorage.setItem('mathmentor_tokens', JSON.stringify(tokens));
      this.accessToken = tokens.accessToken;
      this.refreshToken = tokens.refreshToken || null;
    } catch (error) {
      console.error('Failed to save tokens to localStorage:', error);
    }
  }

  /**
   * Clear tokens from memory and localStorage
   */
  public clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      localStorage.removeItem('mathmentor_tokens');
    } catch (error) {
      console.warn('Failed to clear tokens from localStorage:', error);
    }
  }

  /**
   * Set authentication tokens
   */
  public setTokens(accessToken: string, refreshToken?: string): void {
    this.saveTokens({ accessToken, refreshToken });
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.accessToken;
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
    const { skipAuth = false, retries = 1, ...fetchOptions } = options;

    // Prepare headers
    const headers: Record<string, string> = {};

    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (!(fetchOptions.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

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
        let errorMessage = `HTTP ${response.status}`;
        let errorCode: string | undefined;
        let errorDetails: any;

        try {
          const errorData: ApiResponse<any> = await response.json();
          errorMessage = errorData.error || errorMessage;
          // Note: code and details are not part of ApiResponse interface
          // They might be added later if needed
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

        if (!data.success) {
          throw new ApiClientError(data.error || 'Request failed', response.status);
        }

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

    const data: ApiResponse<T> = await response.json();
    if (!data.success) {
      throw new ApiClientError(data.error || 'Upload failed', response.status);
    }

    return data.data!;
  }
}

// Create and export singleton instance
const apiClient = new ApiClient(import.meta.env.VITE_API_URL || 'http://localhost:5000');

export default apiClient;
export { ApiClient };
