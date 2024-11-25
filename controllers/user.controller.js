const { User, Transaction } = require("../models");

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
  getUserData: async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id)
        .select(["-password", "-google", "-state"])
        .lean()
        .exec();
        
        if (!user) {
          return res.status(404).send({ msg: "Usuario no encontrado" });
        }
        
        const transactions = await Transaction.find({ client: user._id })
        .populate({path:'payment', select: ['status', 'hiredUntil']})
        .select([
          "-client",
          "-messages",
          "-service",
          "-price",
          "-updatedAt",
          "-createdAt"
        ]) // Populate reader info (assuming there's a reader field)
        .lean()
        .exec();

        const currentdate = new Date();
        console.log(currentdate);
        const filteredTransactions = transactions.filter(transaction =>
          transaction.payment?.status === 'payed' && transaction?.payment.hiredUntil >= currentdate
      );
        console.log('filteredTransactions found:', filteredTransactions);
        
        
        user.transactions = filteredTransactions;
      return res.status(200).send({ user });
    } catch (error) {
      console.error(error);
    }
  },
};
