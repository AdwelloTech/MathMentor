import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AdminUser, Profile } from "../core";

/* ---------- Admin ---------- */
export async function upsertAdmin(req: Request, res: Response) {
  try {
    const { email, password, is_active = true } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email and password required" });
    }
    const emailLc = String(email).toLowerCase().trim();
    const hash = await bcrypt.hash(String(password), 10);

    await AdminUser.updateOne(
      { email: emailLc },
      { $set: { email: emailLc, password_hash: hash, is_active: !!is_active } },
      { upsert: true }
    );

    // ensure admin profile exists
    const user_id = emailLc.replace(/[^a-z0-9]/gi, "") + "-id";
    await Profile.updateOne(
      { email: emailLc },
      {
        $set: {
          email: emailLc,
          user_id,
          full_name: emailLc.split("@")[0],
          role: "admin",
          is_premium: true,
          plan: "pro",
        },
      },
      { upsert: true }
    );

    res.json({ ok: true, success: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
}

export async function verifyAdminCredentials(req: Request, res: Response) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, success: false, error: "email and password required" });
    }
    const emailLc = String(email).toLowerCase().trim();

    // 1) ENV-based admin shortcut (dev)
    const envEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    const envPass = process.env.ADMIN_PASSWORD || "";
    if (envEmail && emailLc === envEmail) {
      let ok = false;
      if (envPass.startsWith("$2")) ok = await bcrypt.compare(password, envPass);
      else ok = password === envPass;

      if (ok) {
        const prof = await Profile.findOneAndUpdate(
          { email: emailLc },
          {
            $setOnInsert: {
              email: emailLc,
              user_id: emailLc.replace(/[^a-z0-9]/gi, "") + "-id",
              full_name: emailLc.split("@")[0],
              role: "admin",
              plan: "pro",
              is_premium: true,
            },
          },
          { new: true, upsert: true }
        ).lean();
        return res.json({ ok: true, success: true, data: { valid: true, profile: prof } });
      }
      return res.json({ ok: true, success: false, data: { valid: false } });
    }

    // 2) DB-based admin
    const adm = await AdminUser.findOne({ email: emailLc, is_active: true }).lean();
    if (!adm?.password_hash) {
      return res.json({ ok: true, success: false, data: { valid: false } });
    }
    const match = await bcrypt.compare(String(password), String(adm.password_hash));
    if (!match) return res.json({ ok: true, success: false, data: { valid: false } });

    const prof = await Profile.findOneAndUpdate(
      { email: emailLc },
      {
        $setOnInsert: {
          email: emailLc,
          user_id: emailLc.replace(/[^a-z0-9]/gi, "") + "-id",
          full_name: emailLc.split("@")[0],
          role: "admin",
          plan: "pro",
          is_premium: true,
        },
      },
      { new: true, upsert: true }
    ).lean();

    res.json({ ok: true, success: true, data: { valid: true, profile: prof } });
  } catch (e: any) {
    res.status(500).json({ ok: false, success: false, error: e.message });
  }
}
