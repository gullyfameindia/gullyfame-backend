const SoundFx = require("../models/SoundFx");

module.exports = () => {
  const list = async () => {
    return SoundFx.find({ isActive: true }).sort({ createdAt: -1 }).lean();
  };

  const addSoundFx = async (data) => {
    return SoundFx.create(data);
  };

  const updateSoundFx = async (id, data) => {
    return SoundFx.findByIdAndUpdate(id, data, { new: true });
  };

  const deleteSoundFx = async (id) => {
    return SoundFx.findByIdAndUpdate(id, { isActive: false });
  };

  return { list, addSoundFx, updateSoundFx, deleteSoundFx };
};
