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
AudioSchema.index({ title: "text", artist: "text" });

module.exports = mongoose.model("Audio", AudioSchema);
