// Run with: node seed-admin.cjs
const path = require("path");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") }) || dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "mongodb+srv://adwello204_db_user:Adwello2025@cluster0.n7krmxe.mongodb.net/mathmentor?retryWrites=true&w=majority";

const ADMIN_EMAIL = "admin@mathmentor.com";
const ADMIN_PASSWORD = "admin123";

const CANDIDATE_COLLECTIONS = [
  "admin_credentials",
  "admins",
  "AdminCredentials",
  "Admins",
  "users",
];

async function collectionExists(db, name) {
  const cursor = db.listCollections({ name });
  return await cursor.hasNext();
}

async function upsertInto(db, name, email, bcryptHash) {
  const col = db.collection(name);
  const now = new Date();
  const doc = {
    email,
    password: bcryptHash,      // some schemas
    password_hash: bcryptHash, // others
    is_active: true,
    active: true,
    role: "admin",
    updated_at: now,
    updatedAt: now,
  };
  const res = await col.updateOne(
    { email },
    {
      $set: doc,
      $setOnInsert: { created_at: now, createdAt: now },
    },
    { upsert: true }
  );
  return res.upsertedId ? "created" : res.modifiedCount ? "updated" : "nochange";
}

(async function main() {
  try {
    console.log("[seed-admin] Connecting to", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    let targets = [];
    for (const name of CANDIDATE_COLLECTIONS) {
      // eslint-disable-next-line no-await-in-loop
      if (await collectionExists(db, name)) targets.push(name);
    }
    if (targets.length === 0) targets = ["admin_credentials"];

    for (const name of targets) {
      // eslint-disable-next-line no-await-in-loop
      const action = await upsertInto(db, name, ADMIN_EMAIL, hash);
      console.log(`[seed-admin] ${action} admin in "${name}": ${ADMIN_EMAIL}`);
    }

    console.log("[seed-admin] ✅ Done.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[seed-admin] ❌ Error:", err);
    try { await mongoose.disconnect(); } catch {}
    process.exit(1);
  }
})();
