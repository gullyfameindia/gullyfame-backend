const Logos = require("../models/Logos");

module.exports = () => {
  const addLogos = (data) => {
    return new Promise(function (resolve, reject) {
      Logos.create(data).then(resolve).catch(reject);
    });
  };

  const fetch = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Logos.findById(id).select("-password -time -__v");
      orm.then(resolve).catch(reject);
    });
  };

  const fetchByQuery = (query) => {
    console.log("LogosService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = Logos.findOne(query).select("-password").sort({ _id: -1 });
      orm.then(resolve).catch(reject);
    });
  };

  const updateLogos = (LogosId, data) => {
    console.log("LogosService => resetPassword");
    return new Promise(async function (resolve, reject) {
      await Logos.findByIdAndUpdate({ _id: LogosId }, data)
        .then(resolve)
        .catch(reject);
    });
  };

  const fetchByQueryToEdit = (query) => {
    console.log("LogosService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = Logos.findOne(query).select("-password");

      orm.then(resolve).catch(reject);
    });
  };

  const getLogos = (query, page, limit) => {
    return new Promise(function (resolve, reject) {
      let orm = Logos.find(query).select("-password -__v").sort({ _id: -1 }); // .skip(page * limit).limit(limit);
      orm.then(resolve).catch(reject);
    });
  };

  const countLogos = (query) => {
    return new Promise(function (resolve, reject) {
      let orm = Logos.countDocuments(query);
      orm.then(resolve).catch(reject);
    });
  };

  const deleteLogos = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Logos.deleteOne({ _id: id });
      orm.then(resolve).catch(reject);
    });
  };

  return {
    addLogos,
    fetch,
    fetchByQuery,
    fetchByQueryToEdit,
    updateLogos,
    getLogos,
    countLogos,
    deleteLogos,
  };
};
