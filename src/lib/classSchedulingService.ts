import apiClient from "./apiClient";
import type {
  ClassType,
  Class,
  Booking,
  ClassSearchFilters,
  ClassSearchResult,
  ClassBooking,
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
      // For now, return mock data since we don't have class types in the new backend
      // TODO: Implement class types in backend if needed
      return [
        { _id: '1', name: 'One-on-One', is_active: true },
        { _id: '2', name: 'Group', is_active: true },
        { _id: '3', name: 'Consultation', is_active: true },
      ];
    },

    getById: async (id: string): Promise<ClassType> => {
      // For now, return mock data
      const types = await classSchedulingService.classTypes.getAll();
      const type = types.find(t => t._id === id);
      if (!type) throw new Error('Class type not found');
      return type;
    },
  },

  // Classes
  classes: {
    // Get available classes for students to book
    getAvailableClasses: async (
      filters?: ClassSearchFilters
    ): Promise<ClassSearchResult[]> => {
      try {
        const queryParams = new URLSearchParams();

        if (filters?.date_from) queryParams.append('startDate', filters.date_from);
        if (filters?.date_to) queryParams.append('endDate', filters.date_to);
        if (filters?.price_min) queryParams.append('priceMin', filters.price_min.toString());
        if (filters?.price_max) queryParams.append('priceMax', filters.price_max.toString());

        const response = await apiClient.get<ClassSearchResult[]>(`/api/classes/available?${queryParams}`);

        return response;
      } catch (error) {
        console.error('Error fetching available classes:', error);
        throw error;
      }
    },
  },

  // Class Bookings
  bookings: {
    getByStudentId: async (studentId: string): Promise<ClassBooking[]> => {
      try {
        const bookings = await apiClient.get<Booking[]>(`/api/bookings/student/${studentId}`);

        // Transform bookings to ClassBooking format expected by the frontend
        return bookings.map((booking: any): ClassBooking => ({
          // Booking fields
          _id: booking._id,
          studentId: booking.studentId,
          teacherId: booking.teacherId?._id,
          classId: booking.classId?._id,
          bookingType: booking.bookingType,
          title: booking.title,
          description: booking.description,
          subjectId: booking.subjectId,
          gradeLevelId: booking.gradeLevelId,
          scheduledDate: booking.scheduledDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          duration: booking.duration,
          status: booking.status,
          isConfirmed: booking.isConfirmed,
          confirmedAt: booking.confirmedAt,
          cancelledAt: booking.cancelledAt,
          cancellationReason: booking.cancellationReason,
          price: booking.price,
          currency: booking.currency,
          paymentStatus: booking.paymentStatus,
          paymentId: booking.paymentId,
          notes: booking.notes,
          specialRequirements: booking.specialRequirements,
          meetingLink: booking.meetingLink,
          roomNumber: booking.roomNumber,
          location: booking.location,
          createdBy: booking.createdBy,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,

          // ClassBooking specific fields
          id: booking._id,
          class_id: booking.classId?._id,
          student_id: booking.studentId,
          booking_status: booking.status,
          payment_status: booking.paymentStatus,
          payment_amount: booking.price || 0,
          stripe_payment_intent_id: booking.paymentId,
          created_at: booking.createdAt,
          updated_at: booking.updatedAt,
          class: booking.classId ? {
            id: booking.classId._id,
            tutor_id: booking.classId.teacherId,
            tutor: booking.teacherId ? {
              id: booking.teacherId._id,
              full_name: booking.teacherId.fullName || `${booking.teacherId.firstName} ${booking.teacherId.lastName}`,
              email: booking.teacherId.email,
            } : undefined,
            title: booking.classId.title,
            description: booking.description || booking.classId.description,
            date: booking.scheduledDate,
            start_time: booking.startTime,
            end_time: booking.endTime,
            duration_minutes: booking.duration,
            jitsi_meeting_url: booking.meetingLink,
            jitsi_room_name: booking.classId.jitsiRoomName,
            jitsi_password: booking.classId.jitsiPassword,
            status: booking.classId.status || 'scheduled',
            subject_id: typeof booking.classId.subjectId === 'object' && (booking.classId.subjectId as any)?._id
              ? (booking.classId.subjectId as any)._id.toString()
              : booking.classId.subjectId?.toString(),
            grade_level_id: typeof booking.classId.gradeLevelId === 'object' && (booking.classId.gradeLevelId as any)?._id
              ? (booking.classId.gradeLevelId as any)._id.toString()
              : booking.classId.gradeLevelId?.toString(),
            class_type: booking.classId.classType,
            class_type_id: booking.classId.classTypeId,
            subject: undefined,
            max_students: booking.classId.capacity,
            current_students: booking.classId.enrolledCount,
            price_per_session: booking.classId.price,
            is_recurring: false,
            recurring_pattern: undefined,
            recurring_end_date: undefined,
            created_at: booking.classId.createdAt,
            updated_at: booking.classId.updatedAt,
          } as any : undefined,
        }));
      } catch (error) {
        console.error("Error fetching student bookings:", error);
        throw error;
      }
    },

    create: async (
      classId: string,
      _studentId: string,
      paymentAmount: number,
      stripePaymentIntentId?: string
    ): Promise<Booking> => {
      try {
        // Get the class details first
        const classDetails = await apiClient.get<Class>(`/api/classes/${classId}`);

        const bookingData = {
          classId,
          bookingType: 'class' as const,
          title: classDetails.title,
          description: classDetails.description,
          subjectId: typeof classDetails.subjectId === 'object' && (classDetails.subjectId as any)?._id
            ? (classDetails.subjectId as any)._id.toString()
            : classDetails.subjectId?.toString(),
          gradeLevelId: typeof classDetails.gradeLevelId === 'object' && (classDetails.gradeLevelId as any)?._id
            ? (classDetails.gradeLevelId as any)._id.toString()
            : classDetails.gradeLevelId?.toString(),
          scheduledDate: classDetails.startDate,
          startTime: classDetails.schedule.startTime,
          endTime: classDetails.schedule.endTime,
          duration: classDetails.schedule.duration,
          price: paymentAmount,
          paymentId: stripePaymentIntentId,
          paymentStatus: stripePaymentIntentId ? 'paid' as const : 'pending' as const,
        };

        const booking = await apiClient.post<Booking>('/api/bookings', bookingData);
        return booking;
      } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
      }
    },

  },
};
