const notificationRouter = require("express").Router();
const NotificationController = require("../controllers/NotificationController");
const ErrorHandlerMiddleware = require("../middlewares/ErrorHandlerMiddleware");
const ResponseMiddleware = require("../middlewares/ResponseMiddleware");
const AuthMiddleware = require("../middlewares/AuthMiddleware");

/**
 * GET /notification/notification - Get notifications with filtering
 * Query params: time (1=Today, 2=Past), page, limit
 */
notificationRouter.get(
  "/notification",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(NotificationController().getNotifications),
  ResponseMiddleware,
);

/**
 * PUT /notification/:notificationId/read - Mark a single notification as read
 */
notificationRouter.put(
  "/:notificationId/read",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(NotificationController().markAsRead),
  ResponseMiddleware,
);

/**
 * PUT /notification/read-all - Mark all of the caller's notifications as read
 */
notificationRouter.put(
  "/read-all",
  AuthMiddleware().verifyUserToken,
  ErrorHandlerMiddleware(NotificationController().markAllAsRead),
  ResponseMiddleware,
);

module.exports = notificationRouter;
