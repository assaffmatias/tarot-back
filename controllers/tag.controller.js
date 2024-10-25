const { Tag } = require("../models");

module.exports = {
  list: async (req, res, next) => {
    try {
      const result = await Tag.find({ state: true }).lean();

      return res.send(result);
    } catch (error) {
      next(error);
    }
  },
};
