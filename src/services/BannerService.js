const Banners = require("../models/Banners");
const helpers = require("../util/helpers.js");

module.exports = () => {
  const addBanners = (data) => {
    return new Promise(function (resolve, reject) {
      Banners.create(data).then(resolve).catch(reject);
    });
  };

  const fetch = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Banners.findById(id).select("-password -time -__v");
      orm.then(resolve).catch(reject);
    });
  };

  const fetchByQuery = (query) => {
    console.log("BannersService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = Banners.findOne(query).select("-password").sort({ _id: -1 });
      orm.then(resolve).catch(reject);
    });
  };

  const updateBanners = (BannersId, data) => {
    console.log("BannersService => resetPassword");
    return new Promise(async function (resolve, reject) {
      await Banners.findByIdAndUpdate({ _id: BannersId }, data)
        .then(resolve)
        .catch(reject);
    });
  };

  const fetchByQueryToEdit = (query) => {
    console.log("BannersService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = Banners.findOne(query).select("-password");

      orm.then(resolve).catch(reject);
    });
  };

  const getBanners = (query, page, limit) => {
    return new Promise(function (resolve, reject) {
      let orm = Banners.find(query)
        .select("-password -__v")
        .sort({ rank: 1 })
        // .skip(page * limit)
        .limit(limit);
      orm.then(resolve).catch(reject);
    });
  };

  const getBannersHomeScreen = (query, page, limit) => {
    return new Promise(function (resolve, reject) {
      let orm = Banners.find(query)
        .select(
          "-_id -__v -startDate -expireDate -isActive -createdAt -updatedAt"
        )
        .sort({ rank: 1 })
        // .skip(page * limit)
        .limit(limit);
      orm.then(resolve).catch(reject);
    });
  };

  const countBanners = (query) => {
    return new Promise(function (resolve, reject) {
      let orm = Banners.countDocuments(query);
      orm.then(resolve).catch(reject);
    });
  };

  const deleteBanners = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Banners.deleteOne({ _id: id });
      orm.then(resolve).catch(reject);
    });
  };

  return {
    addBanners,
    fetch,
    fetchByQuery,
    fetchByQueryToEdit,
    updateBanners,
    getBanners,
    countBanners,
    deleteBanners,
    getBannersHomeScreen,
  };
};
