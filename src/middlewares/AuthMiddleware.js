const jwt = require("jsonwebtoken");
const ResponseMiddleware = require("./ResponseMiddleware");
const JWTSECRET = process.env.JWTSECRET;
const UserService = require("../services/UserService");
const GamificationService = require("../services/GamificationService");

module.exports = () => {
  const verifyUserToken = async (req, res, next) => {
    console.log("AuthMiddleware => verifyUserToken");
    let usertoken = req.headers.authorization;

    try {
      if (usertoken) {
        let tokens = usertoken.split(" ");

        let token = tokens[1];
        // console.log("Token", token)
        let payload = jwt.verify(token, JWTSECRET);

        let user = await UserService().fetchByQuery({
          _id: payload.userId,
          // token,
        });

        if (user && !user.isActive) {
          throw new Error("ac_deactivated");
        }

        //checking user must exist in our DB else throwing error
        if (user) {
          console.log(`User with ID ${user._id} entered.`);
          // req.body.userId = user._id;
          req.body = { ...(req.body || {}), userId: user._id };

          // Best-effort daily streak touch — no-ops if already counted today,
          // so this stays a single cheap check on every other request.
          GamificationService()
            .touchStreak(user._id, user)
            .catch((e) => console.log("touchStreak error", e.message));

          next();
        } else {
          throw new Error("invalid_token");
        }
      } else {
        throw new Error("invalid_token");
      }
    } catch (ex) {
      // console.log("heres",ex)
      req.rCode = 3;
      req.msg = "invalid_token";
      if (ex.message == "ac_deactivated") req.msg = ex.message;

      ResponseMiddleware(req, res, next);
    }
  };

  const verifyAdminToken = async (req, res, next) => {
    console.log("AuthMiddleware => verifyAdminToken");
    let admintoken = req.headers.authorization;

    try {
      if (admintoken) {
        let tokens = admintoken.split(" ");
        let token = tokens[1];

        let payload = jwt.verify(token, JWTSECRET);

        console.log("Admin Payload:", payload);

        if (payload.adminId) {
          console.log(`Admin with ID ${payload.adminId} entered.`);
          req.body = {
            ...(req.body || {}),
            adminId: payload.adminId,
          };
          next();
        } else {
          throw new Error("invalid_token");
        }
      } else {
        throw new Error("invalid_token");
      }
    } catch (ex) {
      console.log("exception in verifyAdminToken", ex);
      req.rCode = 3;
      req.msg = "invalid_token";
      if (ex.message == "token_expired") req.msg = "token_expired";

      ResponseMiddleware(req, res, next);
    }
  };

  const socialLoginValidator = async (req, res, next) => {
    console.log("AuthMiddleware => socialLoginValidator");
    try {
      let { facebookId, googleId, appleId, email, name } = req.body;
      let flag = false;
      if (facebookId) flag = true;
      if (googleId) flag = true;
      if (appleId) flag = true;

      if (!flag) {
        req.rCode = 0;
        req.msg = "social_id_missing";
        ResponseMiddleware(req, res, next);
      } else {
        next();
      }
    } catch (ex) {
      console.log(ex);
    }
  };

  return {
    verifyUserToken,
    verifyAdminToken,
    socialLoginValidator,
  };
};
