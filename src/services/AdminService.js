const Admin = require("../models/Admin");
const helpers = require("../util/helpers.js");

module.exports = () => {
  const registerAdmin = (data) => {
    return new Promise(function (resolve, reject) {
      Admin.create(data).then(resolve).catch(reject);
    });
  };

  const fetch = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Admin.findById(id).select("-password -time -otp");
      orm.then(resolve).catch(reject);
    });
  };

  const fetchByQuery = (query) => {
    console.log("AdminService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = Admin.findOne(query).select("-password");

      orm.then(resolve).catch(reject);
    });
  };

  const verifyPassword = (id, password) => {
    console.log("AdminService => verifyPassword");
    return new Promise(async function (resolve, reject) {
      let admin = await Admin.findById(id);

      if (!admin) resolve(false);
      let v = await helpers().checkPassword(password, admin.password);

      return resolve(v);
    });
  };

  const deleteAdmin = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = Admin.deleteOne({ _id: id });
      orm.then(resolve).catch(reject);
    });
  };

  const resetPassword = (adminId, password) => {
    console.log("AdminService => resetPassword");
    return new Promise(async function (resolve, reject) {
      let admin = await Admin.findByIdAndUpdate({ _id: adminId }, { password })
        .then(resolve)
        .catch(reject);
    });
  };

  const updateProfile = (adminId, data) => {
    console.log("AdminService => resetPassword");
    return new Promise(async function (resolve, reject) {
      let admin = await Admin.findByIdAndUpdate({ _id: adminId }, data)
        .then(resolve)
        .catch(reject);
    });
  };

  const getUser = (query, page, limit) => {
    return new Promise(function (resolve, reject) {
      let orm = Admin.find(query)
        .select("-password -__v")
        .sort({ _id: -1 })
        // .skip(page * limit)
        .limit(limit);
      orm.then(resolve).catch(reject);
    });
  };

  const countUser = (query) => {
    return new Promise(function (resolve, reject) {
      let orm = Admin.countDocuments(query);
      orm.then(resolve).catch(reject);
    });
  };

  return {
    fetch,
    fetchByQuery,
    registerAdmin,
    verifyPassword,
    getUser,
    countUser,
    deleteAdmin,
    resetPassword,
    updateProfile,
  };
};
