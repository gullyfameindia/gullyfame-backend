const competitionRouter = require("express").Router();
const CompetitionController = require("../controllers/CompetitionController");
const FeedController = require("../controllers/FeedController");
const ErrorHandlerMiddleware = require("../middlewares/ErrorHandlerMiddleware");
const ResponseMiddleware = require("../middlewares/ResponseMiddleware");
const AuthMiddleware = require("../middlewares/AuthMiddleware");

/**
 * GET /competitions/:competitionId - Get competition details (status-dependent)
 */
competitionRouter.get(
  "/:competitionId",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CompetitionController().getDetails),
  ResponseMiddleware,
);

/**
 * GET /competitions/:competitionId/leaderboard - Paginated leaderboard
 * Query params: page, limit
 */
competitionRouter.get(
  "/:competitionId/leaderboard",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CompetitionController().getLeaderboard),
  ResponseMiddleware,
);

/**
 * GET /competitions/:competitionId/reels - Horizontal pagination for reels
 * Query params: cursor, limit
 */
competitionRouter.get(
  "/:competitionId/reels",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(FeedController().getCompetitionReels),
  ResponseMiddleware,
);

/**
 * POST /competitions/:competitionId/join - Join a competition (adds caller to participants)
 */
competitionRouter.post(
  "/:competitionId/join",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CompetitionController().join),
  ResponseMiddleware,
);

/**
 * POST /competitions/:competitionId/invite - Challenge another user to enter
 * Body: toUserId
 */
competitionRouter.post(
  "/:competitionId/invite",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(CompetitionController().invite),
  ResponseMiddleware,
);

module.exports = competitionRouter;
