const { Schema, model } = require("mongoose");

const paymentSchema = new Schema(
  {
    price: { type: Number, required: [true, "El precio es obligatorio"] },
    hiredMinutes: {
      type: Number,
      required: [true, "El tiempo del servicio es obligatorio"],
    },
    hiredUntil: {
      type: Schema.Types.Date,
      required: [false, "El tiempo del servicio no es obligatorio"],
    },
    status: { type: Schema.Types.String, default: "not payed" },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = model("Payment", paymentSchema);
