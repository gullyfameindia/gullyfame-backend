const ResponseMiddleware = require("./ResponseMiddleware");

module.exports = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (ex) {
      console.log(handler);

      req.rCode = 0;
      let message = `${ex.message}`;

      ResponseMiddleware(req, res, next, message);
    }
  };
};
