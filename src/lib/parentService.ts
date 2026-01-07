import apiClient from './apiClient';

export interface ParentStudentLink {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentCode: string;
  studentPackage: string;
  relationship?: string;
  isPrimaryContact: boolean;
  linkedAt: Date;
  canViewGrades: boolean;
  canViewAttendance: boolean;
  canViewReports: boolean;
  canBookSessions: boolean;
}

export interface LinkStudentRequest {
  studentCode: string;
  relationship?: string;
  isPrimaryContact?: boolean;
}

export interface UpdatePermissionsRequest {
  canViewGrades?: boolean;
  canViewAttendance?: boolean;
  canViewReports?: boolean;
  canBookSessions?: boolean;
}

export const parentService = {
  /**
   * Link a student to the parent account using student code
   */
  async linkStudent(data: LinkStudentRequest): Promise<ParentStudentLink> {
    const response = await apiClient.post<ParentStudentLink>('/api/parents/link-student', data);
    return response;
  },

  /**
   * Get all students linked to the parent
   */
  async getLinkedStudents(): Promise<ParentStudentLink[]> {
    const response = await apiClient.get<ParentStudentLink[]>('/api/parents/students');
    return response;
  },

  /**
   * Unlink a student from the parent account
   */
  async unlinkStudent(studentId: string): Promise<void> {
    await apiClient.delete(`/api/parents/students/${studentId}`);
  },

  /**
   * Update permissions for a linked student
   */
  async updatePermissions(
    studentId: string,
    permissions: UpdatePermissionsRequest
  ): Promise<ParentStudentLink> {
    const response = await apiClient.patch<ParentStudentLink>(
      `/api/parents/students/${studentId}/permissions`,
      permissions
    );
    return response;
  },

  /**
   * Get dashboard data for a specific student
   */
  async getStudentDashboard(studentId: string): Promise<any> {
    const response = await apiClient.get(`/api/parents/students/${studentId}/dashboard`);
    return response;
  },

  /**
   * Get quiz progress for a specific student
   */
  async getStudentQuizProgress(studentId: string): Promise<any> {
    const response = await apiClient.get(`/api/parents/students/${studentId}/quiz-progress`);
    return response;
  },

  /**
   * Get session progress for a specific student
   */
  async getStudentSessionProgress(
    studentId: string,
    options?: {
      filter?: 'all' | 'upcoming' | 'completed' | 'cancelled';
      subject?: string; // Filter by subject name
      page?: number;
      limit?: number;
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options?.filter) params.append('filter', options.filter);
    if (options?.subject) params.append('subject', options.subject);
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await apiClient.get(
      `/api/parents/students/${studentId}/session-progress${params.toString() ? `?${params.toString()}` : ''}`
    );
    return response;
  },

  /**
   * Get details for a specific quiz attempt
   */
  async getStudentQuizAttemptDetails(studentId: string, attemptId: string): Promise<any> {
    const response = await apiClient.get(`/api/parents/students/${studentId}/quiz-attempts/${attemptId}`);
    return response;
  }
};

