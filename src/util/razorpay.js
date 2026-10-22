const crypto = require("crypto");
const Razorpay = require("razorpay");

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const CURRENCY = process.env.RAZORPAY_CURRENCY || "INR";

let client = null;

const isConfigured = () => Boolean(KEY_ID && KEY_SECRET);

// Lazily built so the server still boots (and non-payment routes keep working)
// when Razorpay keys haven't been added to .env yet.
const getClient = () => {
  if (!isConfigured()) {
    throw new Error("razorpay_not_configured");
  }
  if (!client) {
    client = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
  }
  return client;
};

// The SDK rejects with plain objects ({ statusCode, error: { description } }),
// but ErrorHandlerMiddleware only reads `ex.message`.
const call = async (fn) => {
  try {
    return await fn(getClient());
  } catch (e) {
    if (e instanceof Error) throw e;
    console.log("Razorpay API error", JSON.stringify(e));
    throw new Error(e?.error?.description || "razorpay_error");
  }
};

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a || ""), "utf8");
  const bufB = Buffer.from(String(b || ""), "utf8");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

// Signature returned to the client by Razorpay Checkout after a payment:
// HMAC_SHA256(order_id + "|" + payment_id, key_secret)
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
};

// Signature sent in the `X-Razorpay-Signature` header of webhooks:
// HMAC_SHA256(raw request body, webhook_secret)
const verifyWebhookSignature = (rawBody, signature) => {
  if (!WEBHOOK_SECRET || !rawBody) return false;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
};

module.exports = {
  KEY_ID,
  CURRENCY,
  isConfigured,
  getClient,
  call,
  verifyPaymentSignature,
  verifyWebhookSignature,
};
