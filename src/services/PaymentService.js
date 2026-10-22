const mongoose = require("mongoose");
const PaymentOrder = require("../models/PaymentOrder");
const WalletService = require("./WalletService");
const razorpay = require("../util/razorpay");

const MIN_RECHARGE = parseInt(process.env.WALLET_MIN_RECHARGE) || 1;
const MAX_RECHARGE = parseInt(process.env.WALLET_MAX_RECHARGE) || 100000;

module.exports = () => {
  const createRechargeOrder = async (userId, amount) => {
    if (
      !Number.isInteger(amount) ||
      amount < MIN_RECHARGE ||
      amount > MAX_RECHARGE
    ) {
      throw new Error("invalid_recharge_amount");
    }

    const amountPaise = amount * 100;
    // Razorpay caps receipt at 40 chars.
    const receipt = `wr_${userId.toString().slice(-12)}_${Date.now()}`;

    const order = await razorpay.call((client) =>
      client.orders.create({
        amount: amountPaise,
        currency: razorpay.CURRENCY,
        receipt,
        notes: {
          userId: userId.toString(),
          purpose: "WALLET_RECHARGE",
        },
      }),
    );

    await PaymentOrder.create({
      user: userId,
      amount,
      amountPaise,
      currency: order.currency,
      receipt,
      razorpayOrderId: order.id,
    });

    // Everything the app needs to open Razorpay Checkout.
    return {
      keyId: razorpay.KEY_ID,
      orderId: order.id,
      amount,
      amountPaise,
      currency: order.currency,
      receipt,
    };
  };

  // Atomically flips the order to PAID and credits the wallet in the same
  // Mongo transaction, so verify + webhook racing each other credit only once.
  const fulfillOrder = async (razorpayOrderId, { paymentId, signature }) => {
    let result;
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await PaymentOrder.findOneAndUpdate(
          { razorpayOrderId, status: { $ne: "PAID" } },
          {
            $set: {
              status: "PAID",
              razorpayPaymentId: paymentId,
              razorpaySignature: signature || null,
              failureReason: "",
              paidAt: new Date(),
            },
          },
          { new: true, session },
        );

        if (!order) {
          result = { alreadyProcessed: true };
          return;
        }

        const wallet = await WalletService().credit(
          order.user,
          order.amount,
          {
            type: "RECHARGE",
            note: `Wallet recharge via Razorpay (${paymentId})`,
          },
          session,
        );

        result = { alreadyProcessed: false, balance: wallet.balance };
      });
    } finally {
      await session.endSession();
    }
    return result;
  };

  // Makes sure the payment really belongs to this order, is for the full
  // amount, and is captured (capturing it ourselves if auto-capture is off).
  const ensureCaptured = async (order, paymentId) => {
    let payment = await razorpay.call((client) =>
      client.payments.fetch(paymentId),
    );

    if (payment.order_id !== order.razorpayOrderId) {
      throw new Error("payment_order_mismatch");
    }
    if (Number(payment.amount) !== order.amountPaise) {
      throw new Error("payment_amount_mismatch");
    }

    if (payment.status === "authorized") {
      payment = await razorpay.call((client) =>
        client.payments.capture(paymentId, order.amountPaise, order.currency),
      );
    }

    if (payment.status !== "captured") {
      throw new Error("payment_not_captured");
    }
    return payment;
  };

  const verifyRecharge = async (userId, { orderId, paymentId, signature }) => {
    if (!orderId || !paymentId || !signature) {
      throw new Error("payment_details_required");
    }

    const order = await PaymentOrder.findOne({
      razorpayOrderId: orderId,
      user: userId,
    });
    if (!order) {
      throw new Error("payment_order_not_found");
    }

    if (!razorpay.verifyPaymentSignature(orderId, paymentId, signature)) {
      throw new Error("invalid_payment_signature");
    }

    if (order.status !== "PAID") {
      await ensureCaptured(order, paymentId);
    }

    const result = await fulfillOrder(orderId, { paymentId, signature });
    const wallet = await WalletService().getOrCreateWallet(userId);

    return {
      orderId,
      paymentId,
      status: "PAID",
      credited: order.amount,
      alreadyProcessed: result.alreadyProcessed,
      balance: wallet.balance,
    };
  };

  const getOrderStatus = async (userId, orderId) => {
    const order = await PaymentOrder.findOne({
      razorpayOrderId: orderId,
      user: userId,
    }).lean();
    if (!order) {
      throw new Error("payment_order_not_found");
    }
    return {
      orderId: order.razorpayOrderId,
      paymentId: order.razorpayPaymentId,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      failureReason: order.failureReason,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    };
  };

  // Server-to-server safety net: credits the wallet even if the app is killed
  // before it can call the verify endpoint.
  const handleWebhook = async (event) => {
    const type = event && event.event;
    const payment = event?.payload?.payment?.entity;

    if (type === "order.paid" || type === "payment.captured") {
      if (!payment || !payment.order_id) return { ignored: true };

      const order = await PaymentOrder.findOne({
        razorpayOrderId: payment.order_id,
      });
      if (!order) return { ignored: true };
      if (Number(payment.amount) !== order.amountPaise) {
        console.log("Razorpay webhook amount mismatch", payment.order_id);
        return { ignored: true };
      }

      const result = await fulfillOrder(payment.order_id, {
        paymentId: payment.id,
      });
      return { processed: true, ...result };
    }

    if (type === "payment.failed") {
      if (!payment || !payment.order_id) return { ignored: true };

      // Never downgrade an order that's already been paid (a user can retry
      // and succeed on the same order after a failed attempt).
      await PaymentOrder.updateOne(
        { razorpayOrderId: payment.order_id, status: { $ne: "PAID" } },
        {
          $set: {
            status: "FAILED",
            razorpayPaymentId: payment.id,
            failureReason:
              payment.error_description || payment.error_reason || "",
          },
        },
      );
      return { processed: true };
    }

    return { ignored: true };
  };

  return { createRechargeOrder, verifyRecharge, getOrderStatus, handleWebhook };
};
