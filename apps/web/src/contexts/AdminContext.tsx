// src/contexts/AdminContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import toast from "react-hot-toast";
import { AdminAuthService } from "@/lib/adminAuth";

interface AdminProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  role: "admin";
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  emergency_contact: string | null;
  student_id: string | null;
  package: string | null;
  class_id: string | null;
  employee_id: string | null;
  department: string | null;
  subjects: string | null;
  qualification: string | null;
  experience_years: number | null;
  age: number | null;
  grade_level: string | null;
  grade_level_id: string | null;
  has_learning_disabilities: boolean;
  learning_needs_description: string | null;
  profile_image_id: string | null;
  profile_image_url: string | null;
  cv_url: string | null;
  cv_file_name: string | null;
  specializations: string | null;
  hourly_rate: number | null;
  availability: string | null;
  bio: string | null;
  certifications: string | null;
  languages: string | null;
  profile_completed: boolean;
  children_ids: string | null;
  relationship: string | null;
  hire_date: string | null;
  salary: number | null;
  position: string | null;
  is_active: boolean;
  last_login: string;
  created_at: string;
  updated_at: string;
}

interface AdminSession {
  user: {
    id: string;
    email: string;
    role: "admin";
    profile: AdminProfile;
  };
  profile: AdminProfile;
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
    // Initialize auth header from any saved token, and restore persisted session if present
    try {
      AdminAuthService.bootstrap();
      const storedSession = localStorage.getItem("adminSession");
      if (storedSession) {
        try {
          const parsed: AdminSession = JSON.parse(storedSession);
          setAdminSession(parsed);
        } catch {
          localStorage.removeItem("adminSession");
        }
      }
    } catch (e) {
      console.error("Error bootstrapping admin auth:", e);
      localStorage.removeItem("adminSession");
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAsAdmin = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Uses our AdminAuthService which auto-discovers the login endpoint
      const loginResult = await AdminAuthService.loginAdmin(email, password);

      // Ensure loginResult is valid and user is admin
      const u = (loginResult as any)?.user || {};
      if (!u || u.role !== "admin") {
        toast.error("Invalid admin credentials");
        return false;
      }
      const resolvedId: string =
        u._id || u.id || "admin-001";

      const adminProfile: AdminProfile = {
        id: resolvedId,
        user_id: resolvedId,
        email: u.email || email,
        first_name: (u.first_name as string) || "Admin",
        last_name: (u.last_name as string) || "User",
        full_name: (u.full_name as string) || "Admin User",
        role: "admin",
        avatar_url: (u.avatar_url as string) || null,
        phone: (u.phone as string) || null,
        address: (u.address as string) || null,
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

      const session: AdminSession = {
        user: {
          id: resolvedId,
          email: adminProfile.email,
          role: "admin",
          profile: adminProfile,
        },
        profile: adminProfile,
      };

      setAdminSession(session);
      localStorage.setItem("adminSession", JSON.stringify(session));
      toast.success("Welcome, Admin!");
      return true;
    } catch (error: any) {
      console.error("Admin login error:", error);
      const msg =
        error?.message ||
        (error?.response?.data && (error.response.data.error || error.response.data.message)) ||
        "Login failed";
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = async () => {
    try {
      await AdminAuthService.logout();
    } catch (error) {
      console.warn("Logout warning:", error);
    } finally {
      setAdminSession(null);
      localStorage.removeItem("adminSession");
      toast.success("Admin logged out successfully");
    }
  };

  const value: AdminContextType = {
    adminSession,
    isAdminLoggedIn: !!adminSession || !!localStorage.getItem("adminSession"),
    loginAsAdmin,
    logoutAdmin,
    loading,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
