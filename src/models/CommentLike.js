const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommentLikeSchema = new Schema(
  {
    comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
    // Stored so a deleted reel's likes can be cleaned up in one query.
    reel: { type: Schema.Types.ObjectId, ref: "Reel", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

CommentLikeSchema.index({ comment: 1, user: 1 }, { unique: true });
CommentLikeSchema.index({ reel: 1 });

module.exports = mongoose.model("CommentLike", CommentLikeSchema);
