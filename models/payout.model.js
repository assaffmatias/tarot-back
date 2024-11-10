const { Schema, model } = require("mongoose");

const payoutSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El cliente es obligatorio"],
    },
    payed: {
      type: Schema.Types.Boolean,
      required: [true, "El estado del pago es obligatorio"],
    },
    amount: { type: Number, required: [true, "El precio es obligatorio"] },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: [true, "La transaccion es obligatorio"],
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = model("Payout", payoutSchema);
