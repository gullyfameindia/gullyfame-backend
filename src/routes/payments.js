const paymentRouter = require("express").Router();
const PaymentController = require("../controllers/PaymentController");

/**
 * Razorpay webhook — configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL:    https://<your-domain>/v1/api/payments/razorpay/webhook
 *   Events: order.paid, payment.captured, payment.failed
 *   Secret: same value as RAZORPAY_WEBHOOK_SECRET
 * No auth middleware — requests are authenticated by their HMAC signature.
 */
paymentRouter.post(
  "/razorpay/webhook",
  PaymentController().razorpayWebhook,
);

module.exports = paymentRouter;
