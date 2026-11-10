const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AudioSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      default: "",
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    // "Original sound" - the audio lifted from a user's own reel, so other
    // users can record over it. Admin-uploaded library tracks leave these unset.
    // Licensing. Empty on original sounds (the user made them) and on tracks
    // you own outright. Set for anything seeded from a free-music source.
    // CC-BY and similar REQUIRE the credit in `attribution` to be shown.
    license: {
      type: String,
      default: "",
    },
    licenseUrl: {
      type: String,
      default: "",
    },
    // Ready-made credit line, e.g. "Sunrise by Jane Doe (CC BY 4.0)".
    attribution: {
      type: String,
      default: "",
    },
    // Where it came from, also used to avoid seeding the same track twice.
    sourceUrl: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      default: "",
    },
    isOriginalSound: {
      type: Boolean,
      default: false,
    },
    // The reel the audio came from. Cleared if that reel is later deleted
    // while other people are still using the sound.
    sourceReel: {
      type: Schema.Types.ObjectId,
      ref: "Reel",
      default: null,
    },
    createdByUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    savedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

AudioSchema.index({ usageCount: -1 });
AudioSchema.index({ sourceReel: 1 });
AudioSchema.index({ sourceUrl: 1 });
AudioSchema.index({ createdByUser: 1, createdAt: -1 });
AudioSchema.index({ title: "text", artist: "text" });

module.exports = mongoose.model("Audio", AudioSchema);
