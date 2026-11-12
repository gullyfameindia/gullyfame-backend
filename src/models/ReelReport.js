const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Why a user reported a reel. Keep in sync with REPORT_REASONS in the app.
const REPORT_REASONS = [
  "spam",
  "nudity",
  "violence",
  "hate",
  "harassment",
  "self_harm",
  "copyright",
  "misinformation",
  "other",
];

// open      - waiting for an admin
// dismissed - admin looked and kept the reel
// removed   - admin removed the reel (or it was removed another way)
const REPORT_STATUSES = ["open", "dismissed", "removed"];

const ReelReportSchema = new Schema(
  {
    reel: { type: Schema.Types.ObjectId, ref: "Reel", required: true },
    reelAuthor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, default: "", trim: true, maxlength: 500 },
    status: { type: String, enum: REPORT_STATUSES, default: "open" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

// One report per user per reel; reporting again updates it.
ReelReportSchema.index({ reel: 1, reporter: 1 }, { unique: true });
ReelReportSchema.index({ status: 1, createdAt: -1 });

const ReelReport = mongoose.model("ReelReport", ReelReportSchema);
ReelReport.REPORT_REASONS = REPORT_REASONS;
ReelReport.REPORT_STATUSES = REPORT_STATUSES;

module.exports = ReelReport;
