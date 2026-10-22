const Category = require("../models/Catagory");

module.exports = () => {
  const addCategory = (data) => {
    return new Promise(function (resolve, reject) {
      Category.create(data).then(resolve).catch(reject);
    });
  };

  const fetch = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Category.findById(id).select("-password -time -__v");
      orm.then(resolve).catch(reject);
    });
  };

  const fetchByQuery = (query) => {
    console.log("CategoryService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = Category.findOne(query).select("-password").sort({ _id: -1 });
      orm.then(resolve).catch(reject);
    });
  };

  const updateCategory = (CategoryId, data) => {
    console.log("CategoryService => resetPassword");
    return new Promise(async function (resolve, reject) {
      await Category.findByIdAndUpdate({ _id: CategoryId }, data)
        .then(resolve)
        .catch(reject);
    });
  };

  const fetchByQueryToEdit = (query) => {
    console.log("CategoryService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = Category.findOne(query).select("-password");

      orm.then(resolve).catch(reject);
    });
  };

  const getCategory = (query, page, limit) => {
    return new Promise(function (resolve, reject) {
      const skip = page && limit ? (page - 1) * limit : 0;
      let orm = Category.find(query)
        .select("-password -__v")
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);
      orm.then(resolve).catch(reject);
    });
  };

  const countCategory = (query) => {
    return new Promise(function (resolve, reject) {
      let orm = Category.countDocuments(query);
      orm.then(resolve).catch(reject);
    });
  };

  const deleteCategory = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Category.deleteOne({ _id: id });
      orm.then(resolve).catch(reject);
    });
  };

  return {
    addCategory,
    fetch,
    fetchByQuery,
    fetchByQueryToEdit,
    updateCategory,
    getCategory,
    countCategory,
    deleteCategory,
  };
};
