const twilio = require("twilio");

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// "verify" → Twilio Verify generates, sends and checks the code (recommended
//            for India: Twilio handles DLT template registration).
// "sms"    → we generate the code and send it as a plain SMS.
const MODE = (process.env.TWILIO_OTP_MODE || "verify").toLowerCase();
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;
const FROM_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let client = null;

const isConfigured = () => {
  if (!ACCOUNT_SID || !AUTH_TOKEN) return false;
  if (MODE === "verify") return Boolean(VERIFY_SERVICE_SID);
  return Boolean(MESSAGING_SERVICE_SID || FROM_NUMBER);
};

// Lazily built so the server still boots without Twilio keys (master OTP
// keeps login usable in that case).
const getClient = () => {
  if (!isConfigured()) {
    throw new Error("twilio_not_configured");
  }
  if (!client) {
    client = twilio(ACCOUNT_SID, AUTH_TOKEN);
  }
  return client;
};

// `otp` is only used in "sms" mode — Verify generates its own code.
const sendOtp = async (to, otp) => {
  const c = getClient();

  if (MODE === "verify") {
    await c.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({ to, channel: "sms" });
    return;
  }

  const minutes = Math.ceil(
    (parseInt(process.env.OTP_EXPIRY_SECONDS) || 300) / 60,
  );
  await c.messages.create({
    to,
    body: `${otp} is your Gully Fame verification code. It expires in ${minutes} minutes. Do not share it with anyone.`,
    ...(MESSAGING_SERVICE_SID
      ? { messagingServiceSid: MESSAGING_SERVICE_SID }
      : { from: FROM_NUMBER }),
  });
};

// Verify mode only. Returns true when Twilio approves the code.
const checkOtp = async (to, code) => {
  try {
    const check = await getClient()
      .verify.v2.services(VERIFY_SERVICE_SID)
      .verificationChecks.create({ to, code });
    return check.status === "approved";
  } catch (e) {
    // 20404: verification expired, already approved, or never created.
    if (e.code === 20404) return false;
    throw e;
  }
};

module.exports = { MODE, isConfigured, sendOtp, checkOtp };
