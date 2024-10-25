const { User } = require("../models");

module.exports = {
  update: async (req, res, next) => {
    try {
      const { state, google, ...body } = req.body;

      const user = await User.findByIdAndUpdate(req.params.id, body, {
        new: true,
      });

      return res.send({ msg: "Usuario actualizado", user });
    } catch (error) {
      next(error);
    }
  },
};
