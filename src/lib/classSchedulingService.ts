import apiClient from "./apiClient";
import { generateJitsiMeetingUrl, generateJitsiRoomName, generateJitsiPassword } from "./utils";
import type {
  ClassType,
  Class,
  Booking,
  ClassSearchFilters,
  ClassSearchResult,
  ClassBooking,
  TutorClass,
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
        {
          _id: '1',
          id: '1',
          name: 'One-on-One',
          description: 'Personalized 1-on-1 tutoring session',
          duration_minutes: 60,
          max_students: 1,
          price_per_session: 50,
          is_active: true
        },
        {
          _id: '2',
          id: '2',
          name: 'Group',
          description: 'Small group tutoring session',
          duration_minutes: 60,
          max_students: 5,
          price_per_session: 25,
          is_active: true
        },
        {
          _id: '3',
          id: '3',
          name: 'Consultation',
          description: 'Initial consultation and assessment',
          duration_minutes: 30,
          max_students: 1,
          price_per_session: 20,
          is_active: true
        },
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
        if (filters?.class_type) queryParams.append('class_type', filters.class_type);

        const response = await apiClient.get<any[]>(`/api/classes/available?${queryParams}`);

        // Transform backend response to match ClassSearchResult format
        return response.map((result: any): ClassSearchResult => ({
          class: {
            // Base Class fields
            _id: result.class._id,
            title: result.class.title,
            description: result.class.description,
            subjectId: result.class.subjectId,
            gradeLevelId: result.class.gradeLevelId,
            teacherId: result.class.teacherId,
            schedule: result.class.schedule,
            startDate: result.class.startDate,
            endDate: result.class.endDate,
            capacity: result.class.capacity,
            enrolledCount: result.class.enrolledCount,
            price: result.class.price,
            currency: result.class.currency,
            isActive: result.class.isActive,
            isFull: result.class.isFull,
            prerequisites: result.class.prerequisites,
            materials: result.class.materials,
            meetingLink: result.class.meetingLink,
            jitsiRoomName: result.class.jitsiRoomName,
            jitsiPassword: result.class.jitsiPassword,
            roomNumber: result.class.roomNumber,
            location: result.class.location,
            createdAt: result.class.createdAt,
            updatedAt: result.class.updatedAt,
            teacherId_populated: result.class.teacherId_populated,
            subjectId_populated: result.class.subjectId_populated,
            gradeLevelId_populated: result.class.gradeLevelId_populated,

            // TutorClass specific fields
            id: result.class._id,
            tutor_id: result.class.teacherId,
            class_type_id: undefined, // Will be set based on logic
            subject_id: result.class.subjectId,
            date: result.class.startDate,
            start_time: result.class.schedule?.startTime || '',
            end_time: result.class.schedule?.endTime || '',
            duration_minutes: result.class.schedule?.duration || 60,
            max_students: result.class.capacity,
            current_students: result.class.enrolledCount,
            price_per_session: result.class.price || 0,
            status: result.class.isActive ? 'scheduled' : 'cancelled',
            is_recurring: false,
            recurring_pattern: undefined,
            recurring_end_date: undefined,
            created_at: result.class.createdAt,
            updated_at: result.class.updatedAt,
            jitsi_meeting_url: result.class.meetingLink,
            jitsi_room_name: result.class.jitsiRoomName,
            jitsi_password: result.class.jitsiPassword,

            // Joined fields
            class_type: undefined, // Will be determined by class_type filter
            tutor: result.tutor ? {
              id: result.tutor.id,
              full_name: result.tutor.full_name,
              email: '' // Not provided by backend
            } : undefined,
            subject: result.class.subjectId_populated ? {
              id: result.class.subjectId_populated._id,
              name: result.class.subjectId_populated.name,
              display_name: result.class.subjectId_populated.displayName,
              color: result.class.subjectId_populated.color
            } : undefined
          },
          tutor: result.tutor,
          available_slots: result.available_slots,
          is_bookable: result.is_bookable
        }));
      } catch (error) {
        console.error('Error fetching available classes:', error);
        throw error;
      }
    },

    // Get classes by tutor ID (for tutor dashboard)
    getByTutorId: async (tutorId: string): Promise<TutorClass[]> => {
      try {
        const classesData = await apiClient.get<any[]>(`/api/classes/teacher/${tutorId}`);

        // Transform backend class data to TutorClass format
        return classesData.map((classData: any): TutorClass => ({
          // Base Class fields
          _id: classData._id,
          title: classData.title,
          description: classData.description,
          subjectId: typeof classData.subjectId === 'object' ? classData.subjectId._id : classData.subjectId,
          gradeLevelId: typeof classData.gradeLevelId === 'object' ? classData.gradeLevelId._id : classData.gradeLevelId,
          teacherId: typeof classData.teacherId === 'object' ? classData.teacherId._id : classData.teacherId,
          schedule: classData.schedule,
          startDate: classData.startDate,
          endDate: classData.endDate,
          capacity: classData.capacity,
          enrolledCount: classData.enrolledCount,
          price: classData.price,
          currency: classData.currency,
          isActive: classData.isActive,
          isFull: classData.isFull,
          prerequisites: classData.prerequisites,
          materials: classData.materials,
          meetingLink: classData.meetingLink,
          jitsiRoomName: classData.jitsiRoomName,
          jitsiPassword: classData.jitsiPassword,
          roomNumber: classData.roomNumber,
          location: classData.location,
          createdAt: classData.createdAt,
          updatedAt: classData.updatedAt,

          // Populated fields
          teacherId_populated: classData.teacherId,
          subjectId_populated: classData.subjectId,
          gradeLevelId_populated: classData.gradeLevelId,

          // TutorClass specific fields
          id: classData._id,
          tutor_id: typeof classData.teacherId === 'object' ? classData.teacherId._id : classData.teacherId,
          subject_id: typeof classData.subjectId === 'object' ? classData.subjectId._id : classData.subjectId,
          date: classData.startDate,
          start_time: classData.schedule.startTime,
          end_time: classData.schedule.endTime,
          duration_minutes: classData.schedule.duration,
          max_students: classData.capacity,
          current_students: classData.enrolledCount,
          price_per_session: classData.price || 0,
          status: classData.status || (classData.isActive ? "scheduled" : "cancelled"),
          is_recurring: false,
          recurring_pattern: undefined,
          recurring_end_date: undefined,
          created_at: classData.createdAt,
          updated_at: classData.updatedAt,
          jitsi_meeting_url: classData.meetingLink,
          jitsi_room_name: classData.jitsiRoomName,
          jitsi_password: classData.jitsiPassword,

          // Joined fields
          tutor: classData.teacherId ? {
            id: typeof classData.teacherId === 'object' ? classData.teacherId._id : classData.teacherId,
            full_name: (classData.teacherId as any)?.fullName || `${(classData.teacherId as any)?.firstName} ${(classData.teacherId as any)?.lastName}` || 'Unknown Tutor',
            email: (classData.teacherId as any)?.email,
          } : undefined,
          subject: classData.subjectId ? {
            id: typeof classData.subjectId === 'object' ? classData.subjectId._id : classData.subjectId,
            name: (classData.subjectId as any)?.name || (classData.subjectId as any)?.displayName,
            display_name: (classData.subjectId as any)?.displayName || (classData.subjectId as any)?.name,
            color: (classData.subjectId as any)?.color,
          } : undefined,
        }));
      } catch (error) {
        console.error('Error fetching tutor classes:', error);
        throw error;
      }
    },

    // Create a new class
    create: async (classData: any): Promise<TutorClass> => {
      try {
        // Calculate duration from start and end time
        const startTime = new Date(`2000-01-01T${classData.start_time}`);
        const endTime = new Date(`2000-01-01T${classData.end_time}`);
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

        // Generate Jitsi meeting details if not provided
        const classId = Date.now().toString() + Math.random().toString(36).substr(2, 9); // Temporary ID for URL generation
        const meetingLink = classData.meeting_link || generateJitsiMeetingUrl(classId);
        const jitsiRoomName = classData.jitsi_room_name || generateJitsiRoomName(classId);
        const jitsiPassword = classData.jitsi_password || generateJitsiPassword();

        // Validate required fields
        if (!classData.subject_id || classData.subject_id.trim() === '') {
          throw new Error('Subject ID is required');
        }
        const gradeLevelId = classData.grade_level_id || classData.gradeLevelId;
        if (!gradeLevelId || gradeLevelId.trim() === '') {
          throw new Error('Grade level ID is required');
        }

        // Validate ObjectId format (basic check)
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!objectIdRegex.test(classData.subject_id)) {
          throw new Error(`Invalid subject ID format: ${classData.subject_id}`);
        }
        if (!objectIdRegex.test(gradeLevelId)) {
          throw new Error(`Invalid grade level ID format: ${gradeLevelId}`);
        }

        // Transform frontend data to backend format
        const backendData = {
          title: classData.title,
          description: classData.description,
          subjectId: classData.subject_id,
          gradeLevelId: classData.grade_level_id || classData.gradeLevelId,
          schedule: {
            dayOfWeek: new Date(classData.date).getDay(),
            startTime: classData.start_time,
            endTime: classData.end_time,
            duration: durationMinutes,
          },
          startDate: classData.date,
          endDate: classData.recurring_end_date,
          capacity: classData.max_students,
          price: classData.price_per_session,
          currency: 'USD',
          meetingLink: meetingLink,
          jitsiRoomName: jitsiRoomName,
          jitsiPassword: jitsiPassword,
        };

        const createdClass = await apiClient.post<any>('/api/classes', backendData);
        return {
          // Base Class fields
          _id: createdClass._id,
          title: createdClass.title,
          description: createdClass.description,
          subjectId: createdClass.subjectId,
          gradeLevelId: createdClass.gradeLevelId,
          teacherId: createdClass.teacherId,
          schedule: createdClass.schedule,
          startDate: createdClass.startDate,
          endDate: createdClass.endDate,
          capacity: createdClass.capacity,
          enrolledCount: createdClass.enrolledCount,
          price: createdClass.price,
          currency: createdClass.currency,
          isActive: createdClass.isActive,
          isFull: createdClass.isFull,
          prerequisites: createdClass.prerequisites,
          materials: createdClass.materials,
          meetingLink: createdClass.meetingLink,
          roomNumber: createdClass.roomNumber,
          location: createdClass.location,
          createdAt: createdClass.createdAt,
          updatedAt: createdClass.updatedAt,
          jitsiRoomName: createdClass.jitsiRoomName || jitsiRoomName,
          jitsiPassword: createdClass.jitsiPassword || jitsiPassword,

          // TutorClass specific fields
          id: createdClass._id,
          tutor_id: createdClass.teacherId,
          subject_id: createdClass.subjectId,
          date: createdClass.startDate,
          start_time: createdClass.schedule.startTime,
          end_time: createdClass.schedule.endTime,
          duration_minutes: createdClass.schedule.duration,
          max_students: createdClass.capacity,
          current_students: createdClass.enrolledCount,
          price_per_session: createdClass.price || 0,
          status: "scheduled",
          is_recurring: false,
          created_at: createdClass.createdAt,
          updated_at: createdClass.updatedAt,
          jitsi_meeting_url: createdClass.meetingLink,
          jitsi_room_name: createdClass.jitsiRoomName || jitsiRoomName,
          jitsi_password: createdClass.jitsiPassword || jitsiPassword,
        };
      } catch (error) {
        console.error('Error creating class:', error);
        throw error;
      }
    },

    // Update a class
    update: async (classId: string, updates: any): Promise<TutorClass> => {
      try {
        // Transform frontend update data to backend format
        // Parse time strings to HH:MM format
        const parseTime = (timeStr: string) => {
          if (!timeStr) return timeStr;
          // If it's already in HH:MM format, return as is
          if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)) {
            return timeStr;
          }
          // Parse from Date object or time string with AM/PM
          const date = new Date(`2000-01-01T${timeStr}`);
          if (!isNaN(date.getTime())) {
            return date.toTimeString().slice(0, 5); // HH:MM format
          }
          return timeStr;
        };

        const startTime = parseTime(updates.start_time);
        const endTime = parseTime(updates.end_time);

        // Calculate duration from start and end time if provided
        let duration = updates.duration_minutes;
        if (startTime && endTime) {
          const startDate = new Date(`2000-01-01T${startTime}`);
          const endDate = new Date(`2000-01-01T${endTime}`);
          duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
        }

        const backendUpdates = {
          title: updates.title,
          description: updates.description,
          subjectId: updates.subject_id,
          gradeLevelId: updates.grade_level_id,
          schedule: updates.schedule || (startTime && endTime ? {
            dayOfWeek: updates.date ? new Date(updates.date).getDay() : undefined,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
          } : undefined),
          startDate: updates.date,
          endDate: updates.recurring_end_date,
          capacity: updates.max_students,
          price: updates.price_per_session,
          isActive: updates.status === "scheduled" || updates.status === "completed" || updates.status === "in_progress",
          status: updates.status,
          meetingLink: updates.meeting_link,
          jitsiRoomName: updates.jitsi_room_name,
          jitsiPassword: updates.jitsi_password,
        };

        const response = await apiClient.put<{ success: boolean; message: string; data: any }>(`/api/classes/${classId}`, backendUpdates);

        if (!response.success) {
          throw new Error(response.message || 'Failed to update class');
        }

        const updatedClass = response.data;
        return {
          // Base Class fields
          _id: updatedClass._id,
          title: updatedClass.title,
          description: updatedClass.description,
          subjectId: updatedClass.subjectId,
          gradeLevelId: updatedClass.gradeLevelId,
          teacherId: updatedClass.teacherId,
          schedule: updatedClass.schedule,
          startDate: updatedClass.startDate,
          endDate: updatedClass.endDate,
          capacity: updatedClass.capacity,
          enrolledCount: updatedClass.enrolledCount,
          price: updatedClass.price,
          currency: updatedClass.currency,
          isActive: updatedClass.isActive,
          isFull: updatedClass.isFull,
          prerequisites: updatedClass.prerequisites,
          materials: updatedClass.materials,
          meetingLink: updatedClass.meetingLink,
          jitsiRoomName: updatedClass.jitsiRoomName,
          jitsiPassword: updatedClass.jitsiPassword,
          roomNumber: updatedClass.roomNumber,
          location: updatedClass.location,
          createdAt: updatedClass.createdAt,
          updatedAt: updatedClass.updatedAt,

          // TutorClass specific fields
          id: updatedClass._id,
          tutor_id: updatedClass.teacherId,
          subject_id: updatedClass.subjectId,
          date: updatedClass.startDate,
          start_time: updatedClass.schedule.startTime,
          end_time: updatedClass.schedule.endTime,
          duration_minutes: updatedClass.schedule.duration,
          max_students: updatedClass.capacity,
          current_students: updatedClass.enrolledCount,
          price_per_session: updatedClass.price || 0,
          status: updatedClass.status || (updatedClass.isActive ? "scheduled" : "cancelled"),
          is_recurring: false,
          created_at: updatedClass.createdAt,
          updated_at: updatedClass.updatedAt,
          jitsi_meeting_url: updatedClass.meetingLink,
          jitsi_room_name: updatedClass.jitsiRoomName,
          jitsi_password: updatedClass.jitsiPassword,
        };
      } catch (error) {
        console.error('Error updating class:', error);
        throw error;
      }
    },

    // Delete a class
    delete: async (classId: string): Promise<void> => {
      try {
        await apiClient.delete(`/api/classes/${classId}`);
      } catch (error) {
        console.error('Error deleting class:', error);
        throw error;
      }
    },
  },

  // Class Bookings
  bookings: {
    cancel: async (bookingId: string, reason?: string): Promise<void> => {
      try {
        await apiClient.put(`/api/bookings/${bookingId}/cancel`, { reason });
      } catch (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }
    },
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
            date: booking.scheduledDate ? new Date(booking.scheduledDate).toISOString().split('T')[0] :
                  booking.classId?.startDate ? new Date(booking.classId.startDate).toISOString().split('T')[0] : null,
            start_time: booking.startTime,
            end_time: booking.endTime,
            duration_minutes: booking.duration,
            jitsi_meeting_url: booking.classId?.meetingLink,
            jitsi_room_name: booking.classId?.jitsiRoomName,
            jitsi_password: booking.classId?.jitsiPassword,
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

    getByTeacherId: async (teacherId: string): Promise<ClassBooking[]> => {
      try {
        const bookings = await apiClient.get<Booking[]>(`/api/bookings/teacher/${teacherId}`);

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
            // Base Class fields
            _id: booking.classId._id,
            title: booking.classId.title,
            description: booking.classId.description,
            subjectId: booking.classId.subjectId,
            gradeLevelId: booking.classId.gradeLevelId,
            teacherId: booking.classId.teacherId,
            schedule: booking.classId.schedule,
            startDate: booking.classId.startDate,
            endDate: booking.classId.endDate,
            capacity: booking.classId.capacity,
            enrolledCount: booking.classId.enrolledCount,
            price: booking.classId.price,
            currency: booking.classId.currency,
            isActive: booking.classId.isActive,
            isFull: booking.classId.isFull,
            prerequisites: booking.classId.prerequisites,
            materials: booking.classId.materials,
            meetingLink: booking.classId.meetingLink,
            jitsiRoomName: booking.classId.jitsiRoomName,
            jitsiPassword: booking.classId.jitsiPassword,
            roomNumber: booking.classId.roomNumber,
            location: booking.classId.location,
            createdAt: booking.classId.createdAt,
            updatedAt: booking.classId.updatedAt,

            // TutorClass specific fields
            id: booking.classId._id,
            tutor_id: booking.classId.teacherId,
            class_type_id: booking.classId.classTypeId,
            subject_id: booking.classId.subjectId,
            date: booking.classId.startDate,
            start_time: booking.classId.schedule?.startTime,
            end_time: booking.classId.schedule?.endTime,
            duration_minutes: booking.classId.schedule?.duration,
            max_students: booking.classId.capacity,
            current_students: booking.classId.enrolledCount,
            price_per_session: booking.classId.price || 0,
            status: booking.classId.status || (booking.classId.isActive ? "scheduled" : "cancelled"),
            is_recurring: false,
            created_at: booking.classId.createdAt,
            updated_at: booking.classId.updatedAt,
            jitsi_meeting_url: booking.classId.meetingLink,
            jitsi_room_name: booking.classId.jitsiRoomName,
            jitsi_password: booking.classId.jitsiPassword,
            class_type: booking.classId.classType?.name || "",
            tutor: booking.teacherId ? {
              id: booking.teacherId._id,
              full_name: booking.teacherId.fullName || booking.teacherId.firstName + ' ' + booking.teacherId.lastName,
              email: booking.teacherId.email,
            } : undefined,
          } : undefined,
        }));
      } catch (error) {
        console.error("Error fetching teacher bookings:", error);
        throw error;
      }
    },

  },
};
