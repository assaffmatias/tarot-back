const { User, Service, Transaction } = require("../models");

const regexPass = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

module.exports = {
  userAlreadyExist: async (value) => {
    const user = await User.findOne({ email: value, status: true }).lean();
    if (user) throw new Error("El usuario ya esta registrado");
    return true;
  },
  passwordIsValid: (value) => {
    if (!regexPass.test(value)) {
      throw new Error(
        "La contraseña debe tener al menos 6 caracteres, al menos una letra y al menos un número"
      );
    }
    return true;
  },
  emailExist: async (value = "") => {
    const user = await User.findOne({
      email: value.toLowerCase(),
      state: true,
    }).lean();
    if (!user) throw new Error("Usuario no encontrado");
    return true;
  },
  userNameExist: async (value = "") => {
    const user = await User.findOne({ userName: value.toLowerCase() }).lean();
    if (user) throw new Error("El nombre ya esta registrado");
    return true;
  },
  serviceIsValid: async (value = "") => {
    const service = await Service.findById(value).lean();
    if (!service) throw new Error("El servicio no existe");
    return true;
  },
  haveAdquiredTheService: async (req) => {
    const exits = await Transaction.findOne({
      client: req.uid,
      service: req.params.id,
    }).lean();
    if (!exits) throw new Error("No has adquerido el servicio");
    return true;
  },
};
