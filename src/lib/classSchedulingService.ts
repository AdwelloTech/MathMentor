import { supabase } from "./supabase";
import type {
  ClassType,
  TutorClass,
  ClassBooking,
  TutorAvailability,
  ZoomMeeting,
  ClassReview,
  CreateClassFormData,
  UpdateClassFormData,
  AvailabilityFormData,
  ClassStats,
  BookingStats,
  ClassFilters,
  BookingFilters,
  TutorDashboardStats,
  StudentDashboardStats,
  ClassSearchFilters,
  ClassSearchResult,
} from "@/types/classScheduling";

export const classSchedulingService = {
  // Class Types
  classTypes: {
    getAll: async (): Promise<ClassType[]> => {
      const { data, error } = await supabase
        .from("class_types")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },

    getById: async (id: string): Promise<ClassType> => {
      const { data, error } = await supabase
        .from("class_types")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  },

  // Tutor Classes
  classes: {
    create: async (
      classData: CreateClassFormData & { tutor_id: string }
    ): Promise<TutorClass> => {
      // Get class type details
      const classType = await classSchedulingService.classTypes.getById(
        classData.class_type_id
      );

      // Calculate end time based on duration
      const startTime = new Date(`2000-01-01T${classData.start_time}`);
      const endTime = new Date(
        startTime.getTime() + classType.duration_minutes * 60000
      );
      const endTimeString = endTime.toTimeString().slice(0, 5);

      // Create the class (Zoom will be generated automatically by the trigger)
      const { data: classRecord, error: classError } = await supabase
        .from("tutor_classes")
        .insert([
          {
            tutor_id: classData.tutor_id,
            class_type_id: classData.class_type_id,
            title: classData.title,
            description: classData.description,
            date: classData.date,
            start_time: classData.start_time,
            end_time: endTimeString,
            duration_minutes: classType.duration_minutes,
            max_students: classData.max_students,
            price_per_session: classData.price_per_session,
            is_recurring: classData.is_recurring || false,
            recurring_pattern: classData.recurring_pattern || null,
            recurring_end_date: classData.recurring_end_date || null,
          },
        ])
        .select("*")
        .single();

      if (classError) throw classError;

      // Get the full class data with relationships
      const { data: fullClassRecord, error: fullClassError } = await supabase
        .from("tutor_classes")
        .select(
          `
          *,
          class_type:class_types(*),
          tutor:profiles!user_id(id, full_name, email)
        `
        )
        .eq("id", classRecord.id)
        .single();

      if (fullClassError) throw fullClassError;

      return fullClassRecord;
    },

    getById: async (id: string): Promise<TutorClass> => {
      const { data, error } = await supabase
        .from("tutor_classes")
        .select(
          `
          *,
          class_type:class_types(*),
          tutor:profiles!user_id(id, full_name, email)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },

    getByTutorId: async (
      tutorId: string,
      filters?: ClassFilters
    ): Promise<TutorClass[]> => {
      let query = supabase
        .from("tutor_classes")
        .select(
          `
          *,
          class_type:class_types(*),
          tutor:profiles!user_id(id, full_name, email)
        `
        )
        .eq("tutor_id", tutorId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (filters?.date_from) {
        query = query.gte("date", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("date", filters.date_to);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.class_type_id) {
        query = query.eq("class_type_id", filters.class_type_id);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    getUpcomingByTutorId: async (tutorId: string): Promise<TutorClass[]> => {
      const { data, error } = await supabase
        .from("tutor_classes")
        .select(
          `
          *,
          class_type:class_types(*),
          tutor:profiles!user_id(id, full_name, email)
        `
        )
        .eq("tutor_id", tutorId)
        .gte(
          "date",
          (() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          })()
        )
        .eq("status", "scheduled")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },

    update: async (
      id: string,
      updates: UpdateClassFormData
    ): Promise<TutorClass> => {
      const { data, error } = await supabase
        .from("tutor_classes")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          class_type:class_types(*),
          tutor:profiles!user_id(id, full_name, email)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },

    delete: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("tutor_classes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },

    cancel: async (id: string): Promise<TutorClass> => {
      return await classSchedulingService.classes.update(id, {
        status: "cancelled",
      });
    },

    // Get available classes for students to book
    getAvailableClasses: async (
      filters?: ClassSearchFilters
    ): Promise<ClassSearchResult[]> => {
      let query = supabase
        .from("tutor_classes")
        .select(
          `
          *,
          class_type:class_types(*),
          tutor:profiles!user_id(id, full_name, email)
        `
        )
        .eq("status", "scheduled")
        .gte(
          "date",
          (() => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, "0");
            const day = String(today.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          })()
        )
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (filters?.date_from) {
        query = query.gte("date", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("date", filters.date_to);
      }
      if (filters?.price_min) {
        query = query.gte("price_per_session", filters.price_min);
      }
      if (filters?.price_max) {
        query = query.lte("price_per_session", filters.price_max);
      }
      if (filters?.class_type) {
        query = query.eq("class_types.name", filters.class_type);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Extract unique tutor IDs for batch queries
      const tutorIds = [
        ...new Set(
          data
            .map((classRecord) => classRecord.tutor?.id || classRecord.tutor_id)
            .filter((id) => id) // Remove any null/undefined IDs
        ),
      ];

      // Batch fetch all tutor ratings
      const { data: allReviews } = await supabase
        .from("session_ratings")
        .select("tutor_id, rating")
        .in("tutor_id", tutorIds);

      // Group ratings by tutor_id
      const ratingsMap = new Map<string, number[]>();
      allReviews?.forEach((review) => {
        if (!ratingsMap.has(review.tutor_id)) {
          ratingsMap.set(review.tutor_id, []);
        }
        ratingsMap.get(review.tutor_id)!.push(review.rating);
      });

      // Batch fetch all tutor profiles for subjects
      const { data: tutorProfiles } = await supabase
        .from("profiles")
        .select("id, subjects")
        .in("id", tutorIds);

      // Create subjects map
      const subjectsMap = new Map<string, string[]>();
      tutorProfiles?.forEach((profile) => {
        subjectsMap.set(profile.id, profile.subjects || []);
      });

      // Transform to search results using batched data
      const results: ClassSearchResult[] = data.map((classRecord) => {
        const tutorId = classRecord.tutor?.id || classRecord.tutor_id;
        const ratings = ratingsMap.get(tutorId) || [];
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;

        const subjects = subjectsMap.get(tutorId) || [];

        return {
          class: classRecord,
          tutor: {
            id: tutorId,
            full_name: classRecord.tutor?.full_name || "",
            rating: averageRating,
            total_reviews: ratings.length,
            subjects: subjects,
          },
          available_slots:
            classRecord.max_students - classRecord.current_students,
          is_bookable: classRecord.current_students < classRecord.max_students,
        };
      });

      return results;
    },
  },

  // Class Bookings
  bookings: {
    create: async (
      classId: string,
      studentId: string,
      paymentAmount: number,
      stripePaymentIntentId?: string
    ): Promise<ClassBooking> => {
      // Check if class is available
      const classRecord = await classSchedulingService.classes.getById(classId);
      if (classRecord.current_students >= classRecord.max_students) {
        throw new Error("Class is full");
      }

      // Create booking
      const { data, error } = await supabase
        .from("class_bookings")
        .insert([
          {
            class_id: classId,
            student_id: studentId,
            payment_amount: paymentAmount,
            booking_status: "confirmed",
            payment_status: stripePaymentIntentId ? "paid" : "pending",
            stripe_payment_intent_id: stripePaymentIntentId || null,
          },
        ])
        .select(
          `
          *,
          class:tutor_classes(
            *,
            class_type:class_types(*),
            tutor:profiles!user_id(id, full_name, email)
          ),
          student:profiles!class_bookings_student_id_fkey(id, full_name, email)
        `
        )
        .single();

      if (error) throw error;

      // Update class current_students count
      await supabase
        .from("tutor_classes")
        .update({ current_students: classRecord.current_students + 1 })
        .eq("id", classId);

      return data;
    },

    getByStudentId: async (
      studentId: string,
      filters?: BookingFilters
    ): Promise<ClassBooking[]> => {
      let query = supabase
        .from("class_bookings")
        .select(
          `
          *,
          class:tutor_classes(
            *,
            class_type:class_types(*),
            tutor:profiles!user_id(id, full_name, email)
          ),
          student:profiles!class_bookings_student_id_fkey(id, full_name, email)
        `
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (filters?.booking_status) {
        query = query.eq("booking_status", filters.booking_status);
      }
      if (filters?.payment_status) {
        query = query.eq("payment_status", filters.payment_status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    getByClassId: async (classId: string): Promise<ClassBooking[]> => {
      const { data, error } = await supabase
        .from("class_bookings")
        .select(
          `
          *,
          class:tutor_classes(
            *,
            class_type:class_types(*),
            tutor:profiles!user_id(id, full_name, email)
          ),
          student:profiles!class_bookings_student_id_fkey(id, full_name, email)
        `
        )
        .eq("class_id", classId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },

    update: async (
      id: string,
      updates: Partial<ClassBooking>
    ): Promise<ClassBooking> => {
      const { data, error } = await supabase
        .from("class_bookings")
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          class:tutor_classes(
            *,
            class_type:class_types(*),
            tutor:profiles!user_id(id, full_name, email)
          ),
          student:profiles!class_bookings_student_id_fkey(id, full_name, email)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },

    cancel: async (id: string): Promise<ClassBooking> => {
      const booking = await classSchedulingService.bookings.update(id, {
        booking_status: "cancelled",
      });

      // Decrease class current_students count
      if (booking.class) {
        await supabase
          .from("tutor_classes")
          .update({ current_students: booking.class.current_students - 1 })
          .eq("id", booking.class_id);
      }

      return booking;
    },
  },

  // Tutor Availability
  availability: {
    getByTutorId: async (tutorId: string): Promise<TutorAvailability[]> => {
      const { data, error } = await supabase
        .from("tutor_availability")
        .select("*")
        .eq("tutor_id", tutorId)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      return data;
    },

    update: async (
      tutorId: string,
      availability: AvailabilityFormData[]
    ): Promise<TutorAvailability[]> => {
      // Delete existing availability
      await supabase
        .from("tutor_availability")
        .delete()
        .eq("tutor_id", tutorId);

      // Insert new availability
      const { data, error } = await supabase
        .from("tutor_availability")
        .insert(availability.map((a) => ({ ...a, tutor_id: tutorId })))
        .select("*")
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      return data;
    },

    checkAvailability: async (
      tutorId: string,
      date: string,
      startTime: string,
      endTime: string
    ): Promise<boolean> => {
      const { data, error } = await supabase.rpc("check_tutor_availability", {
        p_tutor_id: tutorId,
        p_date: date,
        p_start_time: startTime,
        p_end_time: endTime,
      });

      if (error) throw error;
      return data;
    },
  },

  // Class Reviews
  reviews: {
    create: async (review: {
      class_id: string;
      student_id: string;
      tutor_id: string;
      rating: number;
      review_text?: string;
      is_anonymous?: boolean;
    }): Promise<ClassReview> => {
      const { data, error } = await supabase
        .from("class_reviews")
        .insert([review])
        .select(
          `
          *,
          student:profiles!class_reviews_student_id_fkey(id, full_name),
          tutor:profiles!class_reviews_tutor_id_fkey(id, full_name)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },

    getByTutorId: async (tutorId: string): Promise<ClassReview[]> => {
      const { data, error } = await supabase
        .from("class_reviews")
        .select(
          `
          *,
          student:profiles!class_reviews_student_id_fkey(id, full_name),
          tutor:profiles!class_reviews_tutor_id_fkey(id, full_name)
        `
        )
        .eq("tutor_id", tutorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    getByClassId: async (classId: string): Promise<ClassReview[]> => {
      const { data, error } = await supabase
        .from("class_reviews")
        .select(
          `
          *,
          student:profiles!class_reviews_student_id_fkey(id, full_name),
          tutor:profiles!class_reviews_tutor_id_fkey(id, full_name)
        `
        )
        .eq("class_id", classId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  },

  // Statistics
  stats: {
    getTutorStats: async (tutorId: string): Promise<TutorDashboardStats> => {
      // Get class statistics
      const { data: classes } = await supabase
        .from("tutor_classes")
        .select("id, status, price_per_session, current_students")
        .eq("tutor_id", tutorId);

      // Get review statistics from session_ratings table
      const { data: reviews } = await supabase
        .from("session_ratings")
        .select("rating")
        .eq("tutor_id", tutorId);

      // Calculate stats
      const totalClasses = classes?.length || 0;
      const upcomingClasses =
        classes?.filter((c) => c.status === "scheduled").length || 0;
      const completedClasses =
        classes?.filter((c) => c.status === "completed").length || 0;
      const totalEarnings =
        classes
          ?.filter((c) => c.status === "completed")
          .reduce(
            (sum, c) => sum + c.price_per_session * c.current_students,
            0
          ) || 0;

      const ratings = reviews?.map((r) => r.rating) || [];
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      // Get unique students count
      const { data: uniqueStudents } = await supabase
        .from("class_bookings")
        .select("student_id")
        .in("class_id", classes?.map((c) => c.id) || []);

      const totalStudents = new Set(uniqueStudents?.map((b) => b.student_id))
        .size;

      // Get this month's stats
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: thisMonthClasses } = await supabase
        .from("tutor_classes")
        .select("price_per_session, current_students")
        .eq("tutor_id", tutorId)
        .gte(
          "date",
          (() => {
            const year = firstDayOfMonth.getFullYear();
            const month = String(firstDayOfMonth.getMonth() + 1).padStart(
              2,
              "0"
            );
            const day = String(firstDayOfMonth.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          })()
        )
        .lte(
          "date",
          (() => {
            const year = lastDayOfMonth.getFullYear();
            const month = String(lastDayOfMonth.getMonth() + 1).padStart(
              2,
              "0"
            );
            const day = String(lastDayOfMonth.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          })()
        );

      const classesThisMonth = thisMonthClasses?.length || 0;
      const earningsThisMonth =
        thisMonthClasses?.reduce(
          (sum, c) => sum + c.price_per_session * c.current_students,
          0
        ) || 0;

      return {
        total_classes: totalClasses,
        upcoming_classes: upcomingClasses,
        completed_classes: completedClasses,
        total_earnings: totalEarnings,
        average_rating: averageRating,
        total_reviews: ratings.length,
        total_students: totalStudents,
        classes_this_month: classesThisMonth,
        earnings_this_month: earningsThisMonth,
      };
    },

    getStudentStats: async (
      studentId: string
    ): Promise<StudentDashboardStats> => {
      // Get booking statistics
      const { data: bookings } = await supabase
        .from("class_bookings")
        .select("booking_status, payment_amount, payment_status")
        .eq("student_id", studentId);

      // Calculate stats
      const totalBookings = bookings?.length || 0;
      const upcomingBookings =
        bookings?.filter((b) => b.booking_status === "confirmed").length || 0;
      const completedBookings =
        bookings?.filter((b) => b.booking_status === "completed").length || 0;
      const totalSpent =
        bookings
          ?.filter((b) => b.payment_status === "paid")
          .reduce((sum, b) => sum + b.payment_amount, 0) || 0;

      // Get unique tutors count
      const { data: uniqueTutors } = await supabase
        .from("class_bookings")
        .select(
          `
          class:tutor_classes(tutor_id)
        `
        )
        .eq("student_id", studentId);

      const totalTutors = new Set(
        uniqueTutors?.map((b: any) => b.class?.tutor_id).filter(Boolean)
      ).size;

      // Get this month's stats
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data: thisMonthBookings } = await supabase
        .from("class_bookings")
        .select("payment_amount")
        .eq("student_id", studentId)
        .gte("created_at", firstDayOfMonth.toISOString())
        .lte("created_at", lastDayOfMonth.toISOString());

      const bookingsThisMonth = thisMonthBookings?.length || 0;
      const spentThisMonth =
        thisMonthBookings?.reduce((sum, b) => sum + b.payment_amount, 0) || 0;

      return {
        total_bookings: totalBookings,
        upcoming_bookings: upcomingBookings,
        completed_bookings: completedBookings,
        total_spent: totalSpent,
        average_rating: 0, // Would need to calculate from reviews
        total_tutors: totalTutors,
        bookings_this_month: bookingsThisMonth,
        spent_this_month: spentThisMonth,
      };
    },
  },

  // Jitsi Integration
  jitsi: {
    getMeetingDetails: async (
      classId: string
    ): Promise<JitsiMeeting | null> => {
      const { data, error } = await supabase
        .from("jitsi_meetings")
        .select("*")
        .eq("class_id", classId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },

    generateMeeting: async (
      tutorId: string,
      classId: string,
      title: string,
      durationMinutes: number = 60
    ): Promise<any> => {
      const { data, error } = await supabase.rpc("generate_jitsi_meeting", {
        p_tutor_id: tutorId,
        p_class_id: classId,
        p_topic: title,
        p_duration_minutes: durationMinutes,
      });

      if (error) throw error;
      return data;
    },

    generateManualMeeting: async (classId: string): Promise<any> => {
      const { data, error } = await supabase.rpc(
        "manual_generate_jitsi_for_class",
        {
          class_uuid: classId,
        }
      );

      if (error) throw error;
      return data;
    },
  },
};
