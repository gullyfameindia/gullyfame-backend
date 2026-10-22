const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReelInteractionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reel: {
      type: Schema.Types.ObjectId,
      ref: "Reel",
      required: true,
    },
    type: {
      type: String,
      enum: ["vote", "like", "save", "tip"],
      required: true,
    },
  },
  { timestamps: true },
);

ReelInteractionSchema.index({ user: 1, reel: 1, type: 1 }, { unique: true });
ReelInteractionSchema.index({ reel: 1, type: 1 });

module.exports = mongoose.model("ReelInteraction", ReelInteractionSchema);
