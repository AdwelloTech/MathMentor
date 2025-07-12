import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const session = await auth.getSession();
        if (session?.user) {
          // Only handle auth state change if user is confirmed
          if (session.user.email_confirmed_at) {
            await handleAuthStateChange(session.user);
          } else {
            console.log('User not confirmed, waiting for email verification');
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Don't show error toast on initialization, just log it
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleAuthStateChange(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setPermissions(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle auth state changes
  const handleAuthStateChange = async (supabaseUser: SupabaseUser) => {
    try {
      // Skip if user is not confirmed
      if (!supabaseUser.email_confirmed_at) {
        console.log('User email not confirmed yet');
        return;
      }

      // Get user profile with retry logic
      let userProfile = null;
      let retries = 3;
      
      while (retries > 0 && !userProfile) {
        try {
          userProfile = await db.profiles.getById(supabaseUser.id);
          break;
        } catch (error: any) {
          retries--;
          if (retries === 0) throw error;
          
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (userProfile) {
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

        setUser(userData);
        setProfile(userProfile);
        setPermissions(userPermissions);

        // Update last login (non-blocking)
        db.profiles.update(supabaseUser.id, {
          last_login: new Date().toISOString(),
        }).catch(error => {
          console.warn('Failed to update last login:', error);
        });

        toast.success(`Welcome back, ${userProfile.full_name}!`);
      } else {
        // Profile doesn't exist, redirect to create profile
        console.log('Profile not found for user:', supabaseUser.id);
        setUser(null);
        setProfile(null);
        setPermissions(null);
      }
    } catch (error: any) {
      console.error('Error handling auth state change:', error);
      
      // Don't sign out immediately, give user a chance to retry
      if (error.message?.includes('relation') || error.message?.includes('500')) {
        toast.error('Database connection issue. Please refresh the page.');
      } else {
        toast.error('Error loading user profile. Please try again.');
      }
      
      // Clear user state but don't force sign out
      setUser(null);
      setProfile(null);
      setPermissions(null);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await auth.signIn(email, password);
      
      if (result?.user) {
        // Check if email is confirmed
        if (!result.user.email_confirmed_at) {
          toast.error('Please verify your email before signing in. Check your inbox for a confirmation email.');
          await auth.signOut();
          return;
        }
        
        // Wait a moment for auth state to update
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Auth state change will be handled by the listener
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorMessage = getAuthErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      setLoading(true);
      
      // Sign up the user with proper metadata
      const result = await auth.signUp(email, password, {
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        package: userData.package || 'free',
        phone: userData.phone,
      });

      if (result?.user) {
        // Check if user needs email confirmation
        if (result.user.email_confirmed_at) {
          toast.success('Registration successful! You can now sign in.');
        } else {
          toast.success('Registration successful! Please check your email to verify your account before signing in.');
        }
      } else {
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
      setUser(null);
      setProfile(null);
      setPermissions(null);
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

// Note: Student ID generation is now handled by the database trigger

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
      default:
        return error.message;
    }
  }
  return 'An unexpected error occurred. Please try again.';
}

// Export types for use in other components
export type { AuthContextType, User, UserProfile, UserRole, StudentPackage }; 