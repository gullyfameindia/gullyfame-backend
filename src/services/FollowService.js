const mongoose = require("mongoose");
const Follow = require("../models/Follow");
const User = require("../models/User");

const USER_FIELDS = "firstName lastName username profileImage role";

module.exports = () => {
  const isValidId = (id) => mongoose.Types.ObjectId.isValid(String(id));

  const toggleFollow = async (followerId, followingId) => {
    if (!isValidId(followingId)) {
      throw new Error("Invalid user id");
    }
    if (followerId.toString() === followingId.toString()) {
      throw new Error("You cannot follow yourself");
    }

    const target = await User.findOne({
      _id: followingId,
      isDeleted: { $ne: true },
    }).select("_id");
    if (!target) {
      throw new Error("User not found");
    }

    const existing = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    if (existing) {
      await Follow.deleteOne({ _id: existing._id });
    } else {
      try {
        await Follow.create({ follower: followerId, following: followingId });
      } catch (e) {
        // Double-tap race: the unique index already has this pair → treat as followed.
        if (e.code !== 11000) throw e;
      }
    }

    const followersCount = await Follow.countDocuments({
      following: followingId,
    });
    return { following: !existing, followersCount };
  };

  /**
   * Shared list builder.
   * type = "followers" → people who follow `userId`
   * type = "following" → people `userId` follows
   */
  const list = async (type, userId, viewerId, page = 1, limit = 20, search) => {
    if (!isValidId(userId)) {
      throw new Error("Invalid user id");
    }

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);

    const matchField = type === "followers" ? "following" : "follower";
    const otherField = type === "followers" ? "follower" : "following";

    const userMatch = { isDeleted: { $ne: true } };
    if (search) {
      const rx = new RegExp(
        String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );
      userMatch.$or = [{ firstName: rx }, { lastName: rx }, { username: rx }];
    }

    const rows = await Follow.find({ [matchField]: userId })
      .sort({ createdAt: -1 })
      .populate({ path: otherField, select: USER_FIELDS, match: userMatch })
      .lean();

    // populate() leaves null for deleted users / search misses — drop those
    const all = rows.filter((r) => r[otherField]);
    const total = all.length;
    const pageRows = all.slice((page - 1) * limit, page * limit);

    // Which of these people does the viewer already follow?
    const ids = pageRows.map((r) => r[otherField]._id);
    const viewerFollows = await Follow.find({
      follower: viewerId,
      following: { $in: ids },
    })
      .select("following")
      .lean();
    const followedSet = new Set(viewerFollows.map((f) => f.following.toString()));

    const users = pageRows.map((r) => {
      const u = r[otherField];
      return {
        ...u,
        followedAt: r.createdAt,
        isFollowedByMe: followedSet.has(u._id.toString()),
        isMe: u._id.toString() === viewerId.toString(),
      };
    });

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      users,
    };
  };

  const getFollowers = (userId, viewerId, page, limit, search) =>
    list("followers", userId, viewerId, page, limit, search);

  const getFollowing = (userId, viewerId, page, limit, search) =>
    list("following", userId, viewerId, page, limit, search);

  const getCounts = async (userId) => {
    const [followersCount, followingCount] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
    ]);
    return { followersCount, followingCount };
  };

  return { toggleFollow, getFollowers, getFollowing, getCounts };
};
