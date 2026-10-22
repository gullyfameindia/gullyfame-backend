const UserService = require("../services/UserService");
const FollowService = require("../services/FollowService");
const fileUploadService = require("../util/s3");
var ObjectId = require("mongoose").Types.ObjectId;

module.exports = () => {
  const updateDeviceToken = async (req, res, next) => {
    console.log("UserController => updateDeviceToken");
    let { userId, deviceToken, deviceType } = req.body;

    let user = { deviceToken, deviceType };

    await UserService().updateUsers(userId, user);

    req.rData = {};
    req.msg = "success";
    next();
  };

  /**
   * List of Users
   */
  const getAllUserList = async (req, res, next) => {
    console.log("UserController => getAllUserList");
    let { search, page, limit } = req.query;
    let { UserId } = req.body;

    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;

    let query = {};

    if (UserId) {
      query._id = { $ne: UserId };
    }

    if (search) {
      query = {
        $or: [
          {
            fullName: { $regex: RegexEscape(search), $options: "i" },
          },
          {
            username: { $regex: RegexEscape(search), $options: "i" },
          },
        ],
      };
    }

    let user = await UserService().getUsers(query, page, limit);
    let total_user = await UserService().countUsers(query);

    req.msg = "users_list";

    req.rData = {
      search,
      page,
      limit,
      total_user,
      user,
    };

    next();
  };

  const getDetails = async (req, res, next) => {
    console.log("UserController => getDetails");
    let { userId } = req.body;
    let user = await UserService().fetch(userId);

    if (user) {
      req.msg = "success";
      req.rData = user;
    } else {
      req.rCode = 5;
      req.msg = "user_not_found";
      req.rData = {};
    }

    next();
  };

  const editUser = async (req, res, next) => {
    console.log("UserController => editUser");
    let { longitude, latitude, userId } = req.body;
    let profileImages = "";
    let { id } = req.params;

    id = userId;
    if (req.files && req.files.profileImages) {
      const file = req.files.profileImages;

      const uploadRes = await fileUploadService.uploadFileToAws(file);
      profileImages = uploadRes.images;
      req.body.profileImages = profileImages;
    }

    // ✅ Update Location if coordinates provided
    if (latitude && longitude) {
      req.body.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)], // IMPORTANT: [long, lat]
      };
    }

    // Remove raw lat/long fields so they don't store in DB
    delete req.body.latitude;
    delete req.body.longitude;

    await UserService().updateUsers(id, req.body);

    req.rData = {};

    next();
  };

  /**
   * Notification
   */

  const activateDeactivateNotification = async (req, res, next) => {
    console.log("UserController => activateDeactivateNotification");
    let { userId, notificationAllowed } = req.body;

    let user = await UserService().fetch(userId);

    if (user) {
      if (user.isActive == 0) {
        notificationAllowed = 1;
      } else {
        notificationAllowed = 0;
      }
      let user_data = { notificationAllowed };
      user = await UserService().updateUsers(userId, user_data);
    }

    req.msg = "status_changed";
    next();
  };

  const follow = async (req, res, next) => {
    console.log("UserController => follow");
    const { userId } = req.body;
    const { userId: targetUserId } = req.params;

    const data = await FollowService().toggleFollow(userId, targetUserId);

    req.rData = data;
    req.msg = "follow_toggled";
    next();
  };

  return {
    /**
     * Auth
     */
    updateDeviceToken,
    /**
     * Users
     */
    getAllUserList,
    getDetails,
    editUser,
    follow,

    /**
     * Notification
     */
    activateDeactivateNotification,
  };
};
