const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// One row per (user, chatter) pair — marks that `user` has archived their
// conversation with `chatter`. Archiving is per-viewer, not global.
const ChatArchiveSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chatter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

ChatArchiveSchema.index({ user: 1, chatter: 1 }, { unique: true });

module.exports = mongoose.model("ChatArchive", ChatArchiveSchema);
