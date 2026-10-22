// Push delivery via Firebase Cloud Messaging — HTTP v1 API (firebase-admin).
// Google deprecated the old "legacy server key" API; new Firebase projects
// don't even expose that key in the console anymore. This uses a Service
// Account instead, which is the only approach Google still supports.
//
// Setup (one-time, per environment):
//   1. Firebase Console -> Project Settings -> Service Accounts
//   2. "Generate new private key" -> downloads a .json file
//   3. Put its contents in the FIREBASE_SERVICE_ACCOUNT_JSON env var (as a
//      single-line JSON string), OR save the file on disk and point
//      GOOGLE_APPLICATION_CREDENTIALS at its path.
// Neither set -> push is skipped (logged once); notifications still save
// and show up in-app, they just won't ring the device.
require("dotenv").config();
const admin = require("firebase-admin");
const User = require("../models/User");

let initialized = false;
let initAttempted = false;
let warned = false;

const initFirebase = () => {
  if (initAttempted) return;
  initAttempted = true;

  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      credential = admin.credential.cert(serviceAccount);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = admin.credential.applicationDefault();
    } else {
      return; // not configured — stay uninitialized, callers no-op gracefully
    }

    admin.initializeApp({ credential });
    initialized = true;
  } catch (ex) {
    console.log("push.js => Firebase Admin init failed:", ex.message);
  }
};

// FCM's `data` payload only accepts string values.
const toStringMap = (data = {}) => {
  const out = {};
  for (const [key, value] of Object.entries(data)) {
    out[key] = value === null || value === undefined ? "" : String(value);
  }
  return out;
};

async function sendPush(user, { title, body, data = {} }) {
  if (!user || !user.device_token) return { skipped: "no_device_token" };

  initFirebase();

  if (!initialized) {
    if (!warned) {
      console.log(
        "push.js => Firebase not configured (set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS), skipping push delivery",
      );
      warned = true;
    }
    return { skipped: "firebase_not_configured" };
  }

  try {
    const messageId = await admin.messaging().send({
      token: user.device_token,
      notification: { title, body },
      data: toStringMap(data),
      android: { priority: "high" },
      apns: { headers: { "apns-priority": "10" } },
    });

    return { messageId };
  } catch (ex) {
    console.log("push.js => sendPush exception", ex.code || ex.message);

    // Stale/uninstalled-app token — clear it so we stop trying to push to it.
    const deadTokenCodes = [
      "messaging/registration-token-not-registered",
      "messaging/invalid-registration-token",
    ];
    if (deadTokenCodes.includes(ex.code)) {
      await User.updateOne({ _id: user._id }, { device_token: "" }).catch(() => {});
    }

    return { error: ex.message };
  }
}

module.exports = { sendPush };
