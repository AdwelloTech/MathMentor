import { supabase } from "./supabase";
import type {
  ClassType,
  TutorClass,
  ClassBooking,
  TutorAvailability,
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
  JitsiMeeting,
} from "@/types/classScheduling";

/**
 * Database Functions Required for Atomic Operations:
 *
 * These PostgreSQL functions need to be created in the database for the atomic booking operations:
 *
 * 1. book_class_atomic(p_class_id, p_student_id, p_payment_amount, p_stripe_payment_intent_id, p_payment_status)
 *    - Atomically checks class capacity and creates booking in a single transaction
 *    - Returns the created booking record or throws error if class is full
 *
 * 2. cancel_booking_atomic(p_booking_id, p_class_id)
 *    - Atomically updates booking status and decrements current_students
 *    - Prevents double-cancellation and ensures data consistency
 *
 * Example SQL for book_class_atomic:
 * ```sql
 * CREATE OR REPLACE FUNCTION book_class_atomic(
 *   p_class_id UUID,
 *   p_student_id UUID,
 *   p_payment_amount NUMERIC,
 *   p_stripe_payment_intent_id TEXT,
 *   p_payment_status TEXT
 * ) RETURNS class_bookings
 * LANGUAGE plpgsql
 * AS $$
 * DECLARE
 *   v_booking class_bookings;
 * BEGIN
 *   -- Atomically check capacity and increment counter
 *   UPDATE tutor_classes
 *      SET current_students = current_students + 1
 *    WHERE id = p_class_id
 *      AND current_students < max_students;
 *
 *   IF NOT FOUND THEN
 *     RAISE EXCEPTION 'Class is full' USING ERRCODE = 'P0001';
 *   END IF;
 *
 *   -- Create the booking
 *   INSERT INTO class_bookings(
 *     class_id, student_id, payment_amount,
 *     stripe_payment_intent_id, payment_status,
 *     booking_status
 *   )
 *   VALUES (
 *     p_class_id, p_student_id, p_payment_amount,
 *     p_stripe_payment_intent_id, p_payment_status,
 *     'confirmed'
 *   )
 *   RETURNING * INTO v_booking;
 *
 *   RETURN v_booking;
 * END;
 * $$;
 * ```
 */

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
      // Validate subject_id if provided to prevent foreign key constraint errors
      // This ensures the subject exists and is active before creating the class
      if (classData.subject_id) {
        const { data: subjectData, error: subjectError } = await supabase
          .from("subjects")
          .select("id")
          .eq("id", classData.subject_id)
          .eq("is_active", true)
          .single();

        if (subjectError || !subjectData) {
          throw new Error(
            `Invalid subject selected. Please select a valid subject.`
          );
        }
      }

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
            subject_id: classData.subject_id ?? null,
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
          tutor:profiles(id, full_name, email),
          subject:subjects(id, name, display_name, color)
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
          tutor:profiles(id, full_name, email),
          subject:subjects(id, name, display_name, color)
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
          tutor:profiles(id, full_name, email),
          subject:subjects(id, name, display_name, color)
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
          tutor:profiles(id, full_name, email),
          subject:subjects(id, name, display_name, color)
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
          tutor:profiles(id, full_name, email),
          subject:subjects(id, name, display_name, color)
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
          tutor:profiles(id, full_name, email),
          subject:subjects(id, name, display_name, color)
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

      // Transform to search results with additional info
      const results: ClassSearchResult[] = await Promise.all(
        data.map(async (classRecord) => {
          // Get tutor rating and reviews from session_ratings table
          const { data: reviews } = await supabase
            .from("session_ratings")
            .select("rating")
            .eq("tutor_id", classRecord.tutor_id);

          const ratings = reviews?.map((r) => r.rating) || [];
          const averageRating =
            ratings.length > 0
              ? ratings.reduce((a, b) => a + b, 0) / ratings.length
              : 0;

          // Get tutor subjects
          const { data: tutorProfile } = await supabase
            .from("profiles")
            .select("subjects")
            .eq("user_id", classRecord.tutor_id)
            .single();

          const subjects = tutorProfile?.subjects || [];

          return {
            class: classRecord,
            tutor: {
              id: classRecord.tutor_id,
              full_name: classRecord.tutor?.full_name || "",
              rating: averageRating,
              total_reviews: ratings.length,
              subjects: subjects,
            },
            available_slots:
              classRecord.max_students - classRecord.current_students,
            is_bookable:
              classRecord.current_students < classRecord.max_students,
          };
        })
      );

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
      try {
        // First, check if the class has available spots
        const { data: classData, error: classError } = await supabase
          .from("tutor_classes")
          .select("current_students, max_students")
          .eq("id", classId)
          .single();

        if (classError) throw classError;
        if (!classData) throw new Error("Class not found");

        if (classData.current_students >= classData.max_students) {
          throw new Error("Class is full");
        }

        // Create the booking
        const { data: bookingData, error: bookingError } = await supabase
          .from("class_bookings")
          .insert({
            class_id: classId,
            student_id: studentId,
            payment_amount: paymentAmount,
            stripe_payment_intent_id: stripePaymentIntentId || null,
            payment_status: stripePaymentIntentId ? "paid" : "pending",
            booking_status: "confirmed",
          })
          .select()
          .single();

        if (bookingError) throw bookingError;

        // Update the class to increment current_students
        const { error: updateError } = await supabase
          .from("tutor_classes")
          .update({
            current_students: (classData.current_students || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", classId);

        if (updateError) throw updateError;

        // Fetch the complete booking data with relations
        const { data: completeBookingData, error: fetchError } = await supabase
          .from("class_bookings")
          .select(
            `
            *,
            class:tutor_classes(
              *,
              class_type:class_types(*),
              tutor:profiles(id, full_name, email),
              subject:subjects(id, name, display_name, color)
            ),
            student:profiles!class_bookings_student_id_fkey(id, full_name, email)
          `
          )
          .eq("id", bookingData.id)
          .single();

        if (fetchError) throw fetchError;

        return completeBookingData;
      } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
      }
    },

    getById: async (id: string): Promise<ClassBooking> => {
      const { data, error } = await supabase
        .from("class_bookings")
        .select(
          `
          *,
          class:tutor_classes(
            *,
            class_type:class_types(*),
            tutor:profiles(id, full_name, email),
            subject:subjects(id, name, display_name, color)
          ),
          student:profiles!class_bookings_student_id_fkey(id, full_name, email)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
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
            tutor:profiles(id, full_name, email),
            subject:subjects(id, name, display_name, color)
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
            tutor:profiles(id, full_name, email),
            subject:subjects(id, name, display_name, color)
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
            tutor:profiles(id, full_name, email),
            subject:subjects(id, name, display_name, color)
          ),
          student:profiles!class_bookings_student_id_fkey(id, full_name, email)
        `
        )
        .single();

      if (error) throw error;
      return data;
    },

    cancel: async (id: string): Promise<ClassBooking> => {
      try {
        // Get the booking first to get class_id
        const existingBooking = await classSchedulingService.bookings.getById(
          id
        );

        if (!existingBooking) {
          throw new Error("Booking not found");
        }

        // Try atomic RPC first
        const { error: rpcError } = await supabase.rpc(
          "cancel_booking_atomic",
          {
            p_booking_id: id,
            p_class_id: existingBooking.class_id,
          }
        );

        if (rpcError) {
          // Graceful fallback if RPC does not exist or is not exposed
          const rpcMissing =
            rpcError.code === "42883" ||
            rpcError.message?.includes("Could not find the function") ||
            rpcError.message?.includes(
              "function public.cancel_booking_atomic"
            ) ||
            rpcError.message?.includes("cancel_booking_atomic");

          if (!rpcMissing) {
            // Other errors (e.g., permission), rethrow
            if (
              rpcError.message?.includes("Booking not found") ||
              rpcError.code === "PGRST116"
            ) {
              throw new Error("Booking not found or already cancelled");
            }
            throw rpcError;
          }

          // Fallback path: update booking then decrement class count
          // 1) Update booking status to cancelled (idempotent-ish)
          const updated = await classSchedulingService.bookings.update(id, {
            booking_status: "cancelled",
          });

          // 2) Decrement class current_students safely
          if (updated.class_id) {
            const { data: classRow, error: classFetchErr } = await supabase
              .from("tutor_classes")
              .select("current_students")
              .eq("id", updated.class_id)
              .single();
            if (classFetchErr) throw classFetchErr;

            const newCount = Math.max((classRow?.current_students || 1) - 1, 0);
            const { error: classUpdateErr } = await supabase
              .from("tutor_classes")
              .update({
                current_students: newCount,
                updated_at: new Date().toISOString(),
              })
              .eq("id", updated.class_id);
            if (classUpdateErr) throw classUpdateErr;
          }

          // Return the full, updated booking
          return await classSchedulingService.bookings.getById(id);
        }

        // If RPC succeeded, fetch and return the updated record
        const { data: updatedBooking, error: fetchError } = await supabase
          .from("class_bookings")
          .select(
            `
            *,
            class:tutor_classes(
              *,
              class_type:class_types(*),
              tutor:profiles(id, full_name, email),
              subject:subjects(id, name, display_name, color)
            ),
            student:profiles!class_bookings_student_id_fkey(id, full_name, email)
          `
          )
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;

        return updatedBooking;
      } catch (error) {
        console.error("Error cancelling booking:", error);
        throw error;
      }
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
        .from("session_ratings")
        .insert([review])
        .select(
          `
           *,
           student:profiles!session_ratings_student_id_fkey(id, full_name),
           tutor:profiles!session_ratings_tutor_id_fkey(id, full_name)
         `
        )
        .single();

      if (error) throw error;
      return data;
    },

    getByTutorId: async (tutorId: string): Promise<ClassReview[]> => {
      const { data, error } = await supabase
        .from("session_ratings")
        .select(
          `
           *,
           student:profiles!session_ratings_student_id_fkey(id, full_name),
           tutor:profiles!session_ratings_tutor_id_fkey(id, full_name)
         `
        )
        .eq("tutor_id", tutorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },

    getByClassId: async (classId: string): Promise<ClassReview[]> => {
      const { data, error } = await supabase
        .from("session_ratings")
        .select(
          `
           *,
           student:profiles!session_ratings_student_id_fkey(id, full_name),
           tutor:profiles!session_ratings_tutor_id_fkey(id, full_name)
         `
        )
        .eq("session_id", classId)
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
        .select(
          `
          booking_status,
          payment_amount,
          payment_status,
          class:tutor_classes(start_time, end_time)
        `
        )
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

      // Calculate total hours learned from completed bookings using class duration
      const totalMinutesLearned =
        bookings
          ?.filter((b: any) => b.booking_status === "completed")
          .reduce((sum: number, b: any) => {
            const start = b.class?.start_time as string | undefined;
            const end = b.class?.end_time as string | undefined;
            if (!start || !end) return sum;
            const [sh, sm] = start.split(":").map(Number);
            const [eh, em] = end.split(":").map(Number);
            const minutes = eh * 60 + em - (sh * 60 + sm);
            return sum + Math.max(minutes, 0);
          }, 0) || 0;
      const hoursLearned = totalMinutesLearned / 60;

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

      // Count sessions based on the class date falling within this month
      const { data: thisMonthBookings } = await supabase
        .from("class_bookings")
        .select(
          `
          payment_amount,
          class:tutor_classes(date)
        `
        )
        .eq("student_id", studentId)
        .gte("class.date", firstDayOfMonth.toISOString())
        .lte("class.date", lastDayOfMonth.toISOString());

      const bookingsThisMonth = thisMonthBookings?.length || 0;
      const spentThisMonth =
        thisMonthBookings?.reduce(
          (sum: number, b: any) => sum + (b.payment_amount || 0),
          0
        ) || 0;

      return {
        total_bookings: totalBookings,
        upcoming_bookings: upcomingBookings,
        completed_bookings: completedBookings,
        total_spent: totalSpent,
        average_rating: 0, // Would need to calculate from reviews
        total_tutors: totalTutors,
        bookings_this_month: bookingsThisMonth,
        spent_this_month: spentThisMonth,
        hours_learned: hoursLearned,
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
