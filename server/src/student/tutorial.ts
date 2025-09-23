import { Request, Response } from "express";
import { Profile } from "../core";

/* ---------- Tutorial status ---------- */
export async function getTutorialStatus(req: Request, res: Response) {
  try {
    const user_id = String(req.query.user_id || "").trim();
    if (!user_id) {
      return res.json({ ok: true, data: { started: false, completed: false } });
    }
    const prof: any = await Profile.findOne({ user_id }).lean().exec();
    res.json({
      ok: true,
      data: {
        started: !!prof?.tutorial_started,
        completed: !!prof?.tutorial_completed,
      },
    });
  } catch (e: any) {
    console.error("tutorial_status error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function updateTutorialStatus(req: Request, res: Response) {
  try {
    const { user_id, started, completed } = req.body || {};
    if (!user_id) return res.status(400).json({ ok: false, error: "user_id required" });
    const patch: any = {};
    if (typeof started === "boolean") patch.tutorial_started = started;
    if (typeof completed === "boolean") patch.tutorial_completed = completed;

    const doc = await Profile.findOneAndUpdate(
      { user_id },
      { $set: patch },
      { new: true, upsert: true }
    ).lean();

    res.json({
      ok: true,
      data: {
        started: !!doc?.tutorial_started,
        completed: !!doc?.tutorial_completed,
      },
    });
  } catch (e: any) {
    console.error("tutorial_status POST error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
