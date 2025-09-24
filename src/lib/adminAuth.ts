export interface AdminLoginResponse {
  success: boolean;
  admin_id?: string;
  access_token?: string;
  refresh_token?: string;
  message: string;
}

export interface AdminSession {
  valid: boolean;
  admin_id?: string;
  admin_email?: string;
}

export class AdminAuthService {
  private static sessionTokenKey = "admin_session_token";

  // Login admin with backend API
  static async loginAdmin(
    email: string,
    password: string
  ): Promise<AdminLoginResponse> {
    try {
      console.log("Attempting admin login for:", email);

      // Import apiClient dynamically to avoid circular imports
      const apiClient = (await import('./apiClient')).default;

      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          firstName: string;
          lastName: string;
          fullName: string;
          email: string;
          role: string;
          avatarUrl?: string;
        };
      }>('/api/auth/admin/login', { email, password }, { skipAuth: true });

      console.log("Admin login API response:", response);

      // Store tokens
      apiClient.setTokens(response.accessToken, response.refreshToken);
      localStorage.setItem(this.sessionTokenKey, response.accessToken);

      console.log("Admin session created and stored");

      return {
        success: true,
        admin_id: response.user.id,
        access_token: response.accessToken,
        refresh_token: response.refreshToken,
        message: "Login successful",
      };
    } catch (error) {
      console.error("Admin login error:", error);
      return {
        success: false,
        message: `Login failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }


  // Validate current session
  static async validateSession(): Promise<AdminSession> {
    try {
      const sessionToken = localStorage.getItem(this.sessionTokenKey);

      if (!sessionToken) {
        console.log("No session token found in localStorage");
        return { valid: false };
      }

      console.log("Validating admin session...");

      // Import apiClient dynamically to avoid circular imports
      const apiClient = (await import('./apiClient')).default;

      const response = await apiClient.get<{
        valid: boolean;
        admin_id: string;
        admin_email: string;
      }>('/api/auth/admin/validate-session');

      console.log("Session validation API response:", response);

      if (!response.valid) {
        console.log("Session is invalid, clearing localStorage");
        localStorage.removeItem(this.sessionTokenKey);
        apiClient.clearTokens();
      }

      return {
        valid: response.valid,
        admin_id: response.admin_id,
        admin_email: response.admin_email,
      };
    } catch (error) {
      console.error("Session validation error:", error);
      localStorage.removeItem(this.sessionTokenKey);
      return { valid: false };
    }
  }

  // Logout admin
  static async logout(): Promise<boolean> {
    try {
      const sessionToken = localStorage.getItem(this.sessionTokenKey);

      if (sessionToken) {
        console.log("Logging out admin session...");

      // Import apiClient dynamically to avoid circular imports
      const apiClient = (await import('./apiClient')).default;

        try {
          // Get refresh token from localStorage
          const tokens = localStorage.getItem('mathmentor_tokens');
          if (tokens) {
            const { refreshToken } = JSON.parse(tokens);
            if (refreshToken) {
              await apiClient.post('/api/auth/admin/logout', { refreshToken });
              console.log("Admin session logged out successfully");
            }
          }
        } catch (error) {
          console.error("Logout API error:", error);
          // Continue with local cleanup even if API call fails
        }
      }

      // Clear local storage and tokens
      localStorage.removeItem(this.sessionTokenKey);
      const apiClient = (await import('./apiClient')).default;
      apiClient.clearTokens();
      console.log("LocalStorage and tokens cleared");

      return true;
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem(this.sessionTokenKey);
      return false;
    }
  }

  // Get current session token
  static getSessionToken(): string | null {
    return localStorage.getItem(this.sessionTokenKey);
  }

  // Check if admin is logged in
  static isLoggedIn(): boolean {
    return !!localStorage.getItem(this.sessionTokenKey);
  }

}
