const Sticker = require("../models/Sticker");

module.exports = () => {
  const list = async () => {
    return Sticker.find({ isActive: true }).sort({ createdAt: -1 }).lean();
  };

  const addSticker = async (data) => {
    return Sticker.create(data);
  };

  const updateSticker = async (id, data) => {
    return Sticker.findByIdAndUpdate(id, data, { new: true });
  };

  const deleteSticker = async (id) => {
    return Sticker.findByIdAndUpdate(id, { isActive: false });
  };

  return { list, addSticker, updateSticker, deleteSticker };
};
