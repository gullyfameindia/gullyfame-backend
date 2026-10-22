/* eslint-disable no-console */
// Minimal seed for a fresh database. Safe to run repeatedly — every record is
// upserted, nothing is deleted.
//
//   node scripts/seed.js
//
// Creates:
//   - an active test user (mobile SEED_USER_MOBILE, default 9999999999) — log in
//     with it via /auth/login + the master OTP; e2e_with_seed.js also needs it
//   - an admin, only when SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are set
//     (defaults live in .env; an existing admin's password is never changed)
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const c = {
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

async function seedUser() {
  const User = require("../src/models/User");
  const mobile = process.env.SEED_USER_MOBILE || "9999999999";

  const existing = await User.findOne({ mobile });
  const user = await User.findOneAndUpdate(
    { mobile },
    {
      $set: { isActive: true, isDeleted: false },
      $setOnInsert: {
        mobile,
        firstName: "Test",
        lastName: "User",
        username: "testuser",
      },
    },
    { new: true, upsert: true },
  );

  console.log(
    `${existing ? c.yellow("exists ") : c.green("created")} user  ${user._id} (mobile ${mobile})`,
  );
}

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    console.log(
      c.yellow("skipped") +
        " admin (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one)",
    );
    return;
  }

  const Admin = require("../src/models/Admin");
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log(`${c.yellow("exists ")} admin ${existing._id} (${email})`);
    return;
  }

  const hash = await bcrypt.hash(password, await bcrypt.genSalt());
  const admin = await Admin.create({ email, password: hash, isActive: true });
  console.log(`${c.green("created")} admin ${admin._id} (${email})`);
}

async function main() {
  console.log(c.bold(c.cyan("\n=== Seeding database ===\n")));
  await mongoose.connect(process.env.LOCAL_MONGO_DB);
  console.log(c.cyan(`→ Database: ${mongoose.connection.name}\n`));

  await seedUser();
  await seedAdmin();

  console.log(c.bold(c.green("\nDone.\n")));
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error("FATAL: " + e.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
