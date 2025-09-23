import { Request, Response } from "express";
import { Profile } from "../core";

/* ---------- Premium access ---------- */
export async function checkPremiumAccess(req: Request, res: Response) {
  try {
    const user_id = String(req.query.user_id || "").trim();
    if (!user_id) {
      return res.json({
        ok: true,
        data: { premium: false, has_access: false, plan: "free", premium_until: null },
      });
    }
    const prof: any = await Profile.findOne({ user_id }).lean().exec();
    const now = new Date();
    const plan = (prof?.plan || "free").toString().toLowerCase();
    const premiumUntil = prof?.premium_until ? new Date(prof.premium_until) : null;
    const premium =
      !!prof?.is_premium ||
      ["premium", "pro", "paid"].includes(plan) ||
      (premiumUntil && premiumUntil > now);

    res.json({
      ok: true,
      data: {
        premium,
        has_access: premium,
        plan: prof?.plan || "free",
        premium_until: prof?.premium_until || null,
      },
    });
  } catch (e: any) {
    console.error("check_premium_access error", e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
