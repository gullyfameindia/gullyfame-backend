const Audio = require("../models/Audio");
const RegexEscape = require("regex-escape");

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
    toggleSave,
    getSaved,
    incrementUsage,
    addAudio,
    updateAudio,
    deleteAudio,
  };
};
