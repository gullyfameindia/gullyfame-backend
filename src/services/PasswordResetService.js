const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const redis = require("../util/redis");
const helpers = require("../util/helpers");
const mailer = require("../util/mailer");

const OTP_EXPIRY_SECONDS = parseInt(process.env.PASSWORD_RESET_OTP_EXPIRY_SECONDS) || 600;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
const RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 30;
// How long the app has to submit the new password after the OTP is verified.
const RESET_TOKEN_EXPIRY_SECONDS = 600;
const MIN_PASSWORD_LENGTH = 6;

const MASTER_OTP = String(process.env.MASTER_OTP_LOGIN || "").trim();
// Same testing switch as OTP login — MASTER_OTP_ENABLED=false turns both off.
const MASTER_OTP_ENABLED =
  String(process.env.MASTER_OTP_ENABLED || "true").toLowerCase() === "true" &&
  Boolean(MASTER_OTP);

const txnKey = (txnId) => `PWD_RESET|txnId:${txnId}`;
const attemptsKey = (txnId) => `PWD_RESET_ATTEMPTS|txnId:${txnId}`;
const cooldownKey = (userId) => `PWD_RESET_COOLDOWN|${userId}`;
const tokenKey = (token) => `PWD_RESET_TOKEN|${token}`;

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// "rahul.sharma@gmail.com" → "ra*********@gmail.com"
const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  const visible = name.slice(0, Math.min(2, name.length));
  return `${visible}${"*".repeat(Math.max(name.length - visible.length, 3))}@${domain}`;
};

const otpEmail = (otp, minutes) => ({
  subject: `${otp} is your Gully Fame password reset code`,
  text:
    `Your Gully Fame password reset code is ${otp}.\n\n` +
    `It expires in ${minutes} minutes. If you didn't ask to reset your password, ignore this email — your password stays the same.`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#222">
      <h2 style="margin:0 0 16px">Reset your password</h2>
      <p>Use this code to reset your Gully Fame password:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:24px 0">${otp}</p>
      <p>It expires in ${minutes} minutes.</p>
      <p style="color:#777;font-size:13px">If you didn't ask to reset your password, ignore this email — your password stays the same.</p>
    </div>`,
});

module.exports = () => {
  // userId = the email or mobile the user types. The code always goes to the
  // account's email, so mobile works too when the account has an email.
  const requestReset = async (userId) => {
    const value = String(userId || "").trim();
    const query = value.includes("@") ? { email: value.toLowerCase() } : { mobile: value };

    const user = await User.findOne({ ...query, isDeleted: { $ne: true } }).select("_id email isActive");
    if (!user) throw new Error("user_not_found");
    if (!user.isActive) throw new Error("ac_deactivated");
    if (!user.email) throw new Error("no_email_on_account");

    const allowed = await redis().SetNxRedis(cooldownKey(user._id), 1, RESEND_COOLDOWN_SECONDS);
    if (!allowed) throw new Error("otp_resend_too_soon");

    const otp = helpers().generateOTP();
    const txnId = uuidv4();
    await redis().SetRedis(
      txnKey(txnId),
      { txnId, userId: String(user._id), email: user.email, otp, date_created: new Date() },
      OTP_EXPIRY_SECONDS,
    );

    let emailSent = false;
    if (mailer.isConfigured()) {
      try {
        await mailer.sendMail({ to: user.email, ...otpEmail(otp, Math.ceil(OTP_EXPIRY_SECONDS / 60)) });
        emailSent = true;
      } catch (e) {
        console.log("PasswordResetService => mail send failed", e.code, e.message);
        if (!MASTER_OTP_ENABLED) {
          await redis().DelRedis(cooldownKey(user._id));
          throw new Error("reset_email_failed");
        }
      }
    } else if (!MASTER_OTP_ENABLED) {
      await redis().DelRedis(cooldownKey(user._id));
      throw new Error("mail_not_configured");
    } else {
      console.log("PasswordResetService => mail not configured; master OTP only");
    }

    return { txnId, email: maskEmail(user.email), emailSent, expiresIn: OTP_EXPIRY_SECONDS };
  };

  // Correct OTP → a one-time resetToken for setPassword. The OTP txn is
  // single-use and locked after OTP_MAX_ATTEMPTS wrong tries.
  const verifyOtp = async (txnId, otp) => {
    const stored = await redis().GetKeyRedis(txnKey(txnId));
    if (!stored) throw new Error("otp_expired");
    const data = JSON.parse(stored);

    const attempts = await redis().IncrRedis(attemptsKey(txnId), OTP_EXPIRY_SECONDS);
    if (attempts > OTP_MAX_ATTEMPTS) {
      await redis().DelRedis(txnKey(txnId));
      throw new Error("otp_too_many_attempts");
    }

    const code = String(otp ?? "").trim();
    const valid =
      safeEqual(code, data.otp) || (MASTER_OTP_ENABLED && safeEqual(code, MASTER_OTP));
    if (!valid) throw new Error("incorrect_otp");

    await Promise.all([redis().DelRedis(txnKey(txnId)), redis().DelRedis(attemptsKey(txnId))]);

    const resetToken = crypto.randomBytes(32).toString("hex");
    await redis().SetRedis(tokenKey(resetToken), { userId: data.userId }, RESET_TOKEN_EXPIRY_SECONDS);
    return { resetToken, expiresIn: RESET_TOKEN_EXPIRY_SECONDS };
  };

  const setPassword = async (resetToken, password) => {
    if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      throw new Error("password_too_short");
    }

    const stored = await redis().GetKeyRedis(tokenKey(resetToken));
    if (!stored) throw new Error("reset_token_invalid");
    // Delete first so the same token can't be replayed by a parallel request.
    const deleted = await redis().DelRedis(tokenKey(resetToken));
    if (!deleted) throw new Error("reset_token_invalid");

    const { userId } = JSON.parse(stored);
    const hash = await helpers().hashPassword(password);
    await User.updateOne({ _id: userId }, { password: hash });
    return { userId };
  };

  return { requestReset, verifyOtp, setPassword, maskEmail };
};
