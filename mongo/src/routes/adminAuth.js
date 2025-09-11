import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import AdminCredentials from '../db/models/AdminCredentials.js';
import AdminSessions from '../db/models/AdminSessions.js';

const router = express.Router();

// Helper: verify password with either bcrypt or sha256(salt+password)
async function verifyPassword(storedHash, salt, password) {
  // bcrypt detection
  if (storedHash?.startsWith('$2a$') || storedHash?.startsWith('$2b$') || storedHash?.startsWith('$2y$')) {
    const { default: bcrypt } = await import('bcryptjs');
    return bcrypt.compare(password, storedHash);
  }

  // fallback: sha256(salt + password) hex
  const sha = crypto.createHash('sha256').update(String(salt || '') + String(password)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sha), Buffer.from(storedHash));
}

// POST /api/auth/admin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const admin = await AdminCredentials.findOne({
      email: String(email).toLowerCase().trim(),
      is_active: true,
    }).lean();

    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await verifyPassword(admin.password_hash, admin.salt, password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Issue JWT
    const jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'dev-secret';
    const token = jwt.sign(
      { sub: admin._id, role: 'admin', email: admin.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Persist admin session (optional but useful)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await AdminSessions.create({
      admin_id: admin._id,
      admin_email: admin.email,
      session_token: sessionToken,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: expiresAt,
    });

    // Update last_login & reset attempts
    await AdminCredentials.findByIdAndUpdate(
      admin._id,
      { $set: { last_login: new Date(), login_attempts: 0, locked_until: null } },
      { new: false }
    );

    return res.json({
      token,
      session_token: sessionToken,
      user: { id: admin._id, email: admin.email, role: 'admin' },
    });
  } catch (err) {
    console.error('admin login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export { router as adminAuthRouter };
