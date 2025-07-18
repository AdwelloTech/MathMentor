// User roles in the system
export type UserRole = 
  | 'admin'
  | 'principal'
  | 'teacher'
  | 'tutor'
  | 'student'
  | 'parent'
  | 'hr'
  | 'finance'
  | 'support';

// Student subscription packages
export type StudentPackage = 'free' | 'silver' | 'gold';

// Base user interface from Supabase
export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  role: UserRole;
  profile: UserProfile;
}

// Extended user profile
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  emergency_contact?: string;
  
  // Student specific fields
  student_id?: string;
  package?: StudentPackage;
  class_id?: string;
  
  // Teacher specific fields
  employee_id?: string;
  department?: string;
  subjects?: string[];
  qualification?: string;
  experience_years?: number;
  
  // Tutor specific fields
  cv_url?: string;
  cv_file_name?: string;
  specializations?: string[];
  hourly_rate?: number;
  availability?: string;
  bio?: string;
  certifications?: string[];
  languages?: string[];
  profile_completed?: boolean;
  
  // Parent specific fields
  children_ids?: string[];
  relationship?: string;
  
  // Staff specific fields
  hire_date?: string;
  salary?: number;
  position?: string;
  
  // System fields
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// Authentication context type
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPackage: (packageLevel: StudentPackage | StudentPackage[]) => boolean;
  canAccess: (feature: string) => boolean;
}

// Login form data
export interface LoginFormData {
  email: string;
  password: string;
  remember?: boolean;
}

// Registration form data
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  package?: StudentPackage; // For students
  subjects?: string; // For tutors
  experience?: string; // For tutors
  qualification?: string; // For tutors
  agreesToTerms: boolean;
}

// Password reset form data
export interface PasswordResetFormData {
  email: string;
}

// New password form data for reset password page
export interface NewPasswordFormData {
  password: string;
  confirmPassword: string;
}

// Profile update form data
export interface ProfileUpdateFormData {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  emergencyContact?: string;
}

// Feature permissions based on roles and packages
export interface FeaturePermissions {
  // Academic features
  viewClasses: boolean;
  manageClasses: boolean;
  viewGrades: boolean;
  manageGrades: boolean;
  viewAttendance: boolean;
  manageAttendance: boolean;
  
  // Learning features
  accessLearningResources: boolean;
  bookOneToOne: boolean;
  bookConsultation: boolean;
  joinGroupClasses: boolean;
  
  // Administrative features
  manageUsers: boolean;
  viewReports: boolean;
  manageFinance: boolean;
  manageAdmissions: boolean;
  manageHR: boolean;
  
  // Communication features
  sendMessages: boolean;
  receiveMessages: boolean;
  makeAnnouncements: boolean;
  
  // System features
  accessDashboard: boolean;
  manageSettings: boolean;
  viewAuditLogs: boolean;
}

// Tutor application types
export type TutorApplicationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';

export interface TutorApplication {
  id: string;
  user_id: string;
  applicant_email: string;
  full_name: string;
  phone_number: string;
  subjects: string[];
  specializes_learning_disabilities: boolean;
  cv_file_name?: string;
  cv_url?: string;
  cv_file_size?: number;
  additional_notes?: string;
  application_status: TutorApplicationStatus;
  admin_notes?: string;
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TutorApplicationFormData {
  full_name: string;
  phone_number: string;
  subjects: string[];
  specializes_learning_disabilities: boolean;
  additional_notes?: string;
  cv_file?: File;
}

export interface TutorApplicationStats {
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  rejected_applications: number;
  under_review_applications: number;
  applications_this_month: number;
  applications_this_week: number;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

// Authentication error types
export interface AuthError {
  message: string;
  code?: string;
  details?: any;
} 