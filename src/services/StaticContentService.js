const StaticContent = require("../models/StaticContent");

module.exports = () => {
  const getByType = (type) => StaticContent.findOne({ type });

  const upsert = async (type, content) => {
    return StaticContent.findOneAndUpdate(
      { type },
      { content },
      { upsert: true, new: true }
    );
  };

  return { getByType, upsert };
};
