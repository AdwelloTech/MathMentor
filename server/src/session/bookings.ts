import { Request, Response } from "express";
import { SessionBooking, dynamicFind, parseJSON } from "../core";

/* ---------- Session Bookings ---------- */
export async function createSessionBooking(req: Request, res: Response) {
  try {
    const booking = await SessionBooking.create(req.body || {});
    res.json({ ok: true, data: booking });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
}

export async function getSessionBookings(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, SessionBooking, {
    q, sort, limit, offset, populate: [{ path: "subject_id", model: "Subject" }],
  });
}
