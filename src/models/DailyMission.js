const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DailyMissionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Calendar day this mission belongs to, e.g. "2026-08-05" (server-local date)
    day: {
      type: String,
      required: true,
    },
    target: {
      type: Number,
      default: 5,
    },
    current: {
      type: Number,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    rewardXp: {
      type: Number,
      default: 20,
    },
    rewardCoins: {
      type: Number,
      default: 10,
    },
    rewardClaimed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

DailyMissionSchema.index({ user: 1, day: 1 }, { unique: true });

module.exports = mongoose.model("DailyMission", DailyMissionSchema);
