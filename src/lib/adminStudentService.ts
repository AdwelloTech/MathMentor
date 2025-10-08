import apiClient from "./apiClient";

// Stub service - backend API integration needed
export class AdminStudentService {
  static async getAllStudents(): Promise<any[]> {
    try {
      const data = await apiClient.get<any[]>("/api/admin/students");
      return data || [];
    } catch (error) {
      console.error("Error fetching students:", error);
      return [];
    }
  }

  static async getStudentStats(): Promise<any> {
    try {
      const students = await this.getAllStudents();
      return {
        total: students.length,
        active: students.filter((s: any) => s.isActive).length,
        inactive: students.filter((s: any) => !s.isActive).length,
      };
    } catch (error) {
      console.error("Error getting student stats:", error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
      };
    }
  }

  static async updateStudent(studentId: string, updates: any): Promise<any> {
    try {
      const data = await apiClient.put(`/api/admin/students/${studentId}`, updates);
      return data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  }
}
