import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from "react";
import toast from "react-hot-toast";
import AuthService from "@/lib/authService";
import apiClient, { ApiClientError } from "@/lib/apiClient";
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
  RegisterFormData,
} from "@/types/auth";

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Internal permissions state - used for permission calculations but not exposed in context
  const [permissions, setPermissions] = useState<FeaturePermissions | null>(
    null
  );

  // Use refs to track state and prevent race conditions
  const isInitialized = useRef(false);
  const isProcessingAuth = useRef(false);
  const mounted = useRef(true);
  const lastProcessedUserId = useRef<string | null>(null);
  const lastProcessedAt = useRef<number>(0);

  // Safe state setter that checks if component is still mounted
  const safeSetLoading = (value: boolean) => {
    if (mounted.current) {
      setLoading(value);
    }
  };

  // Initialize auth state
  useEffect(() => {
    mounted.current = true;

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");

        // Check if user is authenticated via API client
        if (apiClient.isAuthenticated()) {
          console.log("Found existing authentication tokens");

          try {
            // Try to get current user profile
            const userProfile = await AuthService.getCurrentUser();
            console.log("Retrieved user profile for:", userProfile.email);

            // Transform and set user data
            const userData = AuthService.transformUserData(userProfile, userProfile);
            await handleAuthStateChange(userData, false);
          } catch (error) {
            console.error("Failed to get user profile:", error);
            // Clear invalid tokens
            apiClient.clearTokens();
            clearAuthState();
          }
        } else {
          console.log("No authentication tokens found");
          clearAuthState();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuthState();
      } finally {
        isInitialized.current = true;
      }
    };

    initializeAuth();

    // Listen for storage changes (token updates from other tabs)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'mathmentor_tokens' && !event.newValue) {
        // Tokens were cleared in another tab
        console.log("Tokens cleared in another tab, signing out");
        clearAuthState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for authentication expiration events from API client
    const handleAuthExpired = () => {
      console.log("Authentication expired, clearing auth state");
      clearAuthState();
    };

    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      mounted.current = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, []);

  // Tab visibility handling removed - no need to refresh auth when switching tabs

  // Clear auth state
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

  // Handle auth state changes with better error handling
  const handleAuthStateChange = async (
    userData: User,
    showWelcome: boolean = false
  ) => {
    const now = Date.now();

    // Aggressive duplicate prevention: skip if same user processed within last 2 seconds
    if (
      lastProcessedUserId.current === userData.id &&
      now - lastProcessedAt.current < 2000
    ) {
      console.log("Duplicate auth event within 2 seconds, skipping...");
      return;
    }

    // Prevent concurrent auth processing
    if (isProcessingAuth.current) {
      console.log("Auth already processing, skipping...");
      return;
    }

    // Update tracking vars
    lastProcessedUserId.current = userData.id;
    lastProcessedAt.current = now;
    isProcessingAuth.current = true;

    try {
      console.log("Handling auth state change for user:", userData.email);

      // Only proceed if component is still mounted
      if (!mounted.current) {
        console.log("Component unmounted, skipping auth state update");
        return;
      }

      // Get permissions
      const userPermissions = getUserPermissions(
        userData.profile.role as UserRole,
        userData.profile.package as StudentPackage
      );

      console.log(
        "Setting user state:",
        userData.email,
        userData.profile.role,
        userData.profile.package
      );

      // Set all auth state
      setUser(userData);
      setProfile(userData.profile);
      setPermissions(userPermissions);

      // Show welcome message for returning users, not new registrations
      if (showWelcome && userData.last_sign_in_at) {
        toast.success(`Welcome back, ${userData.profile.full_name}!`);
      } else if (!userData.last_sign_in_at) {
        console.log(
          "New user login completed for:",
          userData.profile.full_name
        );
      }
    } catch (error: any) {
      console.error("Error handling auth state change:", error);

      // Improved error handling with specific messages
      handleAuthError(error);
      clearAuthState();
    } finally {
      isProcessingAuth.current = false;
      safeSetLoading(false);
    }
  };

  // Handle auth errors with specific messages
  const handleAuthError = (error: ApiClientError) => {
    if (error.status === 500) {
      toast.error("Server error. Please try again later.");
    } else if (error.status === 401) {
      toast.error("Authentication failed. Please check your credentials.");
    } else if (error.status === 403) {
      toast.error("Access denied. Please contact support.");
    } else if (error.status === 404) {
      toast.error("Resource not found.");
    } else if (error.status >= 400 && error.status < 500) {
      toast.error(error.message || "Request failed. Please try again.");
    } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
      toast.error("Network error. Please check your connection and try again.");
    } else {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  // Sign in function with better error handling
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Attempting sign in for:", email);

      const result = await AuthService.login({ email, password });

      console.log("Sign in successful for:", result.user.email);

      // Fetch the complete user profile from /me endpoint
      const fullProfile = await AuthService.getCurrentUser();
      console.log("Fetched full user profile for:", fullProfile.email);

      // Transform backend user data to frontend format
      const userData = AuthService.transformUserData(fullProfile, fullProfile);

      // Handle auth state change
      await handleAuthStateChange(userData, true); // true = show welcome message
    } catch (error: any) {
      console.error("Sign in error:", error);
      handleAuthError(error);
      setLoading(false);
      throw error;
    }
  };

  // Sign up function with better error handling
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

      // Create registration data object
      const registrationData: RegisterFormData = {
        email,
        password,
        confirmPassword: userData.confirmPassword || password, // Assuming confirmPassword is provided
        firstName: userData.first_name || userData.firstName,
        lastName: userData.last_name || userData.lastName,
        role: userData.role,
        phone: userData.phone,
        package: userData.package,
        subjects: userData.subjects,
        experience: userData.experience,
        qualification: userData.qualification,
        agreesToTerms: userData.agreesToTerms || true,
      };

      // Register the user
      const result = await AuthService.register(registrationData);

      console.log("Registration successful for:", result.user.email);

      // Show success message
      toast.success(
        "Registration successful! Please check your email to verify your account before signing in."
      );

      // Note: Backend handles auto-confirmation, so we don't need to check email_confirmed_at
    } catch (error: any) {
      console.error("Sign up error:", error);
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await AuthService.logout();
    } catch (error: any) {
      console.warn("Sign out API call failed:", error);
      // Continue with local cleanup regardless of API call result
    }

    // Always clear local state - this is the most important part
    clearAuthState();
    toast.success("Signed out successfully");
  };

  // Update profile function
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");

    try {
      const updatedProfile = await AuthService.updateProfile(updates);

      setProfile(updatedProfile);

      // Update permissions if role or package changed
      if (updates.role || updates.package) {
        const newPermissions = getUserPermissions(
          (updates.role || profile?.role) as UserRole,
          (updates.package || profile?.package) as StudentPackage
        );
        setPermissions(newPermissions);
      }

      // Profile updated silently - no toast needed
      return updatedProfile;
    } catch (error: any) {
      console.error("Update profile error:", error);
      handleAuthError(error);
      throw error;
    }
  };

  // Update package function (convenience method for package updates)
  const updatePackage = async (newPackage: StudentPackage) => {
    return updateProfile({ package: newPackage });
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email);
      toast.success("Password reset email sent");
    } catch (error: any) {
      console.error("Reset password error:", error);
      handleAuthError(error);
      throw error;
    }
  };

  // Update password function
  const updatePassword = async (password: string) => {
    try {
      // For password updates, we assume this is coming from a reset flow
      // where current password is not required
      await AuthService.updatePassword("", password);
      toast.success("Password updated successfully");
    } catch (error: any) {
      console.error("Update password error:", error);
      handleAuthError(error);
      throw error;
    }
  };

  // Helper functions
  const hasRoleAccess = (role: UserRole | UserRole[]) => {
    return hasRole(profile?.role as UserRole, role);
  };

  const hasPackageAccess = (
    packageLevel: StudentPackage | StudentPackage[]
  ) => {
    return hasPackage(profile?.package as StudentPackage, packageLevel);
  };

  const canAccess = (feature: string) => {
    return canAccessFeature(
      feature as keyof FeaturePermissions,
      profile?.role as UserRole,
      profile?.package as StudentPackage
    );
  };

  // Context value
  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePackage,
    resetPassword,
    updatePassword,
    hasRole: hasRoleAccess,
    hasPackage: hasPackageAccess,
    canAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


// Export types for use in other components
export type { AuthContextType, User, UserProfile, UserRole, StudentPackage };
