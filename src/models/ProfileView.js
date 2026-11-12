const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RETENTION_DAYS = 90;

// One row per viewer per profile per day (India time), so opening the same
// profile again the same day does not inflate the count.
const ProfileViewSchema = new Schema(
  {
    profile: { type: Schema.Types.ObjectId, ref: "User", required: true },
    viewer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true }, // "YYYY-MM-DD"
  },
  { timestamps: true },
);

ProfileViewSchema.index({ profile: 1, viewer: 1, day: 1 }, { unique: true });
ProfileViewSchema.index({ profile: 1, day: 1 });
// Old rows are dropped automatically; insights only look back 90 days.
ProfileViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });

const ProfileView = mongoose.model("ProfileView", ProfileViewSchema);
ProfileView.RETENTION_DAYS = RETENTION_DAYS;

module.exports = ProfileView;
