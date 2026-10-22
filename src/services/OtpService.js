const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const redis = require("../util/redis");
const helpers = require("../util/helpers");
const twilio = require("../util/twilio");

const OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS) || 300;
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;
const RESEND_COOLDOWN_SECONDS =
  parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 30;
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || "+91";

const MASTER_OTP = String(process.env.MASTER_OTP_LOGIN || "").trim();
// Temporary testing backdoor — set MASTER_OTP_ENABLED=false before go-live.
const MASTER_OTP_ENABLED =
  String(process.env.MASTER_OTP_ENABLED || "true").toLowerCase() === "true" &&
  Boolean(MASTER_OTP);

const txnKey = (txnId) => `USER|txnId:${txnId}`;
const attemptsKey = (txnId) => `OTP_ATTEMPTS|txnId:${txnId}`;
const cooldownKey = (target) => `OTP_COOLDOWN|${target}`;

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a), "utf8");
  const bufB = Buffer.from(String(b), "utf8");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// "9876543210" + "+91" → "+919876543210"; already-E.164 numbers pass through.
const toE164 = (mobile, countryCode) => {
  const raw = String(mobile).replace(/[\s\-()]/g, "");
  if (raw.startsWith("+")) return raw;
  const cc = String(countryCode || DEFAULT_COUNTRY_CODE).replace(/[^\d]/g, "");
  return `+${cc}${raw.replace(/^0+/, "")}`;
};

module.exports = () => {
  // Creates a txn, stores it in Redis and sends the code via Twilio.
  // Email logins have no SMS channel, so they only work with the master OTP.
  const issueOtp = async ({ mobile, email, countryCode, reason }) => {
    const target = mobile ? toE164(mobile, countryCode) : email;

    const allowed = await redis().SetNxRedis(
      cooldownKey(target),
      1,
      RESEND_COOLDOWN_SECONDS,
    );
    if (!allowed) {
      throw new Error("otp_resend_too_soon");
    }

    const txnId = uuidv4();
    const otp = twilio.MODE === "sms" ? helpers().generateOTP() : null;

    const otpData = {
      txnId,
      mobile,
      email,
      phone: mobile ? target : null,
      countryCode,
      otp,
      reason,
      is_active: 1,
      date_created: new Date(),
      date_modified: new Date(),
    };
    await redis().SetRedis(txnKey(txnId), otpData, OTP_EXPIRY_SECONDS);

    let smsSent = false;
    if (mobile && twilio.isConfigured()) {
      try {
        await twilio.sendOtp(target, otp);
        smsSent = true;
      } catch (e) {
        console.log("OtpService => Twilio send failed", e.code, e.message);
        // While the master OTP is on, testers can still log in — don't block them.
        if (!MASTER_OTP_ENABLED) {
          await redis().DelRedis(cooldownKey(target));
          throw new Error("otp_send_failed");
        }
      }
    } else if (!MASTER_OTP_ENABLED) {
      // Nothing would deliver the code and no fallback exists.
      await redis().DelRedis(cooldownKey(target));
      throw new Error(
        mobile ? "otp_service_unavailable" : "otp_email_not_supported",
      );
    } else {
      console.log(
        `OtpService => SMS not sent (${mobile ? "Twilio not configured" : "email login"}); master OTP only`,
      );
    }

    return { txnId, smsSent, expiresIn: OTP_EXPIRY_SECONDS };
  };

  // Returns the stored txn data when the code is correct. One-time use: the
  // txn is deleted on success, and locked after OTP_MAX_ATTEMPTS wrong tries.
  const verifyOtp = async (txnId, otp) => {
    const stored = await redis().GetKeyRedis(txnKey(txnId));
    if (!stored) {
      throw new Error("otp_expired");
    }
    const otpData = JSON.parse(stored);

    const attempts = await redis().IncrRedis(
      attemptsKey(txnId),
      OTP_EXPIRY_SECONDS,
    );
    if (attempts > OTP_MAX_ATTEMPTS) {
      await redis().DelRedis(txnKey(txnId));
      throw new Error("otp_too_many_attempts");
    }

    const code = String(otp ?? "").trim();
    let valid = false;

    if (MASTER_OTP_ENABLED && safeEqual(code, MASTER_OTP)) {
      valid = true;
    } else if (twilio.MODE === "sms") {
      valid = Boolean(otpData.otp) && safeEqual(code, otpData.otp);
    } else if (otpData.phone && twilio.isConfigured()) {
      valid = await twilio.checkOtp(otpData.phone, code.padStart(6, "0"));
    }

    if (!valid) {
      throw new Error("incorrect_otp");
    }

    await Promise.all([
      redis().DelRedis(txnKey(txnId)),
      redis().DelRedis(attemptsKey(txnId)),
    ]);
    return otpData;
  };

  return { issueOtp, verifyOtp, toE164 };
};
