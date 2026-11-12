const NotificationService = require("../services/NotificationService");

module.exports = () => {
  const getNotifications = async (req, res, next) => {
    console.log("NotificationController => getNotifications");
    const { userId } = req.body;
    let time = req.query.time ? parseInt(req.query.time) : 1;
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const { totalNotifications, unreadCount, notifications } =
      await NotificationService().getNotifications(userId, time, page, limit);

    req.rData = {
      page,
      limit,
      time,
      totalNotifications,
      unreadCount,
      notifications,
    };
    req.msg = "success";
    next();
  };

  const markAsRead = async (req, res, next) => {
    console.log("NotificationController => markAsRead");
    const { notificationId } = req.params;
    const { userId } = req.body;

    const data = await NotificationService().markAsRead(notificationId, userId);

    if (!data) {
      req.rCode = 5;
      req.msg = "notification_not_found";
      return next();
    }

    req.rData = data;
    req.msg = "success";
    next();
  };

  const markAllAsRead = async (req, res, next) => {
    console.log("NotificationController => markAllAsRead");
    const { userId } = req.body;

    const data = await NotificationService().markAllAsRead(userId);

    req.rData = data;
    req.msg = "success";
    next();
  };

  /** DELETE /notification/:notificationId - remove one of the caller's notifications */
  const deleteNotification = async (req, res, next) => {
    console.log("NotificationController => deleteNotification");
    const { notificationId } = req.params;
    const { userId } = req.body;

    const data = await NotificationService().deleteNotification(notificationId, userId);
    if (!data) {
      req.rCode = 5;
      req.msg = "notification_not_found";
      return next();
    }

    req.rData = { _id: data._id, deleted: true };
    req.msg = "notification_deleted";
    next();
  };

  /** DELETE /notification - remove all of the caller's notifications */
  const deleteAllNotifications = async (req, res, next) => {
    console.log("NotificationController => deleteAllNotifications");
    const { userId } = req.body;
    req.rData = await NotificationService().deleteAllNotifications(userId);
    req.msg = "notifications_cleared";
    next();
  };

  return { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications };
};
