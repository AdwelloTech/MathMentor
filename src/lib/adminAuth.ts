import { supabase } from './supabase';

export interface AdminLoginResponse {
  success: boolean;
  admin_id?: string;
  session_token?: string;
  message: string;
}

export interface AdminSession {
  valid: boolean;
  admin_id?: string;
  admin_email?: string;
}

export class AdminAuthService {
  private static sessionTokenKey = 'admin_session_token';

  // Login admin with database verification
  static async loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
    try {
      console.log('Attempting admin login for:', email);
      
      const { data, error } = await supabase.rpc('verify_admin_credentials', {
        p_email: email,
        p_password: password
      });

      if (error) {
        console.error('Admin login RPC error:', error);
        return {
          success: false,
          message: `Database error: ${error.message}`
        };
      }

      console.log('Admin login RPC response:', data);

      if (!data || data.length === 0) {
        console.log('No data returned from verify_admin_credentials');
        return {
          success: false,
          message: 'Invalid credentials'
        };
      }

      const result = data[0];
      console.log('Admin verification result:', result);
      
      if (!result.success) {
        return {
          success: false,
          message: result.message || 'Login failed'
        };
      }

      // Create session
      console.log('Creating admin session for admin_id:', result.admin_id);
      const sessionResult = await this.createSession(result.admin_id);
      
      if (!sessionResult.success) {
        console.error('Session creation failed:', sessionResult);
        return {
          success: false,
          message: 'Failed to create session'
        };
      }

      // Store session token
      localStorage.setItem(this.sessionTokenKey, sessionResult.session_token!);
      console.log('Admin session created and stored');

      return {
        success: true,
        admin_id: result.admin_id,
        session_token: sessionResult.session_token,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Admin login error:', error);
      return {
        success: false,
        message: `Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Create admin session
  private static async createSession(adminId: string): Promise<{ success: boolean; session_token?: string; message?: string }> {
    try {
      console.log('Creating session for admin_id:', adminId);
      
      // Call the function with only the required parameters to avoid overloading issues
      const { data, error } = await supabase.rpc('create_admin_session', {
        p_admin_id: adminId
        // Remove optional parameters to avoid function overloading
      });

      if (error) {
        console.error('Session creation RPC error:', error);
        return { 
          success: false, 
          message: `Session creation error: ${error.message}` 
        };
      }

      console.log('Session creation RPC response:', data);

      if (!data || data.length === 0) {
        console.log('No data returned from create_admin_session');
        return { 
          success: false, 
          message: 'No session data returned' 
        };
      }

      const result = data[0];
      console.log('Session creation result:', result);

      if (!result.success) {
        return { 
          success: false, 
          message: result.message || 'Session creation failed' 
        };
      }

      return {
        success: true,
        session_token: result.session_token
      };
    } catch (error) {
      console.error('Session creation error:', error);
      return { 
        success: false, 
        message: `Session creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Validate current session
  static async validateSession(): Promise<AdminSession> {
    try {
      const sessionToken = localStorage.getItem(this.sessionTokenKey);
      
      if (!sessionToken) {
        console.log('No session token found in localStorage');
        return { valid: false };
      }

      console.log('Validating session token...');
      
      const { data, error } = await supabase.rpc('validate_admin_session', {
        p_session_token: sessionToken
      });

      if (error) {
        console.error('Session validation RPC error:', error);
        return { valid: false };
      }

      console.log('Session validation RPC response:', data);

      if (!data || data.length === 0) {
        console.log('No data returned from validate_admin_session');
        return { valid: false };
      }

      const result = data[0];
      console.log('Session validation result:', result);
      
      if (!result.valid) {
        console.log('Session is invalid, clearing localStorage');
        localStorage.removeItem(this.sessionTokenKey);
      }

      return {
        valid: result.valid,
        admin_id: result.admin_id,
        admin_email: result.admin_email
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  // Logout admin
  static async logout(): Promise<boolean> {
    try {
      const sessionToken = localStorage.getItem(this.sessionTokenKey);
      
      if (sessionToken) {
        console.log('Logging out admin session...');
        
        const { error } = await supabase.rpc('logout_admin_session', {
          p_session_token: sessionToken
        });

        if (error) {
          console.error('Logout RPC error:', error);
        } else {
          console.log('Admin session logged out successfully');
        }
      }

      // Clear local storage
      localStorage.removeItem(this.sessionTokenKey);
      console.log('LocalStorage cleared');
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
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

  // Clean expired sessions (utility function)
  static async cleanExpiredSessions(): Promise<number> {
    try {
      console.log('Cleaning expired sessions...');
      
      const { data, error } = await supabase.rpc('clean_expired_sessions');

      if (error) {
        console.error('Clean sessions RPC error:', error);
        return 0;
      }

      console.log('Expired sessions cleaned:', data);
      return data || 0;
    } catch (error) {
      console.error('Clean sessions error:', error);
      return 0;
    }
  }
} 