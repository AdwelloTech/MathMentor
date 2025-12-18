import { IInstantSession } from '../models/InstantSession';
import { emitToInstantSession, emitToTutors, emitToUser } from './socket';

const toPayload = (session: IInstantSession) => {
  const plain = session.toObject ? session.toObject() : session;
  return {
    ...plain,
    id: (plain as any)._id?.toString?.() || (plain as any).id,
    _id: (plain as any)._id?.toString?.() || (plain as any).id,
  };
};

export const notifyPendingCreated = (session: IInstantSession) => {
  const payload = toPayload(session);
  emitToTutors('instant:pending:new', payload);
};

export const notifyPendingRemoved = (session: IInstantSession) => {
  const payload = toPayload(session);
  emitToTutors('instant:pending:remove', payload);
};

export const notifySessionStatus = (session: IInstantSession, event: string) => {
  const payload = toPayload(session);
  const sessionId = payload.id;

  if (sessionId) {
    emitToInstantSession(sessionId, 'instant:status', { event, session: payload });
  }

  if ((payload as any).studentId) {
    emitToUser((payload as any).studentId.toString?.() || (payload as any).studentId, 'instant:status', {
      event,
      session: payload,
    });
  }

  if ((payload as any).tutorId) {
    emitToUser((payload as any).tutorId.toString?.() || (payload as any).tutorId, 'instant:status', {
      event,
      session: payload,
    });
  }
};











