const { Schema, model } = require("mongoose");

const mediaSchema = new Schema(
  {
    img: {
      type: String,
      required: false,
    },
    audio: {
      type: String,
      required: false,
    },
  },
  { _id: false, timestamps: false, versionKey: false }
);

const messageSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El campo es requerido"],
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El campo es requerido"],
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
    },
    message: {
      type: String,
      required: [true, "No puedes enviar un mensaje si no hay mensaje"],
    },
    media: {
      type: mediaSchema,
      required: false,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = model("Message", messageSchema);
