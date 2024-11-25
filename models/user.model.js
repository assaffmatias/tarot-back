const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new Schema(
  {
    userName: { type: String, required: [true, "El nombre es obligatorio"] },
    role: {
      type: String,
      enum: ["USER_REGULAR", "USER_TAROT", "USER_ADMIN"],
      default: "USER_REGULAR",
    },
    email: {
      type: String,
      required: true,
      unique: [true, "El email ya esta registrado en la DB"],
    },
    about: { type: String },
    state: { type: Boolean, default: true }, //Baja logica
    google: { type: Boolean, default: false },
    password: { type: String, required: ["La contraseñá es obligatoria"] },
    img: { type: String }, // No es obligatoria, mejor si no la generas,
    paypal_email: { type: String }, //Para pagarle al user
    chatCoins: { type: Number, default: 0 }, // Para monetizar el chatIA
  },
  { versionKey: false }
);

userSchema.pre("save", async function () {
  if (this.isModified("password") || this.isNew) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      this.email = this.email;
    } catch (error) {
      return next(error);
    }
  }
});

module.exports = model("User", userSchema);
