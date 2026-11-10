const Audio = require("../models/Audio");
const Reel = require("../models/Reel");
const RegexEscape = require("regex-escape");
const mongoose = require("mongoose");

module.exports = () => {
  const list = async ({ search, sort, page = 1, limit = 20 }) => {
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { title: { $regex: RegexEscape(search), $options: "i" } },
        { artist: { $regex: RegexEscape(search), $options: "i" } },
      ];
    }

    const sortSpec =
      sort === "trending" ? { usageCount: -1 } : { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [audios, total] = await Promise.all([
      Audio.find(query).sort(sortSpec).skip(skip).limit(limit).lean(),
      Audio.countDocuments(query),
    ]);

    return {
      page,
      limit,
      total,
      hasMore: skip + audios.length < total,
      audios,
    };
  };

  /** One sound, with how many reels use it. Null if it is missing or hidden. */
  const fetch = async (audioId) => {
    if (!mongoose.Types.ObjectId.isValid(String(audioId))) return null;

    const audio = await Audio.findOne({ _id: audioId, isActive: true })
      .populate("createdByUser", "_id username firstName lastName profileImage")
      .lean();

    if (!audio) return null;

    audio.reelCount = await Reel.countDocuments({
      "music.id": String(audio._id),
      isDeleted: { $ne: true },
      status: "published",
    });

    return audio;
  };

  /** The reels made with a sound - the "sound page", newest first. */
  const getReelsUsing = async (audioId, { page = 1, limit = 20 } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(String(audioId))) {
      return { page, limit, total: 0, hasMore: false, reels: [] };
    }

    const query = {
      "music.id": String(audioId),
      isDeleted: { $ne: true },
      status: "published",
    };
    const skip = (page - 1) * limit;

    const [reels, total] = await Promise.all([
      Reel.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id thumbnail_url video_url caption stats author createdAt")
        .populate("author", "_id username firstName lastName profileImage")
        .lean(),
      Reel.countDocuments(query),
    ]);

    return { page, limit, total, hasMore: skip + reels.length < total, reels };
  };

  /** Original sounds a user has created, for their profile. */
  const getOriginalSoundsByUser = async (userId) => {
    return Audio.find({ createdByUser: userId, isOriginalSound: true, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
  };

  const toggleSave = async (audioId, userId) => {
    const audio = await Audio.findById(audioId);
    if (!audio) return null;

    const alreadySaved = audio.savedBy.some(
      (u) => u.toString() === userId.toString(),
    );

    if (alreadySaved) {
      await Audio.updateOne(
        { _id: audioId },
        { $pull: { savedBy: userId } },
      );
      return { saved: false };
    }

    await Audio.updateOne(
      { _id: audioId },
      { $addToSet: { savedBy: userId } },
    );
    return { saved: true };
  };

  const getSaved = async (userId) => {
    return Audio.find({ savedBy: userId, isActive: true })
      .sort({ createdAt: -1 })
      .lean();
  };

  const incrementUsage = async (audioId) => {
    if (!audioId) return;
    await Audio.updateOne({ _id: audioId }, { $inc: { usageCount: 1 } }).catch(
      () => {},
    );
  };

  const addAudio = async (data) => {
    return Audio.create(data);
  };

  const updateAudio = async (audioId, data) => {
    return Audio.findByIdAndUpdate(audioId, data, { new: true });
  };

  const deleteAudio = async (audioId) => {
    return Audio.findByIdAndUpdate(audioId, { isActive: false });
  };

  return {
    list,
    fetch,
    getReelsUsing,
    getOriginalSoundsByUser,
    toggleSave,
    getSaved,
    incrementUsage,
    addAudio,
    updateAudio,
    deleteAudio,
  };
};
