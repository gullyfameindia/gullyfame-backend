const Notification = require("../models/Notification");
const User = require("../models/User");
const pushService = require("../util/push");

module.exports = () => {
  // Creates the in-app notification row and (best-effort) fires a push if the
  // user has a device token registered. Used by every trigger in
  // NotificationTriggerService so the two never drift apart.
  const notifyUser = async (userId, { title, description, type, data }) => {
    const notification = await Notification.create({
      userId,
      title,
      description,
      type: type || "GENERAL",
      data: data || {},
    });

    const user = await User.findById(userId)
      .select("device_token device_type notificationAllowed")
      .lean();

    if (user && user.notificationAllowed) {
      await pushService.sendPush(user, { title, body: description, data });
    }

    return notification;
  };
  const getNotifications = async (userId, time, page, limit) => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    let dateFilter = {};
    if (time === 1) {
      // Today's notifications
      dateFilter = { createdAt: { $gte: startOfToday } };
    } else if (time === 2) {
      // Past notifications (before today)
      dateFilter = { createdAt: { $lt: startOfToday } };
    }

    const query = { userId, isActive: true, ...dateFilter };
    const skip = (page - 1) * limit;

    const totalNotifications = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      status: "unRead",
    });

    const notifications = await Notification.find(query)
      .select("_id title description status createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return { totalNotifications, unreadCount, notifications };
  };

  const createNotification = async (data) => {
    return Notification.create(data);
  };

  const markAsRead = async (notificationId, userId) => {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { status: "read" },
      { new: true },
    );
  };

  const markAllAsRead = async (userId) => {
    const result = await Notification.updateMany(
      { userId, status: "unRead" },
      { status: "read" },
    );
    return { updated: result.modifiedCount || 0 };
  };

  return {
    getNotifications,
    createNotification,
    notifyUser,
    markAsRead,
    markAllAsRead,
  };
};
