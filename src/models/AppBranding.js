const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AppBrandingSchema = new Schema(
  {
    logo: {
      type: [String], // S3 URLs
      default: [],
    },

    splashImage: {
      type: [String],
      default: [],
    },

    splashTitle: String,
    splashSubtitle: String,
    splashButtonText: String,

    showOverlay: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppBranding", AppBrandingSchema);
