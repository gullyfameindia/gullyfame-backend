const feedRouter = require("express").Router();
const FeedController = require("../controllers/FeedController");
const ErrorHandlerMiddleware = require("../middlewares/ErrorHandlerMiddleware");
const ResponseMiddleware = require("../middlewares/ResponseMiddleware");
const AuthMiddleware = require("../middlewares/AuthMiddleware");

/**
 * GET /feed/matrix - Matrix initialization (vertical scroll)
 * Query params: page, limit
 */
feedRouter.get(
  "/matrix",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(FeedController().getMatrix),
  ResponseMiddleware,
);

module.exports = feedRouter;
