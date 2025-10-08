import apiClient from "./apiClient";

// Student interface for admin operations
export interface Student {
  id: string;
  full_name: string;
  email: string;
  student_id: string;
  package: string;
  is_active: boolean;
  last_login: string | null;
  first_name: string;
  last_name: string;
  profile_image_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: "male" | "female" | "other";
  age?: number;
  emergency_contact?: string;
  city?: string;
  postcode?: string;
  address?: string;
  school_name?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  current_grade?: string;
  academic_set?: "Set 1" | "Set 2" | "Set 3" | "Set 4 (Foundation)";
  has_learning_disabilities?: boolean;
  learning_needs_description?: string;
  subscription_status?: string;
  subscription_start_date?: string;
  subscription_end_date?: string;
  created_at: string;
  updated_at: string;
}

// Package information interface
export interface PackageInfo {
  package_type: string;
  display_name: string;
  price_monthly: number;
  features: string[];
}

// Stub service - backend API integration needed
export class AdminStudentService {
  static async getAllStudents(): Promise<Student[]> {
    try {
      const data = await apiClient.get<Student[]>("/api/admin/students");
      return data || [];
    } catch (error) {
      console.error("Error fetching students:", error);
      return [];
    }
  }

  static async getStudentStats(): Promise<{
    total: number;
    active: number;
    byPackage: Record<string, number>;
    recentRegistrations: number;
  }> {
    try {
      const students = await this.getAllStudents();
      const byPackage: Record<string, number> = {};

      // Count students by package
      students.forEach(student => {
        byPackage[student.package] = (byPackage[student.package] || 0) + 1;
      });

      // Count recent registrations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRegistrations = students.filter(
        student => new Date(student.created_at) > thirtyDaysAgo
      ).length;

      return {
        total: students.length,
        active: students.filter(s => s.is_active).length,
        byPackage,
        recentRegistrations,
      };
    } catch (error) {
      console.error("Error getting student stats:", error);
      return {
        total: 0,
        active: 0,
        byPackage: {},
        recentRegistrations: 0,
      };
    }
  }

  static async getPackageInfo(): Promise<PackageInfo[]> {
    // For now, return hardcoded package information
    // In a real implementation, this would fetch from the backend
    return [
      {
        package_type: "free",
        display_name: "Free",
        price_monthly: 0,
        features: ["Basic access", "Limited quizzes", "Community support"]
      },
      {
        package_type: "silver",
        display_name: "Silver",
        price_monthly: 999, // £9.99
        features: ["Unlimited quizzes", "Progress tracking", "Email support", "Basic tutor materials"]
      },
      {
        package_type: "gold",
        display_name: "Gold",
        price_monthly: 1499, // £14.99
        features: ["All Silver features", "Premium tutor materials", "1-on-1 tutoring sessions", "Priority support", "Advanced analytics"]
      }
    ];
  }

  static async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    try {
      const data = await apiClient.put<Student>(`/api/admin/students/${studentId}`, updates);
      return data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  }
}
