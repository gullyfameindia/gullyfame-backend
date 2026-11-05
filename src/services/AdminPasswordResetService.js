// Admin "forgot password" OTP — emailed, short-lived, single-use.
//
// Replaces the old flow, which stored the OTP on a schema field that doesn't
// exist (so it was never saved), never emailed it, and then accepted 1234 for
// every admin because of `otp == (1234 || otpUser)`.
//
// The OTP lives in Redis (same approach as the app users' password reset in
// PasswordResetService). The master OTP is deliberately NOT accepted here:
// a correct code returns an admin token.
const crypto = require("crypto");
const Admin = require("../models/Admin");
const redis = require("../util/redis");
const helpers = require("../util/helpers");
const mailer = require("../util/mailer");

const OTP_EXPIRY_SECONDS = parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_SECONDS) || 600;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
const RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 30;

const otpKey = (adminId) => `ADMIN_PWD_RESET|${adminId}`;
const attemptsKey = (adminId) => `ADMIN_PWD_RESET_ATTEMPTS|${adminId}`;
const cooldownKey = (adminId) => `ADMIN_PWD_RESET_COOLDOWN|${adminId}`;

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

const otpEmail = (otp, minutes) => ({
  subject: `${otp} is your Gully Fame admin password reset code`,
  text:
    `Your Gully Fame admin password reset code is ${otp}.\n\n` +
    `It expires in ${minutes} minutes. If you didn't ask to reset your password, ignore this email — your password stays the same.`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#222">
      <h2 style="margin:0 0 16px">Reset your admin password</h2>
      <p>Use this code to reset your Gully Fame admin password:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:24px 0">${otp}</p>
      <p>It expires in ${minutes} minutes.</p>
      <p style="color:#777;font-size:13px">If you didn't ask to reset your password, ignore this email — your password stays the same.</p>
    </div>`,
});

const findAdmin = async (email) => {
  const value = String(email || "").trim().toLowerCase();
  if (!value) throw new Error("admin_not_found");
  const admin = await Admin.findOne({ email: value }).select("_id email isActive");
  if (!admin) throw new Error("admin_not_found");
  if (admin.isActive === false) throw new Error("ac_deactivated");
  return admin;
};

module.exports = () => {
  // Used by both forgotPassword and resendOtp.
  const sendOtp = async (email) => {
    const admin = await findAdmin(email);

    if (!mailer.isConfigured()) throw new Error("mail_not_configured");

    const allowed = await redis().SetNxRedis(cooldownKey(admin._id), 1, RESEND_COOLDOWN_SECONDS);
    if (!allowed) throw new Error("otp_resend_too_soon");

    const otp = helpers().generateOTP();
    // A new code replaces any earlier one and resets the attempt counter.
    await redis().SetRedis(otpKey(admin._id), { otp }, OTP_EXPIRY_SECONDS);
    await redis().DelRedis(attemptsKey(admin._id));

    try {
      await mailer.sendMail({ to: admin.email, ...otpEmail(otp, Math.ceil(OTP_EXPIRY_SECONDS / 60)) });
    } catch (e) {
      console.log("AdminPasswordResetService => mail send failed", e.code, e.message);
      await Promise.all([redis().DelRedis(otpKey(admin._id)), redis().DelRedis(cooldownKey(admin._id))]);
      throw new Error("reset_email_failed");
    }

    return { expiresIn: OTP_EXPIRY_SECONDS };
  };

  // Correct code → an admin token (same response shape as before).
  // Single-use, expires, and locks after OTP_MAX_ATTEMPTS wrong tries.
  const verifyOtp = async (email, otp) => {
    const admin = await findAdmin(email);

    const stored = await redis().GetKeyRedis(otpKey(admin._id));
    if (!stored) throw new Error("otp_expired");
    const data = JSON.parse(stored);

    const attempts = await redis().IncrRedis(attemptsKey(admin._id), OTP_EXPIRY_SECONDS);
    if (attempts > OTP_MAX_ATTEMPTS) {
      await redis().DelRedis(otpKey(admin._id));
      throw new Error("otp_too_many_attempts");
    }

    if (!safeEqual(String(otp ?? "").trim(), data.otp)) throw new Error("incorrect_otp");

    await Promise.all([redis().DelRedis(otpKey(admin._id)), redis().DelRedis(attemptsKey(admin._id))]);

    const token = await helpers().createJWT({ adminId: admin._id, isAdmin: true });
    return { token, adminId: admin._id };
  };

  return { sendOtp, verifyOtp };
};
