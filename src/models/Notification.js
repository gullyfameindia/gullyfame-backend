const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["read", "unRead"],
      default: "unRead",
    },
    type: {
      type: String,
      enum: [
        "RANK_BOOST",
        "LEVEL_UP",
        "DAILY_CHALLENGE_READY",
        "DAILY_CHALLENGE_COMPLETE",
        "RAP_BATTLE_INVITE",
        "UPCOMING_EVENT",
        "PROFILE_UPDATE",
        "SUPPORT_RECEIVED",
        "GENERAL",
      ],
      default: "GENERAL",
    },
    // Free-form payload the client uses for deep-linking (e.g. { competitionId, reelId })
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
