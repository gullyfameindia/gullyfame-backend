const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const JWTSECRET = process.env.JWTSECRET;
const messages = require("./messages");

module.exports = function () {
  const resp = (response, lang, m = "success", data = {}, code = 1) => {
    return response.send({
      message: messages(lang)[m],
      data,
      code,
    });
  };

  const getErrorMessage = (errors) => {
    console.log("Helpers => getErrorMessage");

    try {
      console.log(errors);
      for (var key in errors) {
        let rule = errors[key]["rule"];

        let exists = messages()[rule];
        if (exists) return messages()[rule](key)["en"];

        return errors[key]["message"];
      }
    } catch (ex) {
      return "Something is wrong, Please try again later !!" + ex.message;
    }
  };

  const createJWT = (payload) => {
    return jwt.sign(payload, JWTSECRET, {
      // expiresIn: "30d", // expires in 30 days
    });
  };

  const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);
    return hash;
  };

  // Real random code — the master OTP is accepted separately at verify time
  // (see OtpService) while MASTER_OTP_ENABLED is true.
  const generateOTP = (length = 6) => {
    const min = 10 ** (length - 1);
    return String(crypto.randomInt(min, min * 10));
  };

  const checkPassword = async (password, hash) => {
    console.log("Helpers => checkPassword");

    let result = await bcrypt.compare(password, hash);
    return result;
  };

  return {
    resp,
    getErrorMessage,
    createJWT,
    hashPassword,
    checkPassword,
    generateOTP,
  };
};
