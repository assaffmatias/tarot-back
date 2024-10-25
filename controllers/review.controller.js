const { Review, Transaction } = require("../models");

module.exports = {
  getTen: async (req, res, next) => {
    try {
      const firstTen = await Review.find({ service: req.params.id })
        .populate([{ path: "user", select: "userName" }])
        .limit(5)
        .lean({ virtuals: true });

      return res.send(firstTen);
    } catch (error) {
      next(error);
    }
  },
  post: async (req, res, next) => {
    try {
      const review = new Review({
        ...req.body,
        user: req.uid,
        service: req.params.id,
      });

      await review.save();

      return res.send({ msg: "Tu revision fue publicada con exito", review });
    } catch (error) {
      next(error);
    }
  },
};
