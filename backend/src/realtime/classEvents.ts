import { Class } from '../models/Class';
import { Booking } from '../models/Booking';
import { emitToUser } from './socket';

const toPayload = (doc: any) => {
  const plain = doc.toObject ? doc.toObject() : doc;
  return {
    ...plain,
    id: (plain as any)._id?.toString?.() || (plain as any).id,
    _id: (plain as any)._id?.toString?.() || (plain as any).id,
  };
};

export const notifyBookingChange = (booking: any) => {
  const payload = toPayload(booking);
  const studentId = (payload as any).studentId;
  const teacherId = (payload as any).teacherId;

  if (studentId) {
    emitToUser(
      studentId.toString?.() || studentId,
      'booking:update',
      payload
    );
  }

  if (teacherId) {
    emitToUser(
      teacherId.toString?.() || teacherId,
      'booking:update',
      payload
    );
  }
};

export const notifyClassStatusChange = async (classDoc: any) => {
  const payload = toPayload(classDoc);

  // Notify the teacher
  if (payload.teacherId) {
    emitToUser(
      payload.teacherId.toString?.() || payload.teacherId,
      'class:status',
      payload
    );
  }

  // Notify all students with bookings for this class
  try {
    const bookings = await Booking.find({ classId: payload._id }).select('studentId');
    bookings.forEach((b) => {
      if (b.studentId) {
        emitToUser(
          (b.studentId as any).toString?.() || (b.studentId as any),
          'class:status',
          payload
        );
      }
    });
  } catch (err) {
    // Swallow errors to avoid impacting main flow
    console.error('[Realtime] Failed to notify class status change', err);
  }
};










