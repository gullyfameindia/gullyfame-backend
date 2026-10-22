const User = require("../models/User.js");
const helpers = require("../util/helpers.js");
const redis = require("../util/redis");

module.exports = () => {
  const addUsers = (data) => {
    return new Promise(function (resolve, reject) {
      User.create(data).then(resolve).catch(reject);
    });
  };

  const fetch = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = User.findById(id).select("-password -time -otp");
      orm.then(resolve).catch(reject);
    });
  };

  const fetchByQuery = (query) => {
    console.log("UserService => fetchByQuery");
    return new Promise(function (resolve, reject) {
      let orm = User.findOne(query).select("-password");

      orm.then(resolve).catch(reject);
    });
  };

  const verifyPassword = (id, password) => {
    console.log("UserService => verifyPassword");
    return new Promise(async function (resolve, reject) {
      let UserVerify = await User.findById(id);

      if (!UserVerify) resolve(false);
      let v = await helpers().checkPassword(password, UserVerify.password);

      return resolve(v);
    });
  };

  const deleteUser = (id) => {
    return new Promise(function (resolve, reject) {
      let orm = User.deleteOne({ _id: id });
      orm.then(resolve).catch(reject);
    });
  };

  const resetPassword = (UserId, password) => {
    console.log("UserService => resetPassword");
    return new Promise(async function (resolve, reject) {
      let UserVerify = await User.findByIdAndUpdate(
        { _id: UserId },
        { password }
      )
        .then(resolve)
        .catch(reject);
    });
  };

  const updateUsers = (UserId, data) => {
    console.log("UserService => resetPassword");
    return new Promise(async function (resolve, reject) {
      await User.findByIdAndUpdate({ _id: UserId }, data)
        .then(resolve)
        .catch(reject);
    });
  };

  const getUser = (query, page, limit) => {
    return new Promise(function (resolve, reject) {
      let orm = User.find(query)
        .select("-password -__v")
        .sort({ _id: -1 })
        // .skip(page * limit)
        .limit(limit);
      orm.then(resolve).catch(reject);
    });
  };

  const countUser = (query) => {
    return new Promise(function (resolve, reject) {
      let orm = User.countDocuments(query);
      orm.then(resolve).catch(reject);
    });
  };

  const setUserInRedisByTxnId = (otpData) => {
    console.log("UsersService => setUserInRedisByTxnId");

    if (otpData) {
      let txnId = otpData.txnId;
      redis()
        .SetRedis(`USER|txnId:${txnId}`, otpData, 60)
        .then(() => console.log("SetRedis success"))
        .catch((err) => console.log("Err=>>", err));
    }
  };

  const setUserInRedisForReg = async (phoneNo, otpData, result) => {
    console.log("UsersService => setUserInRedisForReg");

    if (otpData) {
      try {
        let redisKey = `USER_Mob_${phoneNo}`;
        let data = await setOTPInRedis(redisKey, otpData);
        return result(null, data);
      } catch (e) {
        return result(e, null);
      }
    }
  };

  const setOTPInRedis = async (redisKey, otpData) => {
    console.log("UsersService => setOTPInRedis");

    let res = await checkIfOtpExistInRedis(redisKey);
    if (res) {
      return res;
    } else {
      await redis()
        .SetRedis(redisKey, otpData, 60)
        .then(() => console.log("SetRedis success"))
        .catch((err) => console.log("err=>>", err));
      return null;
    }
  };

  const checkIfOtpExistInRedis = async (key) => {
    console.log("UsersService => checkIfOtpExistInRedis");

    let res = await redis().GetKeyRedis(key);
    return res;
  };

  return {
    fetch,
    fetchByQuery,
    addUsers,
    verifyPassword,
    getUser,
    countUser,
    deleteUser,
    resetPassword,
    updateUsers,
    setUserInRedisByTxnId,
    setUserInRedisForReg,
  };
};
