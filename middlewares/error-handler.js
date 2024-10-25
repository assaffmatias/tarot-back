const { validationResult } = require("express-validator");

const formatStack = (err) => {
  if (typeof err === "string") return { error: err };
  const whereIsError = err.stack.split("\n").map((e) => e.replace("\n", ""));
  return { msg: err.message, location: whereIsError };
};

module.exports = {
  httpErrors: function (err, _req, res, next) {
    if (res.headersSent) {
      return next(err);
    }
    console.error(err);
    return res.status(500).send(formatStack(err));
  },
  validationErrors: (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => error.msg);

      const combinedErrorMessage = errorMessages.join(", ");

      return res.status(400).json({
        msg: `Error de validación: ${combinedErrorMessage}`,
        errors: errors.array(),
      });
    }

    next();
  },
};
