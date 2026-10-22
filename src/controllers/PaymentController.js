const PaymentService = require("../services/PaymentService");
const razorpay = require("../util/razorpay");

module.exports = () => {
  // Razorpay retries any non-2xx response, so only reject bad signatures and
  // return 500 on real failures — everything else gets a 200.
  const razorpayWebhook = async (req, res) => {
    console.log("PaymentController => razorpayWebhook");
    const signature = req.headers["x-razorpay-signature"];

    if (!razorpay.verifyWebhookSignature(req.rawBody, signature)) {
      return res.status(400).json({ error: "invalid_signature" });
    }

    try {
      const result = await PaymentService().handleWebhook(req.body);
      console.log("Razorpay webhook", req.body.event, JSON.stringify(result));
      res.json({ status: "ok" });
    } catch (e) {
      console.log("Razorpay webhook error", e.message);
      res.status(500).json({ error: "webhook_processing_failed" });
    }
  };

  return { razorpayWebhook };
};
