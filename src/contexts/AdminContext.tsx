import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";

interface AdminSession {
  user: {
    id: string;
    email: string;
    role: string;
    profile: any;
  };
  profile: any;
  refreshToken?: string;
  created_at: string;
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
    // Load admin session from localStorage
    const loadAdminSession = () => {
      try {
        const storedSession = localStorage.getItem("adminSession");
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession);
          // Check if session is still valid (not expired)
          const sessionTime = new Date(parsedSession.created_at).getTime();
          const currentTime = new Date().getTime();
          const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours

          if (currentTime - sessionTime < sessionDuration) {
            setAdminSession(parsedSession);
          } else {
            // Session expired, clear it
            localStorage.removeItem("adminSession");
          }
        }
      } catch (error) {
        console.error("Error loading admin session:", error);
        localStorage.removeItem("adminSession");
      } finally {
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

      // Clear any existing tokens before admin login
      apiClient.clearTokens();

      // Call real admin login API (skip auth since we're authenticating)
      const loginResponse = await apiClient.post<{
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
      }>("/api/auth/admin/login", { email, password }, { skipAuth: true });

      // Set tokens in API client
      apiClient.setTokens(loginResponse.accessToken, loginResponse.refreshToken);

      // Get admin profile using the /me endpoint
      const profileResponse = await apiClient.get<{
        id: string;
        user_id: string;
        first_name: string;
        last_name: string;
        full_name: string;
        email: string;
        role: string;
        avatar_url?: string;
        phone?: string;
        address?: string;
        date_of_birth?: string;
        gender?: string;
        emergency_contact?: string;
        employee_id?: string;
        department?: string;
        qualification?: string;
        experience_years?: number;
        specializations?: string[];
        bio?: string;
        certifications?: string[];
        languages?: string[];
        hire_date?: string;
        position?: string;
        is_active: boolean;
        last_login?: string;
        created_at: string;
        updated_at: string;
        profile_completed: boolean;
      }>("/api/auth/me");

      const session = {
        user: {
          id: loginResponse.user.id,
          email: loginResponse.user.email,
          role: loginResponse.user.role,
          profile: profileResponse,
        },
        profile: profileResponse,
        refreshToken: loginResponse.refreshToken,
        created_at: new Date().toISOString(),
      };

      setAdminSession(session);
      // Store the session in localStorage for persistence
      localStorage.setItem("adminSession", JSON.stringify(session));

      toast.success("Welcome, Admin!");
      return true;
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast.error(error.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = async () => {
    try {
      // Call admin logout API if we have a refresh token
      if (adminSession?.refreshToken) {
        try {
          await apiClient.post("/api/auth/admin/logout", { refreshToken: adminSession.refreshToken });
        } catch (apiError) {
          // Ignore API logout errors, proceed with local logout
          console.warn("Admin logout API call failed:", apiError);
        }
      }

      // Clear session and tokens
      setAdminSession(null);
      apiClient.clearTokens();
      localStorage.removeItem("adminSession");
      toast.success("Admin logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Always clear local session even if logout fails
      setAdminSession(null);
      apiClient.clearTokens();
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
