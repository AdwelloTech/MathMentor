// Database types generated from Supabase schema
export interface Database {
  public: {
    Tables: {
      profile_images: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          profile_id: string;
          file_name: string;
          original_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          width?: number | null;
          height?: number | null;
          is_active?: boolean;
          uploaded_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          profile_id?: string;
          file_name?: string;
          original_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          width?: number | null;
          height?: number | null;
          is_active?: boolean;
          uploaded_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      grade_levels: {
        Row: {
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
        };
        Insert: {
          id?: string;
          code: string;
          display_name: string;
          sort_order: number;
          category?:
            | "preschool"
            | "elementary"
            | "middle"
            | "high"
            | "college"
            | "graduate";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          display_name?: string;
          sort_order?: number;
          category?:
            | "preschool"
            | "elementary"
            | "middle"
            | "high"
            | "college"
            | "graduate";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          role: string;
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
          subjects: string[] | null;
          qualification: string | null;
          experience_years: number | null;
          // Student specific fields
          age: number | null;
          current_grade: string | null; // Renamed from grade_level
          grade_level_id: string | null; // New foreign key reference
          academic_set: string | null; // New set classification field
          has_learning_disabilities: boolean;
          learning_needs_description: string | null;

          // Parent contact information
          parent_name: string | null;
          parent_phone: string | null;
          parent_email: string | null;

          // Location information (replacing full address)
          city: string | null;
          postcode: string | null;
          school_name: string | null;
          // Profile image fields
          profile_image_id: string | null;
          profile_image_url: string | null;
          // Tutor specific fields
          cv_url: string | null;
          cv_file_name: string | null;
          specializations: string[] | null;
          hourly_rate: number | null;
          availability: string | null;
          bio: string | null;
          certifications: string[] | null;
          languages: string[] | null;
          profile_completed: boolean | null;
          // Parent specific fields
          children_ids: string[] | null;
          relationship: string | null;
          hire_date: string | null;
          salary: number | null;
          position: string | null;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          role: string;
          avatar_url?: string | null;
          phone?: string | null;
          address?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          emergency_contact?: string | null;
          student_id?: string | null;
          package?: string | null;
          class_id?: string | null;
          employee_id?: string | null;
          department?: string | null;
          subjects?: string[] | null;
          qualification?: string | null;
          experience_years?: number | null;
          // Student specific fields
          age?: number | null;
          current_grade?: string | null; // Renamed from grade_level
          grade_level_id?: string | null; // New foreign key reference
          has_learning_disabilities?: boolean;
          learning_needs_description?: string | null;
          // Profile image fields
          profile_image_id?: string | null;
          profile_image_url?: string | null;
          // Tutor specific fields
          cv_url?: string | null;
          cv_file_name?: string | null;
          specializations?: string[] | null;
          hourly_rate?: number | null;
          availability?: string | null;
          bio?: string | null;
          certifications?: string[] | null;
          languages?: string[] | null;
          profile_completed?: boolean | null;
          // Parent specific fields
          children_ids?: string[] | null;
          relationship?: string | null;
          hire_date?: string | null;
          salary?: number | null;
          position?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          full_name?: string;
          role?: string;
          avatar_url?: string | null;
          phone?: string | null;
          address?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          emergency_contact?: string | null;
          student_id?: string | null;
          package?: string | null;
          class_id?: string | null;
          employee_id?: string | null;
          department?: string | null;
          subjects?: string[] | null;
          qualification?: string | null;
          experience_years?: number | null;
          // Student specific fields
          age?: number | null;
          grade_level?: string | null; // Keep for backwards compatibility
          grade_level_id?: string | null; // New foreign key reference
          has_learning_disabilities?: boolean;
          learning_needs_description?: string | null;
          // Profile image fields
          profile_image_id?: string | null;
          profile_image_url?: string | null;
          // Tutor specific fields
          cv_url?: string | null;
          cv_file_name?: string | null;
          specializations?: string[] | null;
          hourly_rate?: number | null;
          availability?: string | null;
          bio?: string | null;
          certifications?: string[] | null;
          languages?: string[] | null;
          profile_completed?: boolean | null;
          // Parent specific fields
          children_ids?: string[] | null;
          relationship?: string | null;
          hire_date?: string | null;
          salary?: number | null;
          position?: string | null;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          teacher_id: string | null;
          capacity: number | null;
          schedule: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          teacher_id?: string | null;
          capacity?: number | null;
          schedule?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          teacher_id?: string | null;
          capacity?: number | null;
          schedule?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string | null;
          class_id: string | null;
          booking_type: string;
          start_time: string;
          end_time: string;
          status: string;
          zoom_link: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id?: string | null;
          class_id?: string | null;
          booking_type: string;
          start_time: string;
          end_time: string;
          status?: string;
          zoom_link?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          teacher_id?: string | null;
          class_id?: string | null;
          booking_type?: string;
          start_time?: string;
          end_time?: string;
          status?: string;
          zoom_link?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          class_id: string | null;
          booking_id: string | null;
          date: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id?: string | null;
          booking_id?: string | null;
          date: string;
          status: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string | null;
          booking_id?: string | null;
          date?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      grades: {
        Row: {
          id: string;
          student_id: string;
          class_id: string | null;
          assignment_id: string | null;
          grade: number;
          max_grade: number;
          percentage: number;
          letter_grade: string | null;
          notes: string | null;
          graded_by: string;
          graded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id?: string | null;
          assignment_id?: string | null;
          grade: number;
          max_grade: number;
          percentage: number;
          letter_grade?: string | null;
          notes?: string | null;
          graded_by: string;
          graded_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string | null;
          assignment_id?: string | null;
          grade?: number;
          max_grade?: number;
          percentage?: number;
          letter_grade?: string | null;
          notes?: string | null;
          graded_by?: string;
          graded_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string | null;
          recipient_role: string | null;
          subject: string;
          content: string;
          is_read: boolean;
          is_important: boolean;
          message_type: string;
          parent_id: string | null;
          attachments: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id?: string | null;
          recipient_role?: string | null;
          subject: string;
          content: string;
          is_read?: boolean;
          is_important?: boolean;
          message_type?: string;
          parent_id?: string | null;
          attachments?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string | null;
          recipient_role?: string | null;
          subject?: string;
          content?: string;
          is_read?: boolean;
          is_important?: boolean;
          message_type?: string;
          parent_id?: string | null;
          attachments?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      note_subjects: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          color: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description?: string | null;
          color?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          description?: string | null;
          color?: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_notes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          content: string;
          subject_id: string | null;
          grade_level_id: string | null;
          created_by: string;
          is_public: boolean;
          tags: string[] | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          content: string;
          subject_id?: string | null;
          grade_level_id?: string | null;
          created_by: string;
          is_public?: boolean;
          tags?: string[] | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          content?: string;
          subject_id?: string | null;
          grade_level_id?: string | null;
          created_by?: string;
          is_public?: boolean;
          tags?: string[] | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      tutor_notes: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          content: string | null;
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          subject_id: string | null;
          grade_level_id: string | null;
          created_by: string;
          is_premium: boolean;
          is_active: boolean;
          view_count: number;
          download_count: number;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          content?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          subject_id?: string | null;
          grade_level_id?: string | null;
          created_by: string;
          is_premium?: boolean;
          is_active?: boolean;
          view_count?: number;
          download_count?: number;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          content?: string | null;
          file_url?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          subject_id?: string | null;
          grade_level_id?: string | null;
          created_by?: string;
          is_premium?: boolean;
          is_active?: boolean;
          view_count?: number;
          download_count?: number;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      package_pricing: {
        Row: {
          id: string;
          package_type: string;
          display_name: string;
          price_monthly: number;
          price_yearly: number;
          features: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          package_type: string;
          display_name: string;
          price_monthly: number;
          price_yearly: number;
          features: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          package_type?: string;
          display_name?: string;
          price_monthly?: number;
          price_yearly?: number;
          features?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search_study_notes: {
        Args: {
          search_term?: string;
          subject_filter?: string;
          grade_filter?: string;
        };
        Returns: {
          id: string;
          title: string;
          description: string | null;
          content: string;
          subject_name: string | null;
          subject_display_name: string | null;
          subject_color: string | null;
          grade_level_code: string | null;
          grade_level_display: string | null;
          created_by: string;
          is_public: boolean;
          view_count: number;
          created_at: string;
        }[];
      };
      increment_note_view_count: {
        Args: {
          note_id: string;
        };
        Returns: void;
      };
      increment_tutor_note_view_count: {
        Args: {
          note_id: string;
        };
        Returns: void;
      };
      increment_tutor_note_download_count: {
        Args: {
          note_id: string;
        };
        Returns: void;
      };
      search_tutor_notes: {
        Args: {
          search_term?: string;
          subject_filter?: string;
          premium_only?: boolean;
          tutor_id?: string;
        };
        Returns: {
          id: string;
          title: string;
          description: string | null;
          content: string | null;
          file_url: string | null;
          file_name: string | null;
          file_size: number | null;
          subject_id: string | null;
          subject_name: string | null;
          subject_display_name: string | null;
          subject_color: string | null;
          grade_level_id: string | null;
          grade_level_code: string | null;
          grade_level_display: string | null;
          created_by: string;
          is_premium: boolean;
          view_count: number;
          download_count: number;
          tags: string[] | null;
          created_at: string;
        }[];
      };
    };
    Enums: {
      user_role:
        | "admin"
        | "principal"
        | "teacher"
        | "student"
        | "parent"
        | "hr"
        | "finance"
        | "support";
      student_package: "free" | "silver" | "gold";
      booking_type: "one_to_one" | "group_class" | "consultation";
      booking_status: "pending" | "confirmed" | "completed" | "cancelled";
      attendance_status: "present" | "absent" | "late" | "excused";
      message_type: "direct" | "announcement" | "system";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
