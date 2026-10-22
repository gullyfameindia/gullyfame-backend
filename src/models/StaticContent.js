const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StaticContentSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["COMPETITION_RULES", "TERMS", "PRIVACY_POLICY", "ABOUT_US"],
      required: true,
      unique: true,
    },

    content: {
      type: String, // HTML / Markdown / Text
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StaticContent", StaticContentSchema);
