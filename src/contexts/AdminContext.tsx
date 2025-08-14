import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { AdminAuthService, AdminLoginResponse, AdminSession as AdminSessionType } from '@/lib/adminAuth';

interface AdminSession {
  user: {
    id: string;
    email: string;
    role: string;
    profile: any;
  };
  profile: any;
}

interface AdminContextType {
  adminSession: AdminSession | null;
  isAdminLoggedIn: boolean;
  loginAsAdmin: (email: string, password: string) => Promise<boolean>;
  logoutAdmin: () => void;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing admin session or token on app load
    const validateExistingSession = async () => {
      try {
        // If token exists, optimistically consider admin logged in while validating
        const hasToken = AdminAuthService.isLoggedIn();
        if (hasToken && !adminSession) {
          setLoading(true);
        }

        const sessionValidation = await AdminAuthService.validateSession();
        if (sessionValidation.valid) {
          // Create admin session object
          const adminProfile = {
            id: sessionValidation.admin_id,
            user_id: sessionValidation.admin_id,
            email: sessionValidation.admin_email,
            first_name: 'Admin',
            last_name: 'User',
            full_name: 'Admin User',
            role: 'admin',
            avatar_url: null,
            phone: null,
            address: null,
            date_of_birth: null,
            gender: null,
            emergency_contact: null,
            student_id: null,
            package: null,
            class_id: null,
            employee_id: null,
            department: null,
            subjects: null,
            qualification: null,
            experience_years: null,
            age: null,
            grade_level: null,
            grade_level_id: null,
            has_learning_disabilities: false,
            learning_needs_description: null,
            profile_image_id: null,
            profile_image_url: null,
            cv_url: null,
            cv_file_name: null,
            specializations: null,
            hourly_rate: null,
            availability: null,
            bio: null,
            certifications: null,
            languages: null,
            profile_completed: true,
            children_ids: null,
            relationship: null,
            hire_date: null,
            salary: null,
            position: null,
            is_active: true,
            last_login: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const session = {
            user: {
              id: sessionValidation.admin_id || 'admin-001',
              email: sessionValidation.admin_email || 'admin@mathmentor.com',
              role: 'admin',
              profile: adminProfile,
            },
            profile: adminProfile,
          };

          setAdminSession(session);
        } else {
          // If token was invalid, ensure we clear any lingering token-based state
          if (hasToken) {
            await AdminAuthService.logout();
          }
        }
      } catch (error) {
        console.error('Error validating admin session:', error);
      } finally {
        setLoading(false);
      }
    };

    validateExistingSession();
  }, []);

  const loginAsAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Use database authentication
      const loginResult: AdminLoginResponse = await AdminAuthService.loginAdmin(email, password);
      
      if (loginResult.success) {
        // Create admin profile object
        const adminProfile = {
          id: loginResult.admin_id || 'admin-001',
          user_id: loginResult.admin_id || 'admin-001',
          email: email,
          first_name: 'Admin',
          last_name: 'User',
          full_name: 'Admin User',
          role: 'admin',
          avatar_url: null,
          phone: null,
          address: null,
          date_of_birth: null,
          gender: null,
          emergency_contact: null,
          student_id: null,
          package: null,
          class_id: null,
          employee_id: null,
          department: null,
          subjects: null,
          qualification: null,
          experience_years: null,
          age: null,
          grade_level: null,
          grade_level_id: null,
          has_learning_disabilities: false,
          learning_needs_description: null,
          profile_image_id: null,
          profile_image_url: null,
          cv_url: null,
          cv_file_name: null,
          specializations: null,
          hourly_rate: null,
          availability: null,
          bio: null,
          certifications: null,
          languages: null,
          profile_completed: true,
          children_ids: null,
          relationship: null,
          hire_date: null,
          salary: null,
          position: null,
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const session = {
          user: {
            id: loginResult.admin_id || 'admin-001',
            email: email,
            role: 'admin',
            profile: adminProfile,
          },
          profile: adminProfile,
        };

        setAdminSession(session);
        
        toast.success('Welcome, Admin!');
        return true;
      } else {
        toast.error(loginResult.message || 'Invalid admin credentials');
        return false;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = async () => {
    try {
      await AdminAuthService.logout();
      setAdminSession(null);
      toast.success('Admin logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setAdminSession(null);
      toast.success('Admin logged out successfully');
    }
  };

  const value: AdminContextType = {
    adminSession,
    // Consider presence of stored token as logged-in during initial app load
    isAdminLoggedIn: !!adminSession || AdminAuthService.isLoggedIn(),
    loginAsAdmin,
    logoutAdmin,
    loading,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
} 