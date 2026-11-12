const Comment = require("../models/Comment");
const CommentLike = require("../models/CommentLike");
const Reel = require("../models/Reel");
const mongoose = require("mongoose");

const MAX_COMMENT_LENGTH = 1000;
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

module.exports = () => {
  const addComment = async (reelId, authorId, text, parentComment) => {
    if (!isId(reelId)) return null;

    const reel = await Reel.findOne({
      _id: reelId,
      isDeleted: { $ne: true },
    });
    if (!reel) return null;

    const body = String(text || "").trim();
    if (!body) throw new Error("comment_text_required");
    if (body.length > MAX_COMMENT_LENGTH) throw new Error("comment_too_long");

    // A reply must point at a live comment on the same reel.
    let parentId = null;
    if (parentComment) {
      if (!isId(parentComment)) throw new Error("parent_comment_not_found");
      const parent = await Comment.findOne({
        _id: parentComment,
        reel: reel._id,
        isDeleted: { $ne: true },
      }).select("_id");
      if (!parent) throw new Error("parent_comment_not_found");
      parentId = parent._id;
    }

    const comment = await Comment.create({
      reel: reel._id,
      author: authorId,
      text: body,
      parentComment: parentId,
    });

    await Reel.updateOne({ _id: reel._id }, { $inc: { "stats.comments": 1 } });

    return comment;
  };

  /**
   * One page of a reel's comments, newest first. Each comment carries
   * `likesCount` and, for the viewer, `isLiked`.
   */
  const listForReel = async (reelId, page = 1, limit = 20, viewerId = null) => {
    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    if (!isId(reelId)) {
      return { page, limit, total: 0, hasMore: false, comments: [] };
    }

    const skip = (page - 1) * limit;
    const query = {
      reel: new mongoose.Types.ObjectId(reelId),
      isDeleted: { $ne: true },
    };

    const [rows, total] = await Promise.all([
      Comment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "_id firstName lastName username profileImage")
        .lean(),
      Comment.countDocuments(query),
    ]);

    let likedSet = new Set();
    if (viewerId && isId(viewerId) && rows.length) {
      const liked = await CommentLike.find({
        user: viewerId,
        comment: { $in: rows.map((c) => c._id) },
      })
        .select("comment")
        .lean();
      likedSet = new Set(liked.map((l) => String(l.comment)));
    }

    const comments = rows.map((c) => ({
      ...c,
      likesCount: Math.max(c.likesCount || 0, 0),
      isLiked: likedSet.has(String(c._id)),
    }));

    return {
      page,
      limit,
      total,
      hasMore: skip + comments.length < total,
      comments,
    };
  };

  const softDeleteComment = async (commentId, userId) => {
    if (!isId(commentId)) return null;

    // Only a live comment counts, so deleting twice can't lower the count twice.
    const comment = await Comment.findOneAndUpdate(
      { _id: commentId, author: userId, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true },
    );
    if (!comment) return null;

    await Reel.updateOne(
      { _id: comment.reel, "stats.comments": { $gt: 0 } },
      { $inc: { "stats.comments": -1 } },
    );

    return comment;
  };

  /**
   * Like or unlike a comment. `like` true/false sets the state; leave it out
   * to toggle. Returns { commentId, liked, likesCount }, or null when the
   * comment (or its reel) is gone.
   */
  const setCommentLike = async (commentId, userId, like) => {
    if (!isId(commentId)) return null;

    const comment = await Comment.findOne({
      _id: commentId,
      isDeleted: { $ne: true },
    }).select("_id reel likesCount");
    if (!comment) return null;

    const reelLive = await Reel.exists({ _id: comment.reel, isDeleted: { $ne: true } });
    if (!reelLive) return null;

    const existing = await CommentLike.exists({ comment: comment._id, user: userId });
    const want = typeof like === "boolean" ? like : !existing;

    if (want && !existing) {
      try {
        await CommentLike.create({ comment: comment._id, reel: comment.reel, user: userId });
        await Comment.updateOne({ _id: comment._id }, { $inc: { likesCount: 1 } });
      } catch (ex) {
        // Two taps at once: the other request already added the like.
        if (ex && ex.code !== 11000) throw ex;
      }
    } else if (!want && existing) {
      const removed = await CommentLike.deleteOne({ comment: comment._id, user: userId });
      if (removed.deletedCount) {
        await Comment.updateOne(
          { _id: comment._id, likesCount: { $gt: 0 } },
          { $inc: { likesCount: -1 } },
        );
      }
    }

    const fresh = await Comment.findById(comment._id).select("likesCount").lean();
    return {
      commentId: String(comment._id),
      liked: want,
      likesCount: Math.max((fresh && fresh.likesCount) || 0, 0),
    };
  };

  return { addComment, listForReel, softDeleteComment, setCommentLike };
};
