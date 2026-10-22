const FAQ = require("../models/FAQs");

module.exports = () => {
  const addFAQ = (data) => {
    return new Promise(function (resolve, reject) {
      FAQ.create(data).then(resolve).catch(reject);
    });
  };

  const fetch = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = FAQ.findById(id).select(" -__v -isDeleted");
      orm.then(resolve).catch(reject);
    });
  };

  const fetchByQuery = (query) => {
    console.log("FAQService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = FAQ.findOne(query).select("").sort({ _id: -1 });
      orm.then(resolve).catch(reject);
    });
  };

  const updateFAQ = (FAQId, data) => {
    console.log("FAQService => updateFAQ");
    return new Promise(async function (resolve, reject) {
      await FAQ.findByIdAndUpdate({ _id: FAQId }, data)
        .then(resolve)
        .catch(reject);
    });
  };

  const fetchByQueryToEdit = (query) => {
    console.log("FAQService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = FAQ.findOne(query).select("");
      orm.then(resolve).catch(reject);
    });
  };

  const getFAQ = (query, page, limit) => {
    if (page) {
      page -= 1;
    }

    return new Promise(function (resolve, reject) {
      let orm = FAQ.find(query)
        .select(" -__v -isDeleted -isActive")
        .sort({ _id: -1 })
        .skip(page * limit)
        .limit(limit);
      orm.then(resolve).catch(reject);
    });
  };

  const countFAQ = (query) => {
    return new Promise(function (resolve, reject) {
      let orm = FAQ.countDocuments(query);
      orm.then(resolve).catch(reject);
    });
  };

  const deleteFAQ = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = FAQ.deleteOne({ _id: id });
      orm.then(resolve).catch(reject);
    });
  };

  return {
    addFAQ,
    fetch,
    fetchByQuery,
    fetchByQueryToEdit,
    updateFAQ,
    getFAQ,
    countFAQ,
    deleteFAQ,
  };
};
