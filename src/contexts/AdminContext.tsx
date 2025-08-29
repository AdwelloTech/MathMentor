import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import toast from "react-hot-toast";
import {
  AdminAuthService,
  AdminLoginResponse,
  AdminSession as AdminSessionType,
} from "@/lib/adminAuth";

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
  logoutAdmin: () => Promise<void>;
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
    const loadAdminSession = async () => {
      try {
        // First, check if there's a valid session token
        const hasValidToken = AdminAuthService.isLoggedIn();
        
        if (hasValidToken) {
          // Validate the session token with the backend
          const sessionValidation = await AdminAuthService.validateSession();
          if (sessionValidation.valid) {
            // Create admin session object
            const adminProfile = {
              id: sessionValidation.admin_id,
              user_id: sessionValidation.admin_id,
              email: sessionValidation.admin_email,
              first_name: "Admin",
              last_name: "User",
              full_name: "Admin User",
              role: "admin",
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
                id: sessionValidation.admin_id || "admin-001",
                email: sessionValidation.admin_email || "admin@mathmentor.com",
                role: "admin",
                profile: adminProfile,
              },
              profile: adminProfile,
            };

            setAdminSession(session);
            // Store the session in localStorage for persistence
            localStorage.setItem("adminSession", JSON.stringify(session));
            setLoading(false);
            return;
          } else {
            // If token was invalid, clear it
            await AdminAuthService.logout();
          }
        }

        // If no valid token, check for stored session data as fallback
        const storedSession = localStorage.getItem("adminSession");
        if (storedSession) {
          try {
            const parsedSession = JSON.parse(storedSession);
            setAdminSession(parsedSession);
          } catch (error) {
            console.error("Error parsing stored session:", error);
            localStorage.removeItem("adminSession");
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading admin session:", error);
        localStorage.removeItem("adminSession");
        setLoading(false);
      }
    };

    loadAdminSession();
  }, []);

  const loginAsAdmin = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // Use database authentication
      const loginResult: AdminLoginResponse = await AdminAuthService.loginAdmin(
        email,
        password
      );

      if (loginResult.success) {
        // Create admin profile object
        const adminProfile = {
          id: loginResult.admin_id || "admin-001",
          user_id: loginResult.admin_id || "admin-001",
          email: email,
          first_name: "Admin",
          last_name: "User",
          full_name: "Admin User",
          role: "admin",
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
            id: loginResult.admin_id || "admin-001",
            email: email,
            role: "admin",
            profile: adminProfile,
          },
          profile: adminProfile,
        };

        setAdminSession(session);
        // Store the session in localStorage for persistence
        localStorage.setItem("adminSession", JSON.stringify(session));

        toast.success("Welcome, Admin!");
        return true;
      } else {
        toast.error(loginResult.message || "Invalid admin credentials");
        return false;
      }
    } catch (error) {
      console.error("Admin login error:", error);
      toast.error("Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = async () => {
    try {
      await AdminAuthService.logout();
      setAdminSession(null);
      // Clear the stored session from localStorage
      localStorage.removeItem("adminSession");
      toast.success("Admin logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      setAdminSession(null);
      // Clear the stored session from localStorage even if logout fails
      localStorage.removeItem("adminSession");
      toast.success("Admin logged out successfully");
    }
  };

  const value: AdminContextType = {
    adminSession,
    // Check both the current state and localStorage for login status
    isAdminLoggedIn: !!adminSession || !!localStorage.getItem("adminSession"),
    loginAsAdmin,
    logoutAdmin,
    loading,
  };

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
