const { Service, User, Transaction } = require("../models");

const ServiceAggregation = ({ skip, limit, query }) => [
  { $match: query },
  {
    $lookup: {
      as: "tags",
      from: "tags",
      foreignField: "_id",
      localField: "tags",
      pipeline: [{ $project: { state: 0 } }],
    },
  },
  {
    $lookup: {
      as: "user",
      from: "users",
      foreignField: "_id",
      localField: "user",
      pipeline: [
        {
          $project: {
            state: 0,
            email: 0,
            role: 0,
            password: 0,
            google: 0,
          },
        },
      ],
    },
  },
  { $unwind: { path: "$user" } },
  {
    $lookup: {
      from: "reviews",
      localField: "_id",
      foreignField: "service",
      as: "rate",
      pipeline: [
        {
          $group: {
            _id: null,
            rate: { $push: "$rate" },
          },
        },
        {
          $addFields: {
            avgRate: {
              $cond: {
                if: { $lt: [{ $size: "$rate" }, 10] },
                then: -1,
                else: { $avg: "$rate" },
              },
            },
          },
        },
        { $project: { _id: 0, avgRate: 1 } },
      ],
    },
  },
  {
    $addFields: {
      rate: {
        $ifNull: [{ $arrayElemAt: ["$rate.avgRate", 0] }, -1],
      },
    },
  },
  {
    $sort: { rate: -1 },
  },
  {
    $skip: skip,
  },
  {
    $limit: limit,
  },
];

module.exports = {
  create: async (req, res, next) => {
    try {
      const { name, description, price, tags, user } = req.body;

      const service = new Service({ name, description, price, tags, user });

      await service.save();

      return res.send({ msg: "Servicio creado", service });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const updatedService = await Service.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          tags: req.body.tags,
        },
        { new: true }
      );

      return res.send({ msg: "Servicio actualizado", service: updatedService });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const service = await Service.findByIdAndUpdate(
        req.params.id,
        { state: false },
        { new: true }
      );

      return res.send({ msg: "Servicio eliminado", service });
    } catch (error) {
      next(error);
    }
  },
  list_all: async (req, res, next) => {
    try {
      const { search = "", page = 1, limit = 10, tags = [] } = req.query;

      const query = { state: true };

      if (search) {
        const ids = await User.distinct("_id", {
          userName: { $regex: new RegExp(search, "i") },
        });

        query.user = { $in: ids };
      }
      if (tags.length > 0) query.tags = { $in: tags };

      const services = await Service.aggregate(
        ServiceAggregation({
          skip: (parseInt(page) - 1) * parseInt(limit),
          limit,
          query,
        })
      );

      return res.send(services);
    } catch (error) {
      next(error);
    }
  },
  list_user: async (req, res, next) => {
    try {
      const { search } = req.query;

      const query = { state: true, user: req.uid };

      if (search) query.name = { $regex: new RegExp(search, "i") };

      const services = await Service.find(query)
        .select("-state")
        .lean({ virtuals: true });

      return res.send(services);
    } catch (error) {
      next(error);
    }
  },
  last_adquires: async (req, res, next) => {
    try {
      const lastFiveIds = await Transaction.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("service")
        .lean({ virtuals: true });

      const query = {
        _id: { $in: lastFiveIds.map(({ service }) => service) },
      };

      const lastServices = await Service.aggregate(
        ServiceAggregation({
          limit: 5,
          skip: 0,
          query,
        })
      );

      return res.send(lastServices);
    } catch (error) {
      next(error);
    }
  },
};
