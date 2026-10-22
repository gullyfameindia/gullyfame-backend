const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["RECHARGE", "TIP_SENT", "TIP_RECEIVED", "MISSION_REWARD"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    relatedReel: {
      type: Schema.Types.ObjectId,
      ref: "Reel",
      default: null,
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

TransactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Transaction", TransactionSchema);
