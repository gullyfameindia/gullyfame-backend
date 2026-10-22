const reelRouter = require("express").Router();
const FeedController = require("../controllers/FeedController");
const ReelController = require("../controllers/ReelController");
const CaptionController = require("../controllers/CaptionController");
const CommentController = require("../controllers/CommentController");
const WalletController = require("../controllers/WalletController");
const ErrorHandlerMiddleware = require("../middlewares/ErrorHandlerMiddleware");
const ResponseMiddleware = require("../middlewares/ResponseMiddleware");
const AuthMiddleware = require("../middlewares/AuthMiddleware");

/**
 * POST /reels/upload-url - Get a pre-signed S3 URL to upload a video/thumbnail directly
 */
reelRouter.post(
  "/upload-url",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ReelController().getUploadUrl),
  ResponseMiddleware,
);

/**
 * POST /reels/publish - Create (or promote an existing draft to) a published reel
 */
reelRouter.post(
  "/publish",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ReelController().publish),
  ResponseMiddleware,
);

/**
 * POST /reels/draft - Save/upsert the caller's in-progress draft reel
 * GET /reels/draft - Fetch the caller's current draft reel
 */
reelRouter.post(
  "/draft",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ReelController().saveDraft),
  ResponseMiddleware,
);

reelRouter.get(
  "/draft",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ReelController().getDraft),
  ResponseMiddleware,
);

/**
 * POST /reels/auto-caption - Transcribe an uploaded/uploaded-to-S3 video into caption text (OpenAI Whisper)
 */
reelRouter.post(
  "/auto-caption",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CaptionController().generateCaption),
  ResponseMiddleware,
);

/**
 * GET /reels - List reels (newest first), cursor-paginated
 * Query params: cursor (reelId), limit
 */
reelRouter.get(
  "/",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(FeedController().listReels),
  ResponseMiddleware,
);

/**
 * POST /reels/:reelId/action - Toggle action (vote, like, save)
 */
reelRouter.post(
  "/:reelId/action",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(FeedController().toggleAction),
  ResponseMiddleware,
);

/**
 * Comments
 */
reelRouter.post(
  "/:reelId/comments",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CommentController().addComment),
  ResponseMiddleware,
);

reelRouter.get(
  "/:reelId/comments",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CommentController().listComments),
  ResponseMiddleware,
);

reelRouter.delete(
  "/comments/:commentId",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CommentController().deleteComment),
  ResponseMiddleware,
);

/**
 * POST /reels/:reelId/export - Start a server-side render fallback
 * GET /reels/:reelId/export/status - Poll for completion
 */
reelRouter.post(
  "/:reelId/export",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ReelController().startExport),
  ResponseMiddleware,
);

reelRouter.get(
  "/:reelId/export/status",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(ReelController().getExportStatus),
  ResponseMiddleware,
);

/**
 * POST /reels/:reelId/tip - Tip the reel's creator from the caller's wallet
 */
reelRouter.post(
  "/:reelId/tip",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(WalletController().tipCreator),
  ResponseMiddleware,
);

module.exports = reelRouter;
