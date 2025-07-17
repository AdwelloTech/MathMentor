import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { auth, db } from '@/lib/supabase';
import { getUserPermissions, canAccessFeature, hasRole, hasPackage } from '@/utils/permissions';
import type { 
  User, 
  UserProfile, 
  UserRole, 
  StudentPackage, 
  AuthContextType,
  FeaturePermissions 
} from '@/types/auth';

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
  const [permissions, setPermissions] = useState<FeaturePermissions | null>(null);
  
  // Use refs to track state and prevent race conditions
  const isInitialized = useRef(false);
  const isProcessingAuth = useRef(false);
  const mounted = useRef(true);
  const lastActiveTime = useRef(Date.now());
  const tabVisibilityTimeout = useRef<NodeJS.Timeout | null>(null);

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
        console.log('Initializing auth...');
        
        // Get initial session
        const session = await auth.getSession();
        
        if (!session) {
          console.log('No session data available');
          safeSetLoading(false);
          return;
        }

        if (session?.user) {
          console.log('Found existing session for:', session.user.email);
          
          // Only handle auth state change if user is confirmed
          if (session.user.email_confirmed_at) {
            await handleAuthStateChange(session.user, false); // false = don't show welcome toast
          } else {
            console.log('User not confirmed, clearing session');
            await auth.signOut();
          }
        } else {
          console.log('No existing session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        isInitialized.current = true;
        safeSetLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      // Skip if we're still initializing to prevent race conditions
      if (!isInitialized.current) {
        console.log('Skipping auth state change - still initializing');
        return;
      }
      
      if (event === 'SIGNED_IN' && session?.user) {
        safeSetLoading(true);
        await handleAuthStateChange(session.user, true); // true = show welcome toast
      } else if (event === 'SIGNED_OUT') {
        clearAuthState();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Handle token refresh without showing toast
        await handleAuthStateChange(session.user, false);
      }
    });

    // Handle tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, scheduling auth check...');
        
        // Clear any existing timeout
        if (tabVisibilityTimeout.current) {
          clearTimeout(tabVisibilityTimeout.current);
        }
        
        // Debounce the visibility check by 500ms to prevent rapid switching
        tabVisibilityTimeout.current = setTimeout(() => {
          handleTabBecameVisible();
        }, 500);
      } else {
        console.log('Tab became hidden');
        lastActiveTime.current = Date.now();
        
        // Clear any pending visibility checks
        if (tabVisibilityTimeout.current) {
          clearTimeout(tabVisibilityTimeout.current);
          tabVisibilityTimeout.current = null;
        }
      }
    };

    // Handle window focus events
    const handleWindowFocus = () => {
      console.log('Window gained focus, scheduling auth check...');
      
      // Clear any existing timeout
      if (tabVisibilityTimeout.current) {
        clearTimeout(tabVisibilityTimeout.current);
      }
      
      // Debounce the focus check by 300ms
      tabVisibilityTimeout.current = setTimeout(() => {
        handleTabBecameVisible();
      }, 300);
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      
      // Clear any pending timeouts
      if (tabVisibilityTimeout.current) {
        clearTimeout(tabVisibilityTimeout.current);
      }
    };
  }, []);

  // Handle tab becoming visible after being hidden
  const handleTabBecameVisible = async () => {
    // Only check if we have a user and enough time has passed
    if (!user || !isInitialized.current || isProcessingAuth.current) {
      return;
    }

    const timeSinceLastActive = Date.now() - lastActiveTime.current;
    
    // Only refresh if tab was hidden for more than 30 seconds
    if (timeSinceLastActive < 30000) {
      console.log('Tab was hidden for less than 30 seconds, skipping refresh');
      return;
    }

    try {
      console.log('Refreshing auth state after tab visibility change...');
      safeSetLoading(true);
      
      // Get current session to verify it's still valid
      const session = await auth.getSession();
      
      if (session?.user && session.user.email_confirmed_at) {
        console.log('Session still valid, refreshing user data...');
        
        // Refresh user profile data
        const userProfile = await fetchUserProfileWithRetry(session.user.id, 3);
        
        if (userProfile && mounted.current) {
          // Update profile if it changed (compare key fields to avoid unnecessary updates)
          const hasProfileChanged = !profile || 
            profile.role !== userProfile.role ||
            profile.package !== userProfile.package ||
            profile.full_name !== userProfile.full_name ||
            profile.updated_at !== userProfile.updated_at;
            
          if (hasProfileChanged) {
            console.log('Profile updated, refreshing state...');
            setProfile(userProfile);
            
            // Update permissions if role or package changed
            const newPermissions = getUserPermissions(
              userProfile.role as UserRole,
              userProfile.package as StudentPackage
            );
            setPermissions(newPermissions);
          } else {
            console.log('Profile unchanged, no update needed');
          }
        }
      } else {
        console.log('Session invalid, clearing auth state...');
        clearAuthState();
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      // Don't clear auth state on refresh errors, just log them
    } finally {
      safeSetLoading(false);
      lastActiveTime.current = Date.now();
    }
  };

  // Clear auth state
  const clearAuthState = () => {
    if (mounted.current) {
      setUser(null);
      setProfile(null);
      setPermissions(null);
      setLoading(false);
    }
    isProcessingAuth.current = false;
  };

  // Handle auth state changes with better error handling
  const handleAuthStateChange = async (supabaseUser: SupabaseUser, showWelcome: boolean = false) => {
    // Prevent concurrent auth processing
    if (isProcessingAuth.current) {
      console.log('Auth already processing, skipping...');
      return;
    }
    
    isProcessingAuth.current = true;
    
    try {
      console.log('Handling auth state change for user:', supabaseUser.email);
      
      // Skip if user is not confirmed
      if (!supabaseUser.email_confirmed_at) {
        console.log('User email not confirmed yet');
        clearAuthState();
        return;
      }

      // Get user profile with improved retry logic
      const userProfile = await fetchUserProfileWithRetry(supabaseUser.id);
      
      if (!userProfile) {
        console.error('Profile not found for confirmed user:', supabaseUser.id);
        toast.error('Account setup incomplete. Please contact support or try registering again.');
        clearAuthState();
        return;
      }

      // Only proceed if component is still mounted
      if (!mounted.current) {
        console.log('Component unmounted, skipping auth state update');
        return;
      }

      // Create user object
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

      // Get permissions
      const userPermissions = getUserPermissions(
        userProfile.role as UserRole,
        userProfile.package as StudentPackage
      );

      console.log('Setting user state:', userData.email, userProfile.role, userProfile.package);
      
      // Set all auth state
      setUser(userData);
      setProfile(userProfile);
      setPermissions(userPermissions);

      // Update last login (non-blocking)
      updateLastLogin(supabaseUser.id);

      // Show welcome message for returning users, not new registrations
      if (showWelcome && supabaseUser.last_sign_in_at) {
        toast.success(`Welcome back, ${userProfile.full_name}!`);
      } else if (!supabaseUser.last_sign_in_at) {
        console.log('New user registration completed for:', userProfile.full_name);
      }

    } catch (error: any) {
      console.error('Error handling auth state change:', error);
      
      // Improved error handling with specific messages
      handleAuthError(error);
      clearAuthState();
    } finally {
      isProcessingAuth.current = false;
      safeSetLoading(false);
    }
  };

  // Fetch user profile with retry logic
  const fetchUserProfileWithRetry = async (userId: string, maxRetries: number = 5): Promise<UserProfile | null> => {
    let retries = maxRetries;
    
    console.log('Fetching user profile...');
    
    while (retries > 0) {
      try {
        const userProfile = await db.profiles.getById(userId);
        if (userProfile) {
          console.log('Profile found:', userProfile.full_name);
          return userProfile;
        }
        
        // If no profile found, reduce retries more aggressively
        retries--;
        
        if (retries === 0) {
          console.error('Profile not found after all retries');
          return null;
        }
        
        // Progressive delay
        const delay = (maxRetries - retries) * 1000; // 1s, 2s, 3s, 4s, 5s
        console.log(`Profile not found, retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error: any) {
        console.log(`Profile fetch attempt ${maxRetries - retries + 1} failed:`, error.message);
        retries--;
        
        if (retries === 0) {
          console.error('Failed to fetch profile after all retries');
          throw error;
        }
        
        // Progressive delay for errors
        const delay = (maxRetries - retries) * 800;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return null;
  };

  // Update last login (non-blocking)
  const updateLastLogin = async (userId: string) => {
    try {
      await db.profiles.update(userId, {
        last_login: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Failed to update last login:', error);
    }
  };

  // Handle auth errors with specific messages
  const handleAuthError = (error: any) => {
    if (error.message?.includes('relation') || error.message?.includes('500')) {
      toast.error('Database connection issue. Please refresh the page.');
    } else if (error.message?.includes('profile') || error.message?.includes('not found')) {
      toast.error('Profile loading failed. Please try logging in again.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      toast.error('Network error. Please check your connection and try again.');
    } else {
      toast.error('Authentication error. Please try refreshing the page.');
    }
  };

  // Sign in function with better error handling
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Attempting sign in for:', email);
      
      const result = await auth.signIn(email, password);
      
      if (result?.user) {
        console.log('Sign in result:', result.user.email, 'confirmed:', !!result.user.email_confirmed_at);
        
        // Check if email is confirmed
        if (!result.user.email_confirmed_at) {
          toast.error('Please verify your email before signing in. Check your inbox for a confirmation email.');
          await auth.signOut();
          return;
        }
        
        // Auth state change will be handled by the listener
        console.log('Sign in successful, waiting for auth state update...');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorMessage = getAuthErrorMessage(error);
      toast.error(errorMessage);
      setLoading(false);
      throw error;
    }
  };

  // Sign up function with better error handling
  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      console.log('Starting registration for:', email, 'with role:', userData.role, 'package:', userData.package);
      
      // Sign up the user with proper metadata
      const result = await auth.signUp(email, password, {
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        package: userData.package || 'free',
        phone: userData.phone,
        payment_intent_id: userData.payment_intent_id, // Include payment metadata
      });

      console.log('Registration result:', result?.user?.email, 'confirmed:', !!result?.user?.email_confirmed_at);

      if (result?.user) {
        // Check if user needs email confirmation
        if (result.user.email_confirmed_at) {
          console.log('User email auto-confirmed');
          toast.success('Registration successful! Redirecting to dashboard...');
        } else {
          console.log('User needs email confirmation');
          toast.success('Registration successful! Please check your email to verify your account before signing in.');
        }
      } else {
        console.log('No user returned from registration');
        toast.success('Registration successful! Please check your email to verify your account before signing in.');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      const errorMessage = getAuthErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await auth.signOut();
      clearAuthState();
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const updatedProfile = await db.profiles.update(user.id, {
        ...updates,
        full_name: updates.first_name && updates.last_name 
          ? `${updates.first_name} ${updates.last_name}`
          : profile?.full_name,
        updated_at: new Date().toISOString(),
      });

      setProfile(updatedProfile);
      
      // Update permissions if role or package changed
      if (updates.role || updates.package) {
        const newPermissions = getUserPermissions(
          (updates.role || profile?.role) as UserRole,
          (updates.package || profile?.package) as StudentPackage
        );
        setPermissions(newPermissions);
      }

      toast.success('Profile updated successfully');
      return updatedProfile;
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error('Error updating profile');
      throw error;
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    try {
      await auth.resetPassword(email);
      toast.success('Password reset email sent');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error('Error sending reset email');
      throw error;
    }
  };

  // Update password function
  const updatePassword = async (password: string) => {
    try {
      await auth.updatePassword(password);
      toast.success('Password updated successfully');
    } catch (error: any) {
      console.error('Update password error:', error);
      toast.error('Error updating password');
      throw error;
    }
  };

  // Helper functions
  const hasRoleAccess = (role: UserRole | UserRole[]) => {
    return hasRole(profile?.role as UserRole, role);
  };

  const hasPackageAccess = (packageLevel: StudentPackage | StudentPackage[]) => {
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
    resetPassword,
    updatePassword,
    hasRole: hasRoleAccess,
    hasPackage: hasPackageAccess,
    canAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get user-friendly error messages
function getAuthErrorMessage(error: any): string {
  if (error?.message) {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link before signing in.';
      case 'User not found':
        return 'No account found with this email address.';
      case 'Invalid email':
        return 'Please enter a valid email address.';
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long.';
      case 'User already registered':
        return 'An account with this email already exists.';
      case 'Too many requests':
        return 'Too many attempts. Please wait a few minutes before trying again.';
      case 'Network error':
        return 'Network connection error. Please check your internet connection.';
      default:
        return error.message;
    }
  }
  return 'An unexpected error occurred. Please try again.';
}

// Export types for use in other components
export type { AuthContextType, User, UserProfile, UserRole, StudentPackage };