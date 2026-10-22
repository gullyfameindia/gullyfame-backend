const User = require("../models/User");
const Competition = require("../models/Competition");
const Reel = require("../models/Reel");
const ReelInteraction = require("../models/ReelInteraction");
const Follow = require("../models/Follow");
const mongoose = require("mongoose");

module.exports = () => {
  const search = async (q, type, page, limit, userId) => {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    if (type === "all") {
      return await searchAll(escapedQ, objectUserId);
    } else if (type === "users") {
      return await searchUsers(escapedQ, objectUserId, page, limit);
    } else if (type === "competitions") {
      return await searchCompetitions(escapedQ, page, limit);
    } else if (type === "reels") {
      return await searchReels(escapedQ, objectUserId, page, limit);
    }

    return {};
  };

  const searchAll = async (q, objectUserId) => {
    const regex = new RegExp(q, "i");

    const [users, competitions, reels] = await Promise.all([
      User.find({
        $or: [{ firstName: regex }, { lastName: regex }, { username: regex }],
        isActive: true,
        isDeleted: { $ne: true },
      })
        .limit(3)
        .lean(),
      Competition.find({
        title: regex,
        isActive: true,
        isDeleted: { $ne: true },
      })
        .limit(3)
        .lean(),
      Reel.find({
        caption: regex,
        isActive: true,
        isDeleted: { $ne: true },
      })
        .limit(3)
        .populate("author", "_id firstName lastName username profileImage")
        .lean(),
    ]);

    const followingSet = await getFollowingSet(objectUserId);

    const top_users = users.map((u) => ({
      _id: u._id,
      username: u.username || `@${u.firstName}`,
      first_name: u.firstName,
      last_name: u.lastName,
      profile_picture_url: u.profileImage || "",
      followers_count: 0,
      is_followed_by_me: followingSet.has(u._id.toString()),
    }));

    // Enrich with follower counts
    for (const user of top_users) {
      user.followers_count = await Follow.countDocuments({
        following: user._id,
      });
    }

    const top_competitions = competitions.map((c) => ({
      _id: c._id,
      title: c.title,
      status: c.status,
      prize: c.prizePool,
      participants: c.participants ? c.participants.length : 0,
      image_url: c.image || "",
    }));

    const top_reels = await Promise.all(
      reels.map(async (reel) => {
        const interactions = await getUserInteractions(objectUserId, reel._id);
        return {
          _id: reel._id,
          video_url: reel.video_url,
          thumbnail_url: reel.thumbnail_url,
          caption: reel.caption,
          createdAt: reel.createdAt,
          author: {
            _id: reel.author._id,
            username: reel.author.username || `@${reel.author.firstName}`,
            profile_picture_url: reel.author.profileImage || "",
            is_followed_by_me: followingSet.has(reel.author._id.toString()),
          },
          music: reel.music || { id: "", name: "" },
          stats: reel.stats,
          user_interactions: interactions,
        };
      }),
    );

    return { top_users, top_competitions, top_reels };
  };

  const searchUsers = async (q, objectUserId, page, limit) => {
    const regex = new RegExp(q, "i");
    const skip = (page - 1) * limit;

    const query = {
      $or: [{ firstName: regex }, { lastName: regex }, { username: regex }],
      isActive: true,
      isDeleted: { $ne: true },
    };

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);

    const followingSet = await getFollowingSet(objectUserId);

    const results = await Promise.all(
      users.map(async (u) => ({
        _id: u._id,
        username: u.username || `@${u.firstName}`,
        first_name: u.firstName,
        last_name: u.lastName,
        profile_picture_url: u.profileImage || "",
        followers_count: await Follow.countDocuments({ following: u._id }),
        is_followed_by_me: followingSet.has(u._id.toString()),
      })),
    );

    return {
      currentPage: page,
      hasMore: skip + limit < total,
      results,
    };
  };

  const searchCompetitions = async (q, page, limit) => {
    const regex = new RegExp(q, "i");
    const skip = (page - 1) * limit;

    const query = {
      title: regex,
      isActive: true,
      isDeleted: { $ne: true },
    };

    const [competitions, total] = await Promise.all([
      Competition.find(query).skip(skip).limit(limit).lean(),
      Competition.countDocuments(query),
    ]);

    const results = competitions.map((c) => ({
      _id: c._id,
      title: c.title,
      status: c.status,
      prize: c.prizePool,
      participants: c.participants ? c.participants.length : 0,
      image: c.image || "",
    }));

    return {
      currentPage: page,
      hasMore: skip + limit < total,
      results,
    };
  };

  const searchReels = async (q, objectUserId, page, limit) => {
    const regex = new RegExp(q, "i");
    const skip = (page - 1) * limit;

    const query = {
      caption: regex,
      isActive: true,
      isDeleted: { $ne: true },
    };

    const [reels, total] = await Promise.all([
      Reel.find(query)
        .skip(skip)
        .limit(limit)
        .populate("author", "_id firstName lastName username profileImage")
        .lean(),
      Reel.countDocuments(query),
    ]);

    const followingSet = await getFollowingSet(objectUserId);

    const results = await Promise.all(
      reels.map(async (reel) => {
        const interactions = await getUserInteractions(objectUserId, reel._id);
        return {
          _id: reel._id,
          video_url: reel.video_url,
          thumbnail_url: reel.thumbnail_url,
          caption: reel.caption,
          createdAt: reel.createdAt,
          author: {
            _id: reel.author._id,
            username: reel.author.username || `@${reel.author.firstName}`,
            profile_picture_url: reel.author.profileImage || "",
            is_followed_by_me: followingSet.has(reel.author._id.toString()),
          },
          music: reel.music || { id: "", name: "" },
          stats: reel.stats,
          user_interactions: interactions,
        };
      }),
    );

    return {
      currentPage: page,
      hasMore: skip + limit < total,
      results,
    };
  };

  const getFollowingSet = async (objectUserId) => {
    const follows = await Follow.find({ follower: objectUserId })
      .select("following")
      .lean();
    return new Set(follows.map((f) => f.following.toString()));
  };

  const getUserInteractions = async (objectUserId, reelId) => {
    const [hasVoted, isSaved, hasTipped] = await Promise.all([
      ReelInteraction.exists({
        user: objectUserId,
        reel: reelId,
        type: "vote",
      }),
      ReelInteraction.exists({
        user: objectUserId,
        reel: reelId,
        type: "save",
      }),
      ReelInteraction.exists({
        user: objectUserId,
        reel: reelId,
        type: "tip",
      }),
    ]);

    return {
      has_voted: !!hasVoted,
      is_saved: !!isSaved,
      has_tipped: !!hasTipped,
    };
  };

  return {
    search,
  };
};
