const CommentService = require("../services/CommentService");

module.exports = () => {
  const addComment = async (req, res, next) => {
    console.log("CommentController => addComment");
    const { userId, text, parentCommentId } = req.body;
    const { reelId } = req.params;

    if (!text) {
      req.rCode = 0;
      req.msg = "comment_text_required";
      return next();
    }

    let comment;
    try {
      comment = await CommentService().addComment(
        reelId,
        userId,
        text,
        parentCommentId,
      );
    } catch (ex) {
      const known = ["comment_text_required", "comment_too_long", "parent_comment_not_found"];
      if (!known.includes(ex.message)) throw ex;
      req.rCode = ex.message === "parent_comment_not_found" ? 5 : 0;
      req.msg = ex.message;
      return next();
    }

    if (!comment) {
      req.rCode = 5;
      req.msg = "reel_not_found";
      return next();
    }

    req.rData = comment;
    req.msg = "comment_added";
    next();
  };

  const listComments = async (req, res, next) => {
    console.log("CommentController => listComments");
    const { reelId } = req.params;
    const { userId } = req.body;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const data = await CommentService().listForReel(reelId, page, limit, userId);

    req.rData = data;
    req.msg = "success";
    next();
  };

  const deleteComment = async (req, res, next) => {
    console.log("CommentController => deleteComment");
    const { userId } = req.body;
    const { commentId } = req.params;

    const comment = await CommentService().softDeleteComment(
      commentId,
      userId,
    );

    if (!comment) {
      req.rCode = 5;
      req.msg = "comment_not_found";
      return next();
    }

    req.msg = "comment_deleted";
    next();
  };

  /**
   * POST /reels/comments/:commentId/like
   * Body (optional): { "liked": true | false } to set the state; without it, toggles.
   * -> { commentId, liked, likesCount }
   */
  const likeComment = async (req, res, next) => {
    console.log("CommentController => likeComment");
    const { userId, liked } = req.body;
    const { commentId } = req.params;

    let like;
    if (liked !== undefined) {
      if (liked === true || liked === "true") like = true;
      else if (liked === false || liked === "false") like = false;
      else {
        req.rCode = 0;
        req.msg = "liked_must_be_boolean";
        return next();
      }
    }

    const data = await CommentService().setCommentLike(commentId, userId, like);
    if (!data) {
      req.rCode = 5;
      req.msg = "comment_not_found";
      return next();
    }

    req.rData = data;
    req.msg = data.liked ? "comment_liked" : "comment_unliked";
    next();
  };

  return { addComment, listComments, deleteComment, likeComment };
};
