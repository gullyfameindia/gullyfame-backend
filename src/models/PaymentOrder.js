const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// One document per Razorpay order. Wallet credit happens exactly once, when
// the status flips to PAID (from either the client verify call or the webhook).
const PaymentOrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purpose: {
      type: String,
      enum: ["WALLET_RECHARGE"],
      default: "WALLET_RECHARGE",
    },
    // Amount in rupees — also the number of coins credited to the wallet.
    amount: {
      type: Number,
      required: true,
    },
    // Amount in paise, exactly as sent to Razorpay.
    amountPaise: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    receipt: {
      type: String,
      required: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED"],
      default: "CREATED",
    },
    failureReason: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

PaymentOrderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("PaymentOrder", PaymentOrderSchema);
