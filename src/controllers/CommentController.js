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

    const comment = await CommentService().addComment(
      reelId,
      userId,
      text,
      parentCommentId,
    );

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
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const data = await CommentService().listForReel(reelId, page, limit);

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

  return { addComment, listComments, deleteComment };
};
