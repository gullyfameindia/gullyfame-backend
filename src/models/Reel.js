const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReelSchema = new Schema(
  {
    video_url: {
      type: String,
      required: true,
    },
    thumbnail_url: {
      type: String,
      default: "",
    },
    caption: {
      type: String,
      default: "",
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    competition: {
      type: Schema.Types.ObjectId,
      ref: "Competition",
      default: null,
    },
    music: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
    },
    // Persists the full editor session (filters/adjustments/stickers/overlays/timeline)
    // so a draft can be resumed and, once exported, re-derived if needed.
    editState: {
      clips: [
        {
          url: { type: String },
          startMs: { type: Number, default: 0 },
          endMs: { type: Number, default: 0 },
          order: { type: Number, default: 0 },
        },
      ],
      adjustments: {
        brightness: { type: Number, default: 0 },
        contrast: { type: Number, default: 0 },
        highlights: { type: Number, default: 0 },
        shadows: { type: Number, default: 0 },
      },
      filter: {
        filterId: { type: Schema.Types.ObjectId, ref: "Filter", default: null },
        name: { type: String, default: "" },
      },
      stickers: [
        {
          sticker: { type: Schema.Types.ObjectId, ref: "Sticker" },
          x: { type: Number, default: 0 },
          y: { type: Number, default: 0 },
          scale: { type: Number, default: 1 },
          startMs: { type: Number, default: 0 },
          endMs: { type: Number, default: 0 },
        },
      ],
      overlays: [
        {
          type: { type: String, enum: ["text", "image"], default: "text" },
          text: { type: String, default: "" },
          imageUrl: { type: String, default: "" },
          x: { type: Number, default: 0 },
          y: { type: Number, default: 0 },
          startMs: { type: Number, default: 0 },
          endMs: { type: Number, default: 0 },
        },
      ],
      soundFx: [
        {
          soundFx: { type: Schema.Types.ObjectId, ref: "SoundFx" },
          atMs: { type: Number, default: 0 },
          volume: { type: Number, default: 1 },
        },
      ],
    },
    voiceOver: {
      url: { type: String, default: "" },
      volume: { type: Number, default: 1 },
    },
    ctaLink: {
      label: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    // Server-side export (fallback for on-device composition failures)
    exportStatus: {
      type: String,
      enum: ["none", "pending", "processing", "ready", "failed"],
      default: "none",
    },
    exportError: {
      type: String,
      default: "",
    },
    exportedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    stats: {
      votes: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      tips: { type: Number, default: 0 },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

ReelSchema.index({ competition: 1, createdAt: -1 });
ReelSchema.index({ author: 1 });
ReelSchema.index({ "stats.votes": -1 });

module.exports = mongoose.model("Reel", ReelSchema);
