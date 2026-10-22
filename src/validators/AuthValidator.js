const { Validator } = require("node-input-validator");
const { validate, validations } = require("./index");

module.exports = () => {
  const authValidator = async (req, res, next) => {
    const v = new Validator(req.body, {
      login_type: validations.general.required,
    });
    validate(v, res, next, req);
  };

  const validateLogin = async (req, res, next) => {
    const { viaPassword } = req.body;

    if (viaPassword) {
      const v = new Validator(req.body, {
        userId: validations.general.requiredString,
        password: validations.general.requiredString,
      });

      validate(v, res, next, req);
    } else {
      const v = new Validator(req.body, {
        userId: validations.general.requiredString,
      });

      validate(v, res, next, req);
    }
  };

  const validateEmailLogin = async (req, res, next) => {
    const v = new Validator(req.body, {
      email: validations.general.requiredString,
      password: validations.general.requiredString,
    });

    validate(v, res, next, req);
  };

  const validateForgotPassword = async (req, res, next) => {
    const v = new Validator(req.body, {
      userId: validations.general.requiredString,
    });

    validate(v, res, next, req);
  };

  const validateForgotPasswordReset = async (req, res, next) => {
    const v = new Validator(req.body, {
      resetToken: validations.general.requiredString,
      password: validations.general.requiredString,
    });

    validate(v, res, next, req);
  };

  const validateOtp = async (req, res, next) => {
    const v = new Validator(req.body, {
      // mobileNumber: validations.user.existsmobile,
      txnId: validations.general.requiredString,
      otp: validations.general.requiredInt,
    });

    validate(v, res, next, req);
  };

  const validateResendOtp = async (req, res, next) => {
    const v = new Validator(req.body, {
      otp_for: validations.general.requiredString,
    });

    validate(v, res, next, req);
  };

  const validateDataForOtp = async (req, res, next) => {
    let otp_for = req.body.otp_for;
    if (
      otp_for == "signup_via_mobile" ||
      otp_for == "login" ||
      otp_for == "change_mobile"
    ) {
      const signup_v = new Validator(req.body, {
        mobile: validations.general.required,
        // countryCode: validations.general.required,
      });

      validate(signup_v, res, next, req);
    }

    if (otp_for == "signup_via_email") {
      const signup_v = new Validator(req.body, {
        email: validations.user.existsEmail,
        password: validations.general.required,
      });

      validate(signup_v, res, next, req);
    }
    if (otp_for == "forgot_password") {
      var query_object = {};
      if (req.body.user_type == "user") {
        query_object = { email: validations.user.existsEmail };
      } else if (req.body.user_type == "warehouse") {
        query_object = { email: validations.warehouse.warehouse };
      } else {
        query_object = { email: validations.admin.existsEmail };
      }
      const forgot_password_v = new Validator(req.body, query_object);

      validate(forgot_password_v, res, next, req);
    }
  };

  const validateResetPassword = async (req, res, next) => {
    const v = new Validator(req.body, {
      password: validations.general.requiredString,
    });

    validate(v, res, next, req);
  };

  const validateChangePassword = async (req, res, next) => {
    const v = new Validator(req.body, {
      new_password: validations.general.requiredString,
      current_password: validations.general.requiredString,
    });

    validate(v, res, next, req);
  };

  const validateUserType = async (req, res, next) => {
    const v = new Validator(req.body, {
      user_type: validations.general.required,
    });
    req.body.user_type = req.body.user_type;

    validate(v, res, next, req);
  };

  const validatePostUserType = async (req, res, next) => {
    const v = new Validator(req.body, {
      user_type: validations.general.required,
    });

    validate(v, res, next, req);
  };

  const validateUserRegister = async (req, res, next) => {
    const v = new Validator(req.body, {
      email: validations.user.email,
      mobile: validations.user.uniqMobile,
      password: validations.general.requiredString,
      firstName: validations.general.requiredString,
      lastName: validations.general.requiredString,
      role: validations.user.role,
    });

    validate(v, res, next, req);
  };

  return {
    authValidator,
    validateLogin,
    validateForgotPassword,
    validateOtp,
    validateResendOtp,
    validateDataForOtp,
    validateResetPassword,
    validateChangePassword,
    validateUserType,
    validatePostUserType,
    validateEmailLogin,
    validateUserRegister,
    validateForgotPasswordReset,
  };
};
