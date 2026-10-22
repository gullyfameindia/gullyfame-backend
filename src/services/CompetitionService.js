const Competition = require("../models/Competition");
const Reel = require("../models/Reel");
const ReelInteraction = require("../models/ReelInteraction");
const Follow = require("../models/Follow");
const User = require("../models/User");
const NotificationTriggerService = require("./NotificationTriggerService");
const mongoose = require("mongoose");

module.exports = () => {
  const mapStatus = (status) => {
    if (!status) return "UPCOMING";
    const s = status.toUpperCase();
    if (s === "LIVE") return "LIVE";
    if (s === "COMPLETED" || s === "ENDED") return "ENDED";
    if (s === "CANCELLED") return "CANCELLED";
    return "UPCOMING"; // CREATED, APPROVED, UPCOMING
  };

  const getCompetitionById = async (competitionId) => {
    return Competition.findOne({
      _id: competitionId,
      isActive: true,
      isDeleted: { $ne: true },
    }).lean();
  };

  const getCompetitionDetails = async (competitionId, userId) => {
    const competition = await getCompetitionById(competitionId);
    if (!competition) return null;

    const objectUserId = new mongoose.Types.ObjectId(userId);
    const objectCompId = new mongoose.Types.ObjectId(competitionId);
    const normalizedStatus = mapStatus(competition.status);

    if (normalizedStatus === "CANCELLED") return null;

    if (normalizedStatus === "ENDED") {
      return await getEndedCompetitionDetails(competition, objectCompId);
    } else if (normalizedStatus === "UPCOMING") {
      return await getUpcomingCompetitionDetails(
        competition,
        objectCompId,
        objectUserId,
      );
    } else if (normalizedStatus === "LIVE") {
      return await getLiveCompetitionDetails(
        competition,
        objectCompId,
        objectUserId,
      );
    }

    return competition;
  };

  const getEndedCompetitionDetails = async (competition, objectCompId) => {
    // Get top 10 performers by votes
    const topReels = await Reel.find({ competition: objectCompId })
      .sort({ "stats.votes": -1 })
      .limit(10)
      .populate("author", "_id firstName lastName profileImage")
      .lean();

    const totalParticipants = await Reel.countDocuments({
      competition: objectCompId,
    });

    const results = topReels.map((reel, index) => ({
      id: reel.author._id,
      name: `${reel.author.firstName} ${reel.author.lastName}`.trim(),
      profilePictureUrl: reel.author.profileImage || "",
      rank: index + 1,
      votes: reel.stats.votes,
      prizeMoneyWon: index === 0 ? Math.floor(competition.prizePool * 0.5) : 0,
    }));

    // Recommended past competitions sorted by totalViews
    const recommendedPastCompetitions = await Competition.find({
      status: { $in: ["ENDED", "COMPLETED"] },
      _id: { $ne: objectCompId },
      isActive: true,
      isDeleted: { $ne: true },
    })
      .sort({ totalViews: -1 })
      .limit(5)
      .lean();

    const recommendedFormatted = await Promise.all(
      recommendedPastCompetitions.map(async (comp) => {
        const winnerReel = await Reel.findOne({ competition: comp._id })
          .sort({ "stats.votes": -1 })
          .populate("author", "firstName lastName")
          .lean();

        return {
          _id: comp._id,
          title: comp.title,
          winnerName: winnerReel
            ? `${winnerReel.author.firstName} ${winnerReel.author.lastName}`.trim()
            : "",
          prizePool: comp.prizePool,
          startDate: comp.startDate,
          endDate: comp.endDate,
        };
      }),
    );

    return {
      _id: competition._id,
      status: "ENDED",
      title: competition.title,
      subtitle: competition.subtitle,
      description: competition.description,
      totalParticipants,
      prizePool: competition.prizePool,
      startDate: competition.startDate,
      endDate: competition.endDate,
      totalViews: competition.totalViews,
      results,
      recommendedPastCompetitions: recommendedFormatted,
    };
  };

  const getUpcomingCompetitionDetails = async (
    competition,
    objectCompId,
    objectUserId,
  ) => {
    const is_current_user_joined = competition.participants.some(
      (p) => p.toString() === objectUserId.toString(),
    );

    const totalParticipantsJoined = competition.participants.length;

    // Build participants preview (up to 20)
    let participantIds = competition.participants.slice(0, 20);

    // If user joined, ensure they're at the top
    if (is_current_user_joined) {
      participantIds = participantIds.filter(
        (p) => p.toString() !== objectUserId.toString(),
      );
      participantIds.unshift(objectUserId);
      participantIds = participantIds.slice(0, 20);
    }

    const participantUsers = await User.find({ _id: { $in: participantIds } })
      .select("_id firstName lastName profileImage")
      .lean();

    // Maintain order
    const userMap = {};
    participantUsers.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const participantsPreview = participantIds
      .map((pid) => {
        const u = userMap[pid.toString()];
        if (!u) return null;
        return {
          id: u._id,
          name: `${u.firstName} ${u.lastName}`.trim(),
          profilePictureUrl: u.profileImage || "",
          isCurrentUser: u._id.toString() === objectUserId.toString(),
        };
      })
      .filter(Boolean);

    return {
      _id: competition._id,
      status: "UPCOMING",
      title: competition.title,
      subtitle: competition.subtitle,
      description: competition.description,
      startDate: competition.startDate,
      endDate: competition.endDate,
      prizePool: competition.prizePool,
      entryFee: competition.entryFee,
      totalParticipantsJoined,
      is_current_user_joined,
      participantsPreview,
    };
  };

  const getLiveCompetitionDetails = async (
    competition,
    objectCompId,
    objectUserId,
  ) => {
    const totalEntries = await Reel.countDocuments({
      competition: objectCompId,
    });

    const is_current_user_entered = await Reel.exists({
      competition: objectCompId,
      author: objectUserId,
    });

    // Leaderboard preview - top 10 by votes
    const topReels = await Reel.find({ competition: objectCompId })
      .sort({ "stats.votes": -1 })
      .limit(10)
      .populate("author", "_id firstName lastName profileImage")
      .lean();

    const leaderboardPreview = topReels.map((reel, index) => ({
      id: reel.author._id,
      name: `${reel.author.firstName} ${reel.author.lastName}`.trim(),
      profilePictureUrl: reel.author.profileImage || "",
      rank: index + 1,
      votes: reel.stats.votes,
      isCurrentUser: reel.author._id.toString() === objectUserId.toString(),
    }));

    return {
      _id: competition._id,
      status: "LIVE",
      title: competition.title,
      subtitle: competition.subtitle,
      description: competition.description,
      startDate: competition.startDate,
      endDate: competition.endDate,
      prizePool: competition.prizePool,
      totalEntries,
      is_current_user_entered: !!is_current_user_entered,
      leaderboardPreview,
    };
  };

  const getLeaderboard = async (competitionId, userId, page, limit) => {
    const objectCompId = new mongoose.Types.ObjectId(competitionId);
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    const totalEntries = await Reel.countDocuments({
      competition: objectCompId,
    });

    const reels = await Reel.find({ competition: objectCompId })
      .sort({ "stats.votes": -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "_id firstName lastName profileImage")
      .lean();

    const leaderboard = reels.map((reel, index) => ({
      id: reel.author._id,
      name: `${reel.author.firstName} ${reel.author.lastName}`.trim(),
      profilePictureUrl: reel.author.profileImage || "",
      rank: skip + index + 1,
      points: reel.stats.votes,
      isCurrentUser: reel.author._id.toString() === objectUserId.toString(),
    }));

    const hasMore = skip + limit < totalEntries;

    return {
      competitionId,
      currentPage: page,
      hasMore,
      leaderboard,
    };
  };

  const getMyCompetitions = async (userId, page, limit) => {
    const objectUserId = new mongoose.Types.ObjectId(userId);
    const skip = (page - 1) * limit;

    // Competitions the user has submitted a reel to
    const submittedIds = await Reel.distinct("competition", {
      author: objectUserId,
      competition: { $ne: null },
      isActive: true,
      isDeleted: { $ne: true },
    });

    const query = {
      isActive: true,
      isDeleted: { $ne: true },
      $or: [
        { participants: objectUserId },
        { _id: { $in: submittedIds } },
      ],
    };

    const total = await Competition.countDocuments(query);

    const competitions = await Competition.find(query)
      .sort({ startDate: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const submittedSet = new Set(submittedIds.map((id) => id.toString()));

    const data = competitions.map((c) => {
      const joined = (c.participants || []).some(
        (p) => p.toString() === objectUserId.toString(),
      );
      const submitted = submittedSet.has(c._id.toString());
      let participation = "joined";
      if (joined && submitted) participation = "submitted";
      else if (submitted) participation = "submitted";
      else if (joined) participation = "joined";

      return {
        _id: c._id,
        title: c.title,
        subtitle: c.subtitle,
        image: c.image,
        status: mapStatus(c.status),
        prizePool: c.prizePool,
        entryFee: c.entryFee,
        startDate: c.startDate,
        endDate: c.endDate,
        participation,
      };
    });

    const hasMore = skip + competitions.length < total;

    return {
      currentPage: page,
      hasMore,
      total,
      competitions: data,
    };
  };

  const joinCompetition = async (competitionId, userId) => {
    const competition = await getCompetitionById(competitionId);
    if (!competition) {
      throw new Error("competition_not_found");
    }

    const normalizedStatus = mapStatus(competition.status);
    if (normalizedStatus !== "UPCOMING" && normalizedStatus !== "LIVE") {
      throw new Error("competition_not_joinable");
    }

    const alreadyJoined = competition.participants.some(
      (p) => p.toString() === userId.toString(),
    );
    if (alreadyJoined) {
      throw new Error("already_joined");
    }

    const updated = await Competition.findByIdAndUpdate(
      competitionId,
      { $addToSet: { participants: userId } },
      { new: true },
    ).lean();

    return {
      competitionId,
      participantsCount: updated.participants.length,
    };
  };

  // "New Rap Battle Invite" — a user calling out another user to a
  // competition. Kept lightweight (just fires a notification) rather than
  // a full accept/decline model, matching what the mockup shows.
  const inviteToCompetition = async (competitionId, fromUserId, toUserId) => {
    if (fromUserId.toString() === toUserId.toString()) {
      throw new Error("cannot_invite_self");
    }

    const competition = await getCompetitionById(competitionId);
    if (!competition) {
      throw new Error("competition_not_found");
    }

    const toUser = await User.findOne({
      _id: toUserId,
      isActive: true,
      isDeleted: { $ne: true },
    }).lean();
    if (!toUser) {
      throw new Error("user_not_found");
    }

    await NotificationTriggerService().rapBattleInvite(toUserId, {
      competitionId,
      fromUserId,
    });

    return { competitionId, toUserId, invited: true };
  };

  return {
    getCompetitionById,
    getCompetitionDetails,
    getLeaderboard,
    getMyCompetitions,
    joinCompetition,
    inviteToCompetition,
  };
};
