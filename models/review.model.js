const { Schema, model } = require("mongoose");

const reviewSchema = new Schema(
  {
    rate: { type: Number, required: [true, "La puntuación es obligatorio"] },
    message: { type: String, required: [true, "Es obligatorio un mensaje"] },
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Es olbligatorio el servicio"],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Es obligatorio un Usuario que realice la review"],
    },
  },
  { versionKey: false }
);

module.exports = model("Review", reviewSchema);
