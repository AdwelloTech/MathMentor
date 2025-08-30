// User roles
export type UserRole =
  | "admin"
  | "principal"
  | "teacher"
  | "student"
  | "parent"
  | "hr"
  | "finance"
  | "support"
  | "tutor";

// Student packages
export type StudentPackage = "free" | "silver" | "gold";

// Profile image interface from database
export interface ProfileImage {
  id: string;
  user_id: string;
  profile_id: string;
  file_name: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  is_active: boolean;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

// Grade level interface from database
export interface GradeLevel {
  id: string;
  code: string;
  display_name: string;
  sort_order: number;
  category:
    | "preschool"
    | "elementary"
    | "middle"
    | "high"
    | "college"
    | "graduate";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  gender?: "male" | "female" | "other";
  emergency_contact?: string;

  // Student specific fields
  student_id?: string;
  package?: StudentPackage;
  class_id?: string;
  age?: number;
  current_grade?: string; // Renamed from grade_level
  grade_level_id?: string; // New foreign key reference
  academic_set?: "Set 1" | "Set 2" | "Set 3" | "Set 4 (Foundation)"; // New set classification
  has_learning_disabilities?: boolean;
  learning_needs_description?: string;

  // Parent contact information
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;

  // Location information (replacing full address)
  city?: string;
  postcode?: string;
  school_name?: string;

  // Profile image fields
  profile_image_id?: string;
  profile_image_url?: string;

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
  is_online?: boolean;
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
  signUp: (
    email: string,
    password: string,
    userData: Partial<UserProfile>
  ) => Promise<void>;
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

  gender?: "male" | "female" | "other";
  emergencyContact?: string;
}

// Student profile form data with database-driven grade levels
export interface StudentProfileFormData extends ProfileUpdateFormData {
  email: string; // Display only
  age?: number;
  gradeLevelId?: string; // Use database ID instead of code
  currentGrade?: string; // Renamed from grade_level
  academicSet?: "Set 1" | "Set 2" | "Set 3" | "Set 4 (Foundation)"; // New set classification
  hasLearningDisabilities: boolean;
  learningNeedsDescription?: string;

  // Parent contact information
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;

  // Location information (replacing full address)
  city?: string;
  postcode?: string;
  schoolName?: string;
}

// Extended profile with grade level information
export interface ProfileWithGradeLevel extends UserProfile {
  grade_level_info?: GradeLevel;
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
export type TutorApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "under_review";

export interface TutorApplication {
  id: string;
  user_id: string;
  applicant_email: string;
  full_name: string;
  phone_number: string;
  subjects: string[];
  specializes_learning_disabilities: boolean;
  cv_file_name: string; // Now mandatory
  cv_url: string; // Now mandatory
  cv_file_size?: number;
  additional_notes?: string;

  // New required fields
  postcode: string;
  based_in_country: string;

  // New optional fields
  past_experience?: string;
  weekly_availability?: string;
  employment_status?: string;
  education_level?: string;
  average_weekly_hours?: number;
  expected_hourly_rate?: number;

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

  // New required fields
  postcode: string;
  based_in_country: string;

  // New optional fields
  past_experience?: string;
  weekly_availability?: string;
  employment_status?: string;
  education_level?: string;
  average_weekly_hours?: number;
  expected_hourly_rate?: number;
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

// Profile image upload data
export interface ProfileImageUpload {
  file: File;
  preview?: string;
}

// Profile image upload response
export interface ProfileImageUploadResponse {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  width?: number;
  height?: number;
  public_url: string;
}
