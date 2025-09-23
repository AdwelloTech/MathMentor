import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import {
  User as SupabaseUser,
} from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/supabase";
import {
  getUserPermissions,
  canAccessFeature,
  hasRole,
  hasPackage,
} from "@/utils/permissions";
import type {
  User,
  UserProfile,
  UserRole,
  StudentPackage,
  AuthContextType,
  FeaturePermissions,
} from "@/types/auth";

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<FeaturePermissions | null>(null);

  // Refs to track & guard async state
  const isInitialized = useRef(false);
  const isProcessingAuth = useRef(false);
  const mounted = useRef(true);
  const lastProcessedUserId = useRef<string | null>(null);
  const lastProcessedAt = useRef<number>(0);

  // Safe setLoading
  const safeSetLoading = (value: boolean) => {
    if (mounted.current) setLoading(value);
  };

  // ---------- Profile helpers (Mongo) ----------
  // Ensure a profile exists for this Supabase user (uses user UUID as _id/user_id)
  const ensureProfileForUser = async (
    supaUser: SupabaseUser,
    defaults: Partial<UserProfile> = {}
  ): Promise<UserProfile> => {
    const uid = String(supaUser.id);
    if (!uid) throw new Error("Missing user id from session");

    // 1) already exists?
    const existing = await db.profiles.getById<UserProfile>(uid);
    if (existing) return existing;

    // 2) create a new profile document (REST via Mongo adaptor)
    const payload: Partial<UserProfile> = {
      _id: uid,                 // keep _id = user_id
      user_id: uid,
      email: supaUser.email ?? "",
      first_name: defaults.first_name ?? "",
      last_name: defaults.last_name ?? "",
      full_name:
        defaults.full_name ?? supaUser.email?.split("@")[0] ?? "User",
      role: (defaults.role as string) ?? "tutor",
      package: (defaults.package as string) ?? "free",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Prefer create if available; otherwise update acts like upsert on your API
    let created: UserProfile | null = null;
    if (typeof (db.profiles as any).create === "function") {
      created = await db.profiles.create<UserProfile>(uid, payload);
    } else {
      created = await db.profiles.update<UserProfile>(uid, payload);
    }

    if (!created) {
      throw new Error("Profile create returned empty response");
    }
    return created;
  };

  // Fetch user profile with retry (by Supabase UUID)
  const fetchUserProfileWithRetry = async (
    userId: string,
    maxRetries: number = 5
  ): Promise<UserProfile | null> => {
    let retries = maxRetries;
    console.log("Fetching user profile…");
    while (retries > 0) {
      try {
        const userProfile = await db.profiles.getById<UserProfile>(userId);
        if (userProfile) {
          console.log("Profile found:", userProfile.full_name);
          return userProfile;
        }
        retries--;
        if (retries === 0) {
          console.error("Profile not found after all retries");
          return null;
        }
        const delay = (maxRetries - retries) * 1000; // 1s,2s,3s,4s,5s
        console.log(`Profile not found, retrying in ${delay}ms… (${retries} retries left)`);
        await new Promise((r) => setTimeout(r, delay));
      } catch (err: any) {
        console.log(
          `Profile fetch attempt ${maxRetries - retries + 1} failed:`,
          err?.message
        );
        retries--;
        if (retries === 0) {
          console.error("Failed to fetch profile after all retries");
          throw err;
        }
        const delay = (maxRetries - retries) * 800;
        console.log(`Retrying in ${delay}ms…`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    return null;
  };

  // Update last login (best-effort)
  const updateLastLogin = async (userId: string) => {
    try {
      await db.profiles.update(userId, { last_login: new Date().toISOString() });
    } catch (error) {
      console.warn("Failed to update last login:", error);
    }
  };

  // ---------- Auth lifecycle ----------
  useEffect(() => {
    mounted.current = true;

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        const session = await auth.getSession();

        if (!session) {
          console.log("No session data available");
          safeSetLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Found existing session for:", session.user.email);
          if (session.user.email_confirmed_at) {
            console.log("Manually handling existing session");
            await handleAuthStateChange(session.user, false);
          } else {
            console.log("User not confirmed, clearing session");
            await auth.signOut();
            safeSetLoading(false);
          }
        } else {
          console.log("No existing session found");
          safeSetLoading(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        safeSetLoading(false);
      } finally {
        isInitialized.current = true;
      }
    };

    initializeAuth();

    // Only react to SIGNED_OUT to avoid spinners on token refreshes
    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);
      if (event === "SIGNED_OUT") {
        console.log("Handling sign out");
        clearAuthState();
        return;
      }
      console.log("Ignoring auth event:", event);
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearAuthState = () => {
    if (mounted.current) {
      setUser(null);
      setProfile(null);
      setPermissions(null);
      setLoading(false);
    }
    isProcessingAuth.current = false;
    lastProcessedUserId.current = null;
    lastProcessedAt.current = 0;
  };

  const handleAuthStateChange = async (
    supabaseUser: SupabaseUser,
    showWelcome: boolean = false
  ) => {
    const now = Date.now();

    // Duplicate prevention (2s window)
    if (
      lastProcessedUserId.current === supabaseUser.id &&
      now - lastProcessedAt.current < 2000
    ) {
      console.log("Duplicate auth event within 2 seconds, skipping...");
      return;
    }
    if (isProcessingAuth.current) {
      console.log("Auth already processing, skipping...");
      return;
    }
    lastProcessedUserId.current = supabaseUser.id;
    lastProcessedAt.current = now;
    isProcessingAuth.current = true;

    try {
      console.log("Handling auth state change for user:", supabaseUser.email);

      if (!supabaseUser.email_confirmed_at) {
        console.log("User email not confirmed yet");
        clearAuthState();
        return;
      }

      const uid = String(supabaseUser.id);

      // 1) Try to load
      let userProfile = await fetchUserProfileWithRetry(uid);

      // 2) If missing → create → fetch once more
      if (!userProfile) {
        console.warn("Profile missing — creating now");
        try {
          await ensureProfileForUser(supabaseUser, {
            role: "tutor",
            package: "free",
          });
          userProfile = await fetchUserProfileWithRetry(uid, 2);
        } catch (e: any) {
          console.error("Auto-create profile failed:", e);
          toast.error(
            e?.message ||
              "Could not load or create your profile. Please try again or contact support."
          );
          clearAuthState();
          return;
        }
      }

      if (!userProfile) {
        toast.error(
          "Could not load or create your profile. Please try again or contact support."
        );
        clearAuthState();
        return;
      }

      if (!mounted.current) {
        console.log("Component unmounted, skipping auth state update");
        return;
      }

      // Build User object for UI
      const userData: User = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        created_at: supabaseUser.created_at,
        updated_at: supabaseUser.updated_at || supabaseUser.created_at,
        email_confirmed_at: supabaseUser.email_confirmed_at,
        last_sign_in_at: supabaseUser.last_sign_in_at,
        role: userProfile.role as UserRole,
        profile: userProfile,
      };

      const userPermissions = getUserPermissions(
        userProfile.role as UserRole,
        userProfile.package as StudentPackage
      );

      console.log(
        "Setting user state:",
        userData.email,
        userProfile.role,
        userProfile.package
      );

      setUser(userData);
      setProfile(userProfile);
      setPermissions(userPermissions);

      // Non-blocking update
      updateLastLogin(uid);

      if (showWelcome && supabaseUser.last_sign_in_at) {
        toast.success(`Welcome back, ${userProfile.full_name}!`);
      } else if (!supabaseUser.last_sign_in_at) {
        console.log("New user registration completed for:", userProfile.full_name);
      }
    } catch (error: any) {
      console.error("Error handling auth state change:", error);
      handleAuthError(error);
      clearAuthState();
    } finally {
      isProcessingAuth.current = false;
      safeSetLoading(false);
    }
  };

  // Error → friendly message
  const handleAuthError = (error: any) => {
    if (error?.message?.includes("relation") || error?.message?.includes("500")) {
      toast.error("Database connection issue. Please refresh the page.");
    } else if (error?.message?.includes("profile") || error?.message?.includes("not found")) {
      toast.error("Profile loading failed. Please try logging in again.");
    } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
      toast.error("Network error. Please check your connection and try again.");
    } else {
      toast.error("Authentication error. Please try refreshing the page.");
    }
  };

  // ---------- Auth actions ----------
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Attempting sign in for:", email);
      const result = await auth.signIn(email, password);

      if (result?.user) {
        console.log(
          "Sign in result:",
          result.user.email,
          "confirmed:",
          !!result.user.email_confirmed_at
        );

        if (!result.user.email_confirmed_at) {
          toast.error(
            "Please verify your email before signing in. Check your inbox for a confirmation email."
          );
          await auth.signOut();
          return;
        }

        console.log("Sign in successful, manually handling auth state…");
        await handleAuthStateChange(result.user, true);
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(getAuthErrorMessage(error));
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      console.log(
        "Starting registration for:",
        email,
        "with role:",
        userData.role,
        "package:",
        userData.package
      );

      const result = await auth.signUp(email, password, {
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        package: userData.package || "free",
        phone: userData.phone,
        payment_intent_id: userData.payment_intent_id,
      });

      console.log(
        "Registration result:",
        result?.user?.email,
        "confirmed:",
        !!result?.user?.email_confirmed_at
      );

      // We don't need to create immediately here; handleAuthStateChange will
      if (result?.user) {
        if (result.user.email_confirmed_at) {
          toast.success("Registration successful! Redirecting to dashboard…");
        } else {
          toast.success(
            "Registration successful! Please check your email to verify your account before signing in."
          );
        }
      } else {
        toast.success(
          "Registration successful! Please check your email to verify your account before signing in."
        );
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(getAuthErrorMessage(error));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error: any) {
      console.warn("Sign out API call failed (often harmless):", error);
    }
    clearAuthState();
    toast.success("Signed out successfully");
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");
    try {
      const updatedProfile = await db.profiles.update(user.id, {
        ...updates,
        full_name:
          updates.first_name && updates.last_name
            ? `${updates.first_name} ${updates.last_name}`
            : profile?.full_name,
        updated_at: new Date().toISOString(),
      });

      setProfile(updatedProfile);

      if (updates.role || updates.package) {
        const newPermissions = getUserPermissions(
          (updates.role || profile?.role) as UserRole,
          (updates.package || profile?.package) as StudentPackage
        );
        setPermissions(newPermissions);
      }
      return updatedProfile;
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error("Error updating profile");
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth.resetPassword(email);
      toast.success("Password reset email sent");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error("Error sending reset email");
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    try {
      await auth.updatePassword(password);
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Update password error:", error);
      toast.error("Error updating password");
      throw error;
    }
  };

  // Convenience guards
  const hasRoleAccess = (role: UserRole | UserRole[]) =>
    hasRole(profile?.role as UserRole, role);

  const hasPackageAccess = (pkg: StudentPackage | StudentPackage[]) =>
    hasPackage(profile?.package as StudentPackage, pkg);

  const canAccess = (feature: string) =>
    canAccessFeature(
      feature as keyof FeaturePermissions,
      profile?.role as UserRole,
      profile?.package as StudentPackage
    );

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    hasRole: hasRoleAccess,
    hasPackage: hasPackageAccess,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Friendly auth error messages
function getAuthErrorMessage(error: any): string {
  if (error?.message) {
    switch (error.message) {
      case "Invalid login credentials":
        return "Invalid email or password. Please check your credentials and try again.";
      case "Email not confirmed":
        return "Please check your email and click the confirmation link before signing in.";
      case "User not found":
        return "No account found with this email address.";
      case "Invalid email":
        return "Please enter a valid email address.";
      case "Password should be at least 6 characters":
        return "Password must be at least 6 characters long.";
      case "User already registered":
        return "An account with this email already exists.";
      case "Too many requests":
        return "Too many attempts. Please wait a few minutes before trying again.";
      case "Network error":
        return "Network connection error. Please check your internet connection.";
      default:
        return error.message;
    }
  }
  return "An unexpected error occurred. Please try again.";
}

// Export types back out (optional if already exported elsewhere)
export type { AuthContextType, User, UserProfile, UserRole, StudentPackage };
