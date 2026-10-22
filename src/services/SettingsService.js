const Settings = require("../models/Settings");

module.exports = () => {
  const addSettings = (data) => {
    return new Promise(function (resolve, reject) {
      Settings.create(data).then(resolve).catch(reject);
    });
  };

  const fetch = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Settings.findById(id).select(" -__v");
      orm.then(resolve).catch(reject);
    });
  };

  const fetchByQuery = (query) => {
    console.log("SettingsService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = Settings.findOne(query).select("").sort({ _id: -1 });
      orm.then(resolve).catch(reject);
    });
  };

  const updateSettings = (SettingsId, data) => {
    console.log("SettingsService => resetPassword");
    return new Promise(async function (resolve, reject) {
      let settings = await Settings.findByIdAndUpdate({ _id: SettingsId }, data)
        .then(resolve)
        .catch(reject);
    });
  };

  const fetchByQueryToEdit = (query) => {
    console.log("SettingsService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = Settings.findOne(query).select("");

      orm.then(resolve).catch(reject);
    });
  };

  const getSettings = (query, page, limit) => {
    return new Promise(function (resolve, reject) {
      let orm = Settings.find(query)
        .select(" -__v")
        .sort({ _id: -1 })
        // .skip(page * limit)
        .limit(limit);
      orm.then(resolve).catch(reject);
    });
  };

  const countSettings = (query) => {
    return new Promise(function (resolve, reject) {
      let orm = Settings.countDocuments(query);
      orm.then(resolve).catch(reject);
    });
  };

  const deleteSettings = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Settings.deleteOne({ _id: id });
      orm.then(resolve).catch(reject);
    });
  };

  return {
    addSettings,
    fetch,
    fetchByQuery,
    fetchByQueryToEdit,
    updateSettings,
    getSettings,
    countSettings,
    deleteSettings,
  };
};
