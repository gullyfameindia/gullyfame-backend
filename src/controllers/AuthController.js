const UserService = require("../services/UserService");
const helpers = require("../util/helpers.js");
const OtpService = require("../services/OtpService");
const PasswordResetService = require("../services/PasswordResetService");

// Expected OTP failures → 400 with a friendly message instead of a raw error.
const OTP_ERRORS = [
  "incorrect_otp",
  "otp_expired",
  "otp_too_many_attempts",
  "otp_resend_too_soon",
  "otp_send_failed",
  "otp_service_unavailable",
  "otp_email_not_supported",
];

// Expected forgot-password failures → 400 with a friendly message.
const RESET_ERRORS = [
  "user_not_found",
  "ac_deactivated",
  "no_email_on_account",
  "otp_resend_too_soon",
  "reset_email_failed",
  "mail_not_configured",
  "otp_expired",
  "otp_too_many_attempts",
  "incorrect_otp",
  "password_too_short",
  "reset_token_invalid",
];

module.exports = () => {
  // Returns { txnId, smsSent, expiresIn }, or null after setting an error
  // response on req.
  const sendOtpOrFail = async (req, data) => {
    try {
      return await OtpService().issueOtp(data);
    } catch (e) {
      if (!OTP_ERRORS.includes(e.message)) throw e;
      req.rCode = 0;
      req.msg = e.message;
      return null;
    }
  };

  const register = async (req, res, next) => {
    console.log("AuthController => register");

    let { email, mobile, password, firstName, lastName, role } = req.body;

    // console.log(req.body);

    if (email) email = email.toLowerCase();

    let email_query = { email: email };

    let email_normalUser = await UserService().fetchByQuery(email_query);

    if (email_normalUser) {
      req.rCode = 0;
      req.msg = "user_already_found";
      req.rData = {};
    } else {
      if (password) {
        password = await helpers().hashPassword(password);
      }
      let otp = helpers().generateOTP();
      await UserService().addUsers({
        email,
        mobile,
        password,
        firstName,
        lastName,
        role,
      });

      email_normalUser = await UserService().fetchByQuery(email_query);

      req.rData = {};

      req.msg = "success";
    }

    next();
  };

  const login = async (req, res, next) => {
    console.log("AuthController => login");

    let { userId, password, viaPassword, countryCode } = req.body;

    /** -------------------------------
   *  NORMALIZE INPUTS
   --------------------------------*/
    let email = null;
    let mobile = null;

    // Determine if userId is email or mobile
    if (userId.includes("@")) {
      email = userId.toLowerCase();
    } else {
      mobile = userId;
    }

    /** ========================================
     *  CASE 1: LOGIN WITH PASSWORD
     *  viaPassword = true
     * ========================================= */
    if (viaPassword) {
      let query = {};

      if (email) query.email = email;
      if (mobile) query.mobile = mobile;

      const user = await UserService().fetchByQuery(query);

      if (!user) {
        req.rCode = 0;
        req.msg = "user_not_found";
        req.rData = {};
        return next();
      }

      // 🔐 Verify password
      const passwordValid = await UserService().verifyPassword(
        user._id,
        password
      );

      if (!passwordValid) {
        req.rCode = 0;
        req.msg = "incorrect_password";
        req.rData = {};
        return next();
      }

      // 🔓 Check Active
      if (!user.isActive) {
        req.rCode = 0;
        req.msg = "ac_deactivated";
        return next();
      }

      // 🎉 Create JWT Token
      const token = await helpers().createJWT({ userId: user._id });

      req.rCode = 1;
      req.msg = "login_success";
      req.rData = { user, token };
      return next();
    }

    /** ========================================
     *  CASE 2: LOGIN WITH OTP
     *  viaPassword = false
     * ========================================= */

    let query = {};

    if (email) query.email = email;
    if (mobile) query.mobile = mobile;

    const user = await UserService().fetchByQuery(query);

    const sent = await sendOtpOrFail(req, {
      mobile,
      email,
      countryCode,
      reason: "OTP LOGIN",
    });
    if (!sent) return next();

    req.msg = "otp_sent";
    req.rData = { userRegister: Boolean(user), ...sent };

    return next();
  };

  const verifyOtp = async (req, res, next) => {
    console.log("AuthController => verifyOtpForLogin");
    const { otp, txnId } = req.body;

    let otpData;
    try {
      otpData = await OtpService().verifyOtp(txnId, otp);
    } catch (e) {
      if (!OTP_ERRORS.includes(e.message)) throw e;
      req.rCode = 0;
      req.msg = e.message;
      return next();
    }

    const { mobile, email } = otpData;
    let user = await UserService().fetchByQuery(email ? { email } : { mobile });

    // First OTP login for this number/email — create the account.
    let isNewUser = false;
    if (!user) {
      user = await UserService().addUsers({
        ...(mobile ? { mobile } : {}),
        ...(email ? { email } : {}),
      });
      isNewUser = true;
    }

    if (!user.isActive) {
      req.rCode = 0;
      req.msg = "ac_deactivated";
      return next();
    }

    const token = await helpers().createJWT({ userId: user._id });

    req.rData = { token, userId: user._id, isNewUser };
    req.msg = "otp_verified";
    next();
  };

  const resendOtp = async (req, res, next) => {
    console.log("AuthController => resendOtp");

    let { userId, countryCode } = req.body;

    let email = null;
    let mobile = null;

    if (userId.includes("@")) {
      email = userId.toLowerCase();
    } else {
      mobile = userId;
    }

    if (!mobile && !email) {
      req.rCode = 0;
      req.msg = "invalid_user_id";
      return next();
    }

    const sent = await sendOtpOrFail(req, {
      mobile,
      email,
      countryCode,
      reason: "OTP RESEND",
    });
    if (!sent) return next();

    req.msg = "otp_resent";
    req.rData = sent;
    return next();
  };

  // Forgot password, step 1: email a 6-digit code to the account's email.
  const forgotPassword = async (req, res, next) => {
    console.log("AuthController => forgotPassword");
    const { userId } = req.body;

    try {
      req.rData = await PasswordResetService().requestReset(userId);
      req.msg = "reset_otp_sent";
    } catch (e) {
      if (!RESET_ERRORS.includes(e.message)) throw e;
      req.rCode = 0;
      req.msg = e.message;
    }
    next();
  };

  // Step 2: check the code; returns a one-time resetToken.
  const verifyResetOtp = async (req, res, next) => {
    console.log("AuthController => verifyResetOtp");
    const { txnId, otp } = req.body;

    try {
      req.rData = await PasswordResetService().verifyOtp(txnId, otp);
      req.msg = "reset_otp_verified";
    } catch (e) {
      if (!RESET_ERRORS.includes(e.message)) throw e;
      req.rCode = 0;
      req.msg = e.message;
    }
    next();
  };

  // Step 3: set the new password with the resetToken.
  const resetPasswordWithToken = async (req, res, next) => {
    console.log("AuthController => resetPasswordWithToken");
    const { resetToken, password } = req.body;

    try {
      await PasswordResetService().setPassword(resetToken, password);
      req.rData = {};
      req.msg = "password_changed";
    } catch (e) {
      if (!RESET_ERRORS.includes(e.message)) throw e;
      req.rCode = 0;
      req.msg = e.message;
    }
    next();
  };

  const socialLogin = async (req, res, next) => {
    console.log("AuthController => socialLogin");
    let {
      facebookId,
      googleId,
      appleId,
      email,
      firstName,
      lastName,
      device_token,
      device_type,
    } = req.body;
    let query = {};
    let exists = null;
    if (facebookId && exists == null) {
      query = { facebookId };
      exists = await UserService().fetchByQuery(query);
    }

    if (googleId && exists == null) {
      query = { googleId };
      exists = await UserService().fetchByQuery(query);
    }
    if (appleId && exists == null) {
      query = { appleId };
      exists = await UserService().fetchByQuery(query);
    }
    if (email && exists == null) {
      query = { email };
      exists = await UserService().fetchByQuery(query);
    }

    console.log(exists);
    if (exists) {
      let data = {};
      if (!exists.firstName && firstName) data.firstName = firstName;
      if (!exists.lastName && lastName) data.lastName = lastName;
      if (facebookId) data.facebookId = facebookId;
      if (googleId) data.googleId = googleId;
      if (appleId) data.appleId = appleId;
      if (device_token) data.device_token = device_token;
      if (device_type) data.device_type = device_type;
      if (email) data.email = email;

      let user = await UserService().updateUsers(exists._id, data);
      user = await UserService().fetch(exists._id);
      let token = await helpers().createJWT({ userId: exists._id });

      req.rData = { user, token, user_type: "user" };
      req.rCode = 1;
    } else {
      let user = {
        facebookId,
        googleId,
        appleId,
        email,
        firstName,
        lastName,
        device_token,
        device_type,
      };
      console.log(user);
      let add_result = await UserService().addUsers(user);
      let token = await helpers().createJWT({ userId: add_result._id });
      user = await UserService().fetch(add_result._id);

      req.rData = { user, token };
    }

    next();
  };

  const logout = async (req, res, next) => {
    console.log("AuthController => logout");
    let { userId } = req.body;

    let user = { device_token: null, token: null, device_type: null };
    user = await UserService().updateUsers(userId, user);
    req.msg = "logout";
    next();
  };

  const resetPassword = async (req, res, next) => {
    console.log("AuthController => resetPassword");
    let { password, userId } = req.body;
    // console.log("req.body", req.body)

    password = await helpers().hashPassword(password);

    user = await UserService().updateUsers(userId, { password });

    req.msg = "password_changed";
    next();
  };

  return {
    login,
    verifyOtp,
    resendOtp,
    socialLogin,
    logout,
    register,
    forgotPassword,
    verifyResetOtp,
    resetPasswordWithToken,
    resetPassword,
  };
};
