const { Validator } = require("node-input-validator");
const { validate, validations } = require("./index");

module.exports = () => {
  const validateUserLogin = async (req, res, next) => {
    const v = new Validator(req.body, {
      username: validations.user.existsUsername,
      password: validations.general.requiredString,
    });

    validate(v, res, next, req);
  };

  const validateAddUser = async (req, res, next) => {
    const v = new Validator(req.body, {
      username: validations.user.username,
      password: validations.general.requiredString,
      fullName: validations.general.requiredString,
      isAdmin: validations.general.requiredBoolean,
    });

    validate(v, res, next, req);
  };

  const validateAddAdmin = async (req, res, next) => {
    const v = new Validator(req.body, {
      username: validations.general.requiredString,
      password: validations.general.requiredString,
      fullName: validations.general.requiredString,
      isAdmin: validations.general.requiredBoolean,
    });

    validate(v, res, next, req);
  };

  const validateUserId = async (req, res, next) => {
    let { username } = req.body;
    if (username) {
      await validateUserName(req, res, next);
    }
    const v = new Validator(req.params, {
      id: validations.user.id,
    });

    validate(v, res, next, req);
  };

  const validateUserName = async (req, res, next) => {
    const v = new Validator(req.body, {
      username: validations.user.username,
    });

    validate(v, res, next, req);
  };

  const validateInterest = async (req, res, next) => {
    const v = new Validator(req.body, {
      username: validations.user.username,
    });

    validate(v, res, next, req);
  };

  const validateAddressId = async (req, res, next) => {
    let { id } = req.params;

    if (id) {
      req.body.addressId = id;
    }

    const v = new Validator(req.params, {
      id: validations.address.id,
    });

    validate(v, res, next, req);
  };

  const validateAddress = async (req, res, next) => {
    // let { addressId } = req.body;

    // if (addressId) {
    //   const v = new Validator(req.body, {
    //     addressId: validations.address.id,
    //     firstName: validations.general.requiredString,
    //     lastName: validations.general.requiredString,
    //     country: validations.general.requiredString,
    //     city: validations.general.requiredString,
    //     state: validations.general.requiredString,
    //     // countryCode: validations.general.requiredString,
    //     email: validations.general.requiredString,
    //     mobileNumber: validations.general.requiredString,
    //     addressType: validations.general.requiredString,
    //     address: validations.general.requiredString,
    //     pinCode: validations.general.requiredInt,
    //   });

    //   validate(v, res, next, req);
    // } else {
    const v = new Validator(req.body, {
      fullName: validations.general.requiredString,
      city: validations.general.requiredString,
      state: validations.general.requiredString,
      mobile: validations.general.requiredNumeric,
      pinCode: validations.general.requiredInt,
      address: validations.general.requiredString,
      addressType: validations.general.requiredString,
    });

    validate(v, res, next, req);
    // }
  };

  return {
    validateUserLogin,
    validateAddUser,
    validateAddAdmin,
    validateUserId,
    validateUserName,
    validateAddress,
    validateAddressId,
  };
};
