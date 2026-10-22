const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: Date,
      default: null,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    is_forwarded: {
      type: Boolean,
      default: false,
    },
    reply_to: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
    },
    reactions: [
      {
        user_id: { type: Schema.Types.ObjectId, ref: "User" },
        emoji: { type: String },
      },
    ],
    deleted_for: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

ChatSchema.index({ sender_id: 1, receiver_id: 1 });
ChatSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Chat", ChatSchema);
