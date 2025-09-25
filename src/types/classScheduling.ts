// Tutor Class Scheduling System Types

// Class Types (for now, keeping simple structure)
export interface ClassType {
  _id: string;
  id: string; // Alias for _id for backward compatibility
  name: string;
  description?: string;
  duration_minutes?: number;
  max_students?: number;
  price_per_session?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Classes (MongoDB backend structure)
export interface Class {
  _id: string;
  title: string;
  description?: string;
  subjectId?: string; // Reference to Subject
  gradeLevelId?: string; // Reference to GradeLevel
  teacherId: string; // Reference to User
  schedule: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    duration: number; // in minutes
  };
  startDate: string;
  endDate?: string;
  capacity: number;
  enrolledCount: number;
  price?: number;
  currency?: string;
  isActive: boolean;
  isFull: boolean;
  prerequisites?: string[];
  materials?: string[];
  meetingLink?: string;
  jitsiRoomName?: string;
  jitsiPassword?: string;
  roomNumber?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  teacherId_populated?: {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
  };
  subjectId_populated?: {
    _id: string;
    name: string;
    displayName: string;
    color?: string;
  };
  gradeLevelId_populated?: {
    _id: string;
    displayName: string;
  };
}

// Keep TutorClass for backward compatibility (maps to Class)
export interface TutorClass extends Class {
  id: string;
  tutor_id: string;
  class_type_id?: string;
  subject_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  max_students: number;
  current_students: number;
  price_per_session: number;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
  is_recurring?: boolean;
  recurring_pattern?: "daily" | "weekly" | "biweekly" | "monthly";
  recurring_end_date?: string;
  created_at: string;
  updated_at: string;
  jitsi_meeting_url?: string;
  jitsi_room_name?: string;
  jitsi_password?: string;

  // Joined fields
  class_type?: ClassType;
  tutor?: {
    id: string;
    full_name: string;
    email: string;
  };
  subject?: {
    id: string;
    name: string;
    display_name: string;
    color?: string | null;
  };
}

// Bookings (MongoDB backend structure)
export interface Booking {
  _id: string;
  studentId: string;
  teacherId?: string;
  classId?: string;
  bookingType: 'class' | 'session' | 'consultation';
  title: string;
  description?: string;
  subjectId?: string;
  gradeLevelId?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  isConfirmed: boolean;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  price?: number;
  currency?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'cancelled';
  paymentId?: string;
  notes?: string;
  specialRequirements?: string;
  meetingLink?: string;
  roomNumber?: string;
  location?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  studentId_populated?: {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
  };
  teacherId_populated?: {
    _id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
  };
  classId_populated?: Class;
  subjectId_populated?: {
    _id: string;
    name: string;
    displayName: string;
    color?: string;
  };
  gradeLevelId_populated?: {
    _id: string;
    displayName: string;
  };
}

// Keep ClassBooking for backward compatibility (maps to Booking)
export interface ClassBooking extends Booking {
  id: string;
  class_id: string;
  student_id: string;
  booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_amount: number;
  stripe_payment_intent_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  class?: TutorClass;
  student?: {
    id: string;
    full_name: string;
    email: string;
  };
}

// Tutor Availability
export interface TutorAvailability {
  id: string;
  tutor_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Jitsi Meetings
export interface JitsiMeeting {
  id: string;
  tutor_id: string;
  class_id: string;
  room_name: string;
  meeting_url: string;
  password?: string;
  topic?: string;
  start_time?: string;
  duration_minutes?: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Class Reviews
export interface ClassReview {
  id: string;
  class_id: string;
  student_id: string;
  tutor_id: string;
  rating: number; // 1-5
  review_text?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;

  // Joined fields
  student?: {
    id: string;
    full_name: string;
  };
  tutor?: {
    id: string;
    full_name: string;
  };
}

// Form Data Types
export interface CreateClassFormData {
  class_type_id: string;
  subject_id?: string;
  grade_level_id?: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time: string;
  max_students: number;
  price_per_session: number;
  is_recurring: boolean;
  recurring_pattern?: "daily" | "weekly" | "biweekly" | "monthly";
  recurring_end_date?: string;
}

export interface UpdateClassFormData {
  /** The ID of the subject to assign; allows subject changes */
  subject_id?: string | null;
  title?: string;
  description?: string;
  class_type_id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  max_students?: number;
  price_per_session?: number;
  status?: "scheduled" | "in_progress" | "completed" | "cancelled";
}

export interface AvailabilityFormData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// API Response Types
export interface ClassStats {
  total_classes: number;
  upcoming_classes: number;
  completed_classes: number;
  cancelled_classes: number;
  total_earnings: number;
  average_rating: number;
}

export interface BookingStats {
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  total_spent: number;
}

// Calendar Types
export interface CalendarDay {
  date: string;
  day: number;
  month: number;
  year: number;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  hasClasses: boolean;
  classes: TutorClass[];
  isCurrentMonth: boolean;
}

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  existingClass?: TutorClass;
}

// Filter Types
export interface ClassFilters {
  date_from?: string;
  date_to?: string;
  status?: string;
  class_type_id?: string;
  search?: string;
}

export interface BookingFilters {
  date_from?: string;
  date_to?: string;
  booking_status?: string;
  payment_status?: string;
  search?: string;
}

// Dashboard Stats
export interface TutorDashboardStats {
  total_classes: number;
  upcoming_classes: number;
  completed_classes: number;
  total_earnings: number;
  average_rating: number;
  total_students: number;
  classes_this_month: number;
  earnings_this_month: number;
}

export interface StudentDashboardStats {
  total_bookings: number;
  upcoming_bookings: number;
  completed_bookings: number;
  total_spent: number;
  average_rating: number;
  total_tutors: number;
  bookings_this_month: number;
  spent_this_month: number;
  hours_learned: number;
}

// Notification Types
export interface ClassNotification {
  id: string;
  type:
    | "class_reminder"
    | "class_cancelled"
    | "class_updated"
    | "booking_confirmed"
    | "payment_received";
  title: string;
  message: string;
  class_id?: string;
  booking_id?: string;
  is_read: boolean;
  created_at: string;
}

// Payment Types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
  payment_method_types: string[];
}

// Jitsi Integration Types
export interface JitsiMeetingSettings {
  topic: string;
  start_time: string;
  duration: number;
  timezone: string;
  settings: {
    startWithAudioMuted: boolean;
    startWithVideoMuted: boolean;
    enableWelcomePage: boolean;
    enableClosePage: boolean;
    prejoinPageEnabled: boolean;
    requireDisplayName: boolean;
  };
}

// Recurring Class Types
export interface RecurringClassPattern {
  pattern: "daily" | "weekly" | "biweekly" | "monthly";
  end_date: string;
  skip_dates?: string[];
  include_dates?: string[];
}

// Class Search and Discovery
export interface ClassSearchFilters {
  subject?: string;
  date_from?: string;
  date_to?: string;
  price_min?: number;
  price_max?: number;
  duration_min?: number;
  duration_max?: number;
  class_type?: string;
  tutor_rating_min?: number;
  availability?: string[];
}

export interface ClassSearchResult {
  class: TutorClass;
  tutor: {
    id: string;
    full_name: string;
    rating: number;
    total_reviews: number;
    subjects: string[];
  };
  available_slots: number;
  is_bookable: boolean;
}

// Student Session Types
export interface StudentUpcomingSession {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  jitsi_meeting_url?: string;
  jitsi_room_name?: string;
  jitsi_password?: string;
  class_status: "scheduled" | "in_progress" | "completed" | "cancelled";
  booking_status:
    | "pending"
    | "confirmed"
    | "cancelled"
    | "completed"
    | "no_show";
  payment_status: "pending" | "paid" | "refunded" | "failed";
  class_type: string;
  tutor: {
    id: string;
    full_name: string;
    email: string;
  };
}
