const { request } = require("express");
const jwt = require("jsonwebtoken");

const { User } = require("../models");
const { Socket } = require("socket.io");

module.exports = {
  validateJWT: async (req = request, res, next) => {
    try {
      const token = req.headers["x-token"];
      if (!token)
        return res.status(401).json({ msg: "No autorizado, falta token" });

      const { uid } = jwt.verify(token, process.env.SECRET_KEY);

      const user = await User.findById(uid).select("-password").lean();

      if (!user?.state)
        return res.status(401).json({
          msg: "Cuenta deshabilitada, pongase en contacto con un administrador",
        });

      if (!user)
        return res.status(401).json({
          msg: "No autorizado, usuario no encontrado",
        });

      req.user = user;
      req.uid = uid;

      next();
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  },
  validateProvider: (req, res, next) => {
    if (req.user.role !== "PROVIDER")
      return res.status(401).json({ msg: "No autorizado" });
    next();
  },
  validateAdmin: (req, res, next) => {
    if (req.user.role !== "ADMIN")
      return res.status(401).json({ msg: "No autorizado" });
    next();
  },
  WSAuth: async (socket = new Socket(), next) => {
    try {
      const token = socket.handshake.auth["x-token"];

      if (!token) return next();

      const { uid } = jwt.verify(token, process.env.SECRET_KEY);

      const user = await User.findById(uid).select("-password").lean();

      socket.uid = user._id;
      socket.user = user;

      next();
    } catch (error) {
      console.error(error);

      socket.uid = null;
      socket.user = null;

      next();
    }
  },
};
