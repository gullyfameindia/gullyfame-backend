const Filter = require("../models/Filter");

module.exports = () => {
  const list = async () => {
    return Filter.find({ isActive: true }).sort({ createdAt: -1 }).lean();
  };

  const addFilter = async (data) => {
    return Filter.create(data);
  };

  const updateFilter = async (id, data) => {
    return Filter.findByIdAndUpdate(id, data, { new: true });
  };

  const deleteFilter = async (id) => {
    return Filter.findByIdAndUpdate(id, { isActive: false });
  };

  return { list, addFilter, updateFilter, deleteFilter };
};
