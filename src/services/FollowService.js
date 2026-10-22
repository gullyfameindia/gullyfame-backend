const Follow = require("../models/Follow");

module.exports = () => {
  const toggleFollow = async (followerId, followingId) => {
    if (followerId.toString() === followingId.toString()) {
      throw new Error("cannot_follow_self");
    }

    const existing = await Follow.findOne({
      follower: followerId,
      following: followingId,
    });

    if (existing) {
      await Follow.deleteOne({ _id: existing._id });
      return { following: false };
    }

    await Follow.create({ follower: followerId, following: followingId });
    return { following: true };
  };

  return { toggleFollow };
};
