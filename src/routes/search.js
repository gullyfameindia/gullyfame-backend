const searchRouter = require("express").Router();
const SearchController = require("../controllers/SearchController");
const ErrorHandlerMiddleware = require("../middlewares/ErrorHandlerMiddleware");
const ResponseMiddleware = require("../middlewares/ResponseMiddleware");
const AuthMiddleware = require("../middlewares/AuthMiddleware");

/**
 * GET /search?q=<term>&type=<all|users|competitions|reels>&page=1&limit=15
 */
searchRouter.get(
  "/",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(SearchController().globalSearch),
  ResponseMiddleware,
);

module.exports = searchRouter;
