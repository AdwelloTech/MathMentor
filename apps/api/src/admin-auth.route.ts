// src/routes/admin-auth.route.ts
import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

const router = Router();

const CANDIDATE_COLLECTIONS = ["admin_credentials","admins","AdminCredentials","Admins","users"];

async function findAdminByEmail(db: mongoose.mongo.Db, email: string) {
  for (const name of CANDIDATE_COLLECTIONS) {
    const col = db.collection(name);
    const admin = await col.findOne({ email });
    if (admin) return admin as any;
  }
  return null;
}

router.post("/api/auth/admin/login", async (req, res) => {
  try {
    const { email, password } = (req.body || {}) as { email?: string; password?: string };
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const db = (mongoose.connection as any)?.db as mongoose.mongo.Db | undefined;
    if (!db) return res.status(500).json({ error: "DB not connected" });

    const admin = await findAdminByEmail(db, email);
    if (!admin) return res.status(401).json({ error: "Invalid credentials" });
    if (admin.is_active === false || admin.active === false) {
      return res.status(403).json({ error: "Admin is inactive" });
    }

    const hash = admin.password || admin.password_hash;
    if (!hash) return res.status(500).json({ error: "No password hash stored" });

    const ok = await bcrypt.compare(password, String(hash));
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
    const id = String(admin._id || admin.id || admin.uuid || "");
    const token = jwt.sign({ sub: id, role: "admin", email }, JWT_SECRET, { expiresIn: "7d" });

    return res.json({ token, user: { id, email, role: "admin", name: admin.full_name || "Admin User" } });
  } catch (err) {
    console.error("[admin login] error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
