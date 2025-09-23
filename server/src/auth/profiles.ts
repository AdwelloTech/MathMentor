import { Request, Response } from "express";
import { Types } from "mongoose";
import { Profile, dynamicFind, parseJSON } from "../core";

/* ---------- Profiles ---------- */
export async function updateProfile(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const patch = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const filter = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { user_id: id };
    const updated = await Profile.findOneAndUpdate(filter, { $set: patch }, { new: true }).lean();
    if (!updated) return res.status(404).json({ ok: false, error: "Profile not found" });
    res.json({ ok: true, data: updated });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message || "Invalid body" });
  }
}

export async function getProfiles(req: Request, res: Response) {
  const q = parseJSON<any>(req.query.q as string) || {};
  const sort = parseJSON<any>(req.query.sort as string) || { createdAt: -1 };
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const offset = req.query.offset ? Number(req.query.offset) : 0;
  await dynamicFind(res, Profile, { q, sort, limit, offset });
}

export async function getProfile(req: Request, res: Response) {
  const { id } = req.params;
  let doc = null;
  if (/^[0-9a-fA-F]{24}$/.test(id)) doc = await Profile.findById(id);
  else doc = await Profile.findOne({ user_id: id });
  if (!doc) return res.status(404).json({ ok: false, error: "Profile not found" });
  res.json({ ok: true, data: doc });
}

export async function createProfile(req: Request, res: Response) {
  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    // Drop non-ObjectId _id (e.g., UUID) so Mongoose can generate one
    if (payload && typeof payload._id === "string" && !Types.ObjectId.isValid(payload._id)) {
      delete payload._id;
    }
    const created = await Profile.create(payload);
    res.json({ ok: true, data: created });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message || "Invalid body" });
  }
}
