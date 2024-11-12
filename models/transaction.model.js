const { Schema, model } = require("mongoose");

const transactionSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El cliente es obligatorio"],
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El vendedor es obligatorio"],
    },
    price: { type: Number, required: [true, "El precio es obligatorio"] },
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "El servicio es obligatorio"],
    },
    paypal_id: {
      type: String,
      required: true,
    },
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
  },
  { versionKey: false, timestamps: true }
);

module.exports = model("Transaction", transactionSchema);
