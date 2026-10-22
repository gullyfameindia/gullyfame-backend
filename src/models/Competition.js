const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompetitionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "LIVE",
        "UPCOMING",
        "ENDED",
        "CREATED",
        "APPROVED",
        "COMPLETED",
        "CANCELLED",
        "live",
      ],
      default: "UPCOMING",
      required: true,
    },
    prizePool: {
      type: Number,
      default: 0,
    },
    entryFee: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Set once the "starting soon" push/notification has fired, so the scheduler doesn't re-alert
    upcomingAlertSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

CompetitionSchema.index({ status: 1 });
CompetitionSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("Competition", CompetitionSchema);
