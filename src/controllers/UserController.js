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
      const counts = await FollowService().getCounts(userId);
      req.msg = "success";
      req.rData = { ...user.toObject(), ...counts };
    } else {
      req.rCode = 5;
      req.msg = "user_not_found";
      req.rData = {};
    }

    next();
  };

  /**
   * Fields a user may change on their own profile. Anything else in the body
   * (xp, level, isActive, isDeleted, password, mobile, googleId, ...) is
   * ignored and listed back in `ignoredFields`.
   */
  const EDITABLE_STRING_FIELDS = [
    "firstName",
    "lastName",
    "username",
    "dob",
    "device_token",
  ];
  const ENUMS = {
    gender: ["male", "female", "non-binary", "prefer-not-to-say", ""],
    role: ["participants", "fan"],
    device_type: ["android", "ios", "web", ""],
  };

  const toBool = (v) => {
    if (v === true || v === "true" || v === 1 || v === "1") return true;
    if (v === false || v === "false" || v === 0 || v === "0") return false;
    return undefined;
  };

  const editUser = async (req, res, next) => {
    console.log("UserController => editUser");
    const body = req.body || {};
    const { longitude, latitude, userId } = body;

    const update = {};

    for (const field of EDITABLE_STRING_FIELDS) {
      if (body[field] === undefined) continue;
      if (typeof body[field] !== "string" || body[field].length > 255) {
        throw new Error(`${field} must be text (max 255 characters)`);
      }
      update[field] = body[field].trim();
    }

    for (const [field, allowed] of Object.entries(ENUMS)) {
      if (body[field] === undefined) continue;
      if (!allowed.includes(body[field])) {
        throw new Error(
          `${field} must be one of: ${allowed.filter(Boolean).join(", ")}`,
        );
      }
      update[field] = body[field];
    }

    if (body.email !== undefined) {
      const email = String(body.email).toLowerCase().trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address");
      }
      if (email) {
        const taken = await UserService().fetchByQuery({
          email,
          _id: { $ne: userId },
        });
        if (taken) throw new Error("This email is already used by another account");
      }
      update.email = email;
    }

    if (body.categories !== undefined && body.categories !== "") {
      if (!ObjectId.isValid(String(body.categories))) {
        throw new Error("categories must be a valid category id");
      }
      update.categories = body.categories;
    }

    if (body.notificationAllowed !== undefined) {
      const v = toBool(body.notificationAllowed);
      if (v === undefined) throw new Error("notificationAllowed must be true or false");
      update.notificationAllowed = v;
    }

    // Profile photo: accept the file as `profileImage` or `profileImages`
    // and store the URL in the model's `profileImage` field.
    const photo =
      req.files && (req.files.profileImage || req.files.profileImages);
    if (photo) {
      const uploadRes = await fileUploadService.uploadFileToAws(
        Array.isArray(photo) ? photo[0] : photo,
      );
      const url = Array.isArray(uploadRes.images)
        ? uploadRes.images[0]
        : uploadRes.images;
      if (url) update.profileImage = url;
    } else if (typeof body.profileImage === "string") {
      update.profileImage = body.profileImage.trim();
    }

    // Location if coordinates provided — stored as [long, lat]
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        throw new Error("latitude and longitude must be numbers");
      }
      update.location = { type: "Point", coordinates: [lng, lat] };
    }

    const handled = new Set([
      ...EDITABLE_STRING_FIELDS,
      ...Object.keys(ENUMS),
      "email",
      "categories",
      "notificationAllowed",
      "profileImage",
      "latitude",
      "longitude",
      "userId", // set by the auth middleware, not by the client
    ]);
    const ignoredFields = Object.keys(body).filter((k) => !handled.has(k));

    if (Object.keys(update).length) {
      await UserService().updateUsers(userId, update);
    }

    const user = await UserService().fetch(userId);

    req.rData = ignoredFields.length ? { user, ignoredFields } : { user };
    req.msg = "profile_updated";
    next();
  };

  /**
   * Notification
   */

  /**
   * GET /user/notifications/switch
   *   no params          → flips the current setting
   *   ?enabled=true|false → sets it explicitly
   */
  const activateDeactivateNotification = async (req, res, next) => {
    console.log("UserController => activateDeactivateNotification");
    const { userId } = req.body;

    const user = await UserService().fetch(userId);

    if (!user) {
      req.rCode = 5;
      req.msg = "user_not_found";
      return next();
    }

    const requested = toBool(
      (req.query && req.query.enabled) !== undefined
        ? req.query.enabled
        : req.body.enabled,
    );
    const notificationAllowed =
      requested !== undefined ? requested : !user.notificationAllowed;

    await UserService().updateUsers(userId, { notificationAllowed });

    req.rData = { notificationAllowed };
    req.msg = "notification_settings_updated";
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

  /**
   * Followers / following lists.
   * Without :userId in the URL → the logged-in user's own lists.
   */
  const followers = async (req, res, next) => {
    console.log("UserController => followers");
    const { userId } = req.body;
    const targetId = req.params.userId || userId;
    const { page, limit, search } = req.query;

    req.rData = await FollowService().getFollowers(
      targetId,
      userId,
      page,
      limit,
      search,
    );
    req.msg = "success";
    next();
  };

  const following = async (req, res, next) => {
    console.log("UserController => following");
    const { userId } = req.body;
    const targetId = req.params.userId || userId;
    const { page, limit, search } = req.query;

    req.rData = await FollowService().getFollowing(
      targetId,
      userId,
      page,
      limit,
      search,
    );
    req.msg = "success";
    next();
  };

  return {
    followers,
    following,
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
