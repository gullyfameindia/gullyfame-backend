const Comment = require("../models/Comment");
const Reel = require("../models/Reel");
const mongoose = require("mongoose");

module.exports = () => {
  const addComment = async (reelId, authorId, text, parentComment) => {
    const reel = await Reel.findOne({
      _id: reelId,
      isDeleted: { $ne: true },
    });
    if (!reel) return null;

    const comment = await Comment.create({
      reel: reelId,
      author: authorId,
      text,
      parentComment: parentComment || null,
    });

    await Reel.updateOne({ _id: reelId }, { $inc: { "stats.comments": 1 } });

    return comment;
  };

  const listForReel = async (reelId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const query = {
      reel: new mongoose.Types.ObjectId(reelId),
      isDeleted: { $ne: true },
    };

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "_id firstName lastName username profileImage")
        .lean(),
      Comment.countDocuments(query),
    ]);

    return {
      page,
      limit,
      total,
      hasMore: skip + comments.length < total,
      comments,
    };
  };

  const softDeleteComment = async (commentId, userId) => {
    const comment = await Comment.findOne({ _id: commentId, author: userId });
    if (!comment) return null;

    comment.isDeleted = true;
    await comment.save();

    await Reel.updateOne(
      { _id: comment.reel },
      { $inc: { "stats.comments": -1 } },
    );

    return comment;
  };

  return { addComment, listForReel, softDeleteComment };
};
