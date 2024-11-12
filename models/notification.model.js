const { Schema, model } = require("mongoose");

const notificationSchema = new Schema(
  {
    user: { // The recipient of the notification
      type: Schema.Types.ObjectId, 
      ref: "User",
      required: [true, "El cliente es obligatorio"],
      index: true
    },
    type: {
      type: Schema.Types.Number,
      default: 0,
    },
    sender: {  // The other participant in the chat (who sent the message)
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [false, "El remitente no es obligatorio"],
    },
    pending: { type: Schema.Types.Boolean, default: true},
    softDelete: { type: Schema.Types.Boolean, default: false},
    message: {
      type: String,
      required: true,
      index: true
    },
  },
  { versionKey: false, timestamps: true }
);

module.exports = model("Notification", notificationSchema);
