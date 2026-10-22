const AppBranding = require("../models/AppBranding");

module.exports = () => {
  const get = () => AppBranding.findOne({});
  const create = (data) => AppBranding.create(data);

  const update = async (data) => {
    const existing = await AppBranding.findOne({});
    if (existing) {
      return AppBranding.findByIdAndUpdate(existing._id, data, { new: true });
    }
    return create(data);
  };

  return { get, create, update };
};
