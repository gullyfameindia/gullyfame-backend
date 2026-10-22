const Reel = require("../models/Reel");
const User = require("../models/User");
const mongoose = require("mongoose");

module.exports = () => {
  const getChampions = async (page, limit) => {
    const skip = (page - 1) * limit;

    const aggregation = await Reel.aggregate([
      {
        $match: {
          isActive: true,
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: "$author",
          totalVotes: { $sum: "$stats.votes" },
          totalReels: { $sum: 1 },
        },
      },
      { $sort: { totalVotes: -1, totalReels: -1, _id: 1 } },
      {
        $facet: {
          page: [{ $skip: skip }, { $limit: limit }],
          totals: [{ $count: "total" }],
        },
      },
    ]);

    const pageRows = aggregation[0]?.page || [];
    const total = aggregation[0]?.totals[0]?.total || 0;

    const authorIds = pageRows.map((r) => r._id).filter(Boolean);

    const users = await User.find({
      _id: { $in: authorIds },
      isActive: true,
      isDeleted: { $ne: true },
    })
      .select("_id firstName lastName username profileImage")
      .lean();

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const champions = pageRows
      .map((row, idx) => {
        const u = userMap[row._id?.toString()];
        if (!u) return null;
        return {
          id: u._id,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || (u.username || ""),
          username: u.username || "",
          profilePictureUrl: u.profileImage || "",
          totalVotes: row.totalVotes,
          totalReels: row.totalReels,
          rank: skip + idx + 1,
        };
      })
      .filter(Boolean);

    const hasMore = skip + pageRows.length < total;

    return {
      currentPage: page,
      hasMore,
      total,
      champions,
    };
  };

  return { getChampions };
};
