// apps/web/src/lib/adminAuth.ts
import { supabase } from "./supabase";

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

type AnyObj = Record<string, any>;

export class AdminAuthService {
  private static sessionTokenKey = "admin_session_token";
  private static profileKey = "admin_profile";

  // ---------------------------- helpers ----------------------------
  private static saveToken(token: string) {
    localStorage.setItem(this.sessionTokenKey, token);
  }
  private static loadToken(): string | null {
    return localStorage.getItem(this.sessionTokenKey);
  }
  private static clearToken() {
    localStorage.removeItem(this.sessionTokenKey);
  }
  private static saveProfile(p: AnyObj | null) {
    if (p) localStorage.setItem(this.profileKey, JSON.stringify(p));
    else localStorage.removeItem(this.profileKey);
  }
  private static loadProfile(): AnyObj | null {
    try {
      const s = localStorage.getItem(this.profileKey);
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }
  private static genToken() {
    // lightweight client-side token
    const rand = Math.random().toString(36).slice(2);
    return `${Date.now().toString(36)}.${rand}`;
    // (If you prefer crypto-strength in modern browsers:)
    // const a = new Uint8Array(16); crypto.getRandomValues(a);
    // return Array.from(a, x => x.toString(16).padStart(2, "0")).join("");
  }

  // ----------------------------- LOGIN -----------------------------
  static async loginAdmin(email: string, password: string): Promise<AdminLoginResponse> {
    try {
      console.log("Attempting admin login for:", email);

      // Our supabase.ts maps this RPC to POST /api/admin/verify_credentials
      const { data, error } = await supabase.rpc("verify_admin_credentials", {
        p_email: email,
        p_password: password,
      });

      if (error) {
        console.error("Admin login RPC error:", error);
        return { success: false, message: `Database error: ${error.message}` };
      }

      // API shape: { ok: true, data: { valid: boolean, profile?: {} } }
      const raw = data as any;
      console.log("Admin login RPC response:", raw);

      const valid = Boolean(raw?.success ?? raw?.data?.valid ?? false);
      const profile = (raw?.data?.profile ?? null) as AnyObj | null;

      if (!valid) {
        return { success: false, message: "Invalid email or password" };
      }

      // store profile + a client-side session token
      const adminId =
        profile?._id?.toString?.() ??
        profile?.user_id ??
        profile?.id ??
        (email || "").toLowerCase();

      const token = this.genToken();
      this.saveToken(token);
      this.saveProfile(profile);

      console.log("Admin logged in. Stored token and profile.", { adminId });

      return {
        success: true,
        admin_id: adminId,
        session_token: token,
        message: "Login successful",
      };
    } catch (err) {
      console.error("Admin login error:", err);
      return {
        success: false,
        message:
          "Login failed: " + (err instanceof Error ? err.message : "Unknown error"),
      };
    }
  }

  // ----------------------- (client-only) session --------------------
  // These were RPCs before; we keep signatures but do everything locally.

  private static async createSession(_adminId: string): Promise<{
    success: boolean;
    session_token?: string;
    message?: string;
  }> {
    const token = this.genToken();
    this.saveToken(token);
    return { success: true, session_token: token };
  }

  static async validateSession(): Promise<AdminSession> {
    const token = this.loadToken();
    if (!token) {
      console.log("No session token found in localStorage");
      return { valid: false };
    }
    const profile = this.loadProfile();
    if (!profile) {
      console.log("No admin profile found; clearing token");
      this.clearToken();
      return { valid: false };
    }
    return {
      valid: true,
      admin_id:
        profile?._id?.toString?.() ??
        profile?.user_id ??
        profile?.id ??
        undefined,
      admin_email: profile?.email ?? undefined,
    };
  }

  static async logout(): Promise<boolean> {
    try {
      // No server RPC — just clear local state
      this.clearToken();
      this.saveProfile(null);
      console.log("Admin session cleared");
      return true;
    } catch (e) {
      console.error("Logout error:", e);
      this.clearToken();
      this.saveProfile(null);
      return false;
    }
  }

  static getSessionToken(): string | null {
    return this.loadToken();
  }

  static isLoggedIn(): boolean {
    return !!this.loadToken();
  }

  static async cleanExpiredSessions(): Promise<number> {
    // No server-managed sessions; nothing to clean.
    // Keep for API compatibility.
    return 0;
  }
}
