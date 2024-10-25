const { User, Code } = require("../models");
const {
  generateJWT,
  generateTemplateHtml,
  googleVerify,
} = require("../helpers");
const { v4: uuid } = require("uuid");
const bcrypt = require("bcrypt");
const { transporter, io } = require("../config");

module.exports = {
  register: async (req, res, next) => {
    try {
      const { userName, role, email, password } = req.body;

      const user = new User({
        userName,
        role,
        email: email.toLowerCase(),
        password,
      });

      await user.save();

      const token = generateJWT(user._id);

      return res.status(201).json({ msg: "Usuario creado", token });
    } catch (error) {
      next(error);
    }
  },
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const { password: dbPass, ...user } = await User.findOne({
        email: email.toLowerCase(),
        state: true,
      }).lean();

      const match = bcrypt.compareSync(password, dbPass);

      if (!match) return res.status(401).json({ msg: "Contraseña incorrecta" });

      const token = generateJWT(user._id);

      return res.send({ msg: "OK", user, token });
    } catch (error) {
      next(error);
    }
  },
  email_recover: async (req, res, next) => {
    try {
      const { email } = req.body;

      // Esperar a que la consulta a la base de datos se complete
      const user = await User.findOne({
        email: { $regex: new RegExp(email, "i") },
        state: true,
      });

      if (!user) {
        return res
          .status(401)
          .json({ msg: "El correo no es correcto", success: false });
      }

      const createCode = () =>
        Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, "0");

      const code = createCode();

      const template = generateTemplateHtml("recover");
      const data = {
        email,
        code,
      };

      const html = template(data);

      const mailOptions = {
        from: "app.tarotarcano.com",
        to: email,
        subject: "Correo de recuperación",
        html,
      };

      // Devolver la promesa directamente, sin necesidad de await
      const sendEmail = new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, async (err) => {
          if (err) {
            reject("Error: el correo no se pudo enviar");
          } else {
            await Code.create({ code, uid: user._id });
            resolve({ msg: `Correo enviado a: ${email}` });
          }
        });
      });

      return sendEmail
        .then((result) => res.send(result))
        .catch((error) => {
          console.error(error);
          return res.status(500).json({ msg: "Error enviando email" });
        });
    } catch (error) {
      next(error);
    }
  },
  login_code: async (req, res) => {
    const { code } = req.body;

    try {
      const validate = await Code.findOne({ code });

      if (!validate)
        return res.status(401).json({ msg: "El código no es válido" });

      const user = await User.findById(validate.uid).select([
        "-password -google",
        "",
      ]);

      if (!user || user.disabled)
        return res
          .status(401)
          .json({ msg: "El usuarío no existe o esta deshabilitado" });

      let token = generateJWT({ uid: validate.uid });

      return res.send({
        msg: "El código es válido",
        token,
        userInfo: user,
        auth: true,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ msg: error.message });
    }
  },
  google: async (req, res, next) => {
    try {
      const { id_token, socket_id } = req.body;

      const { name, email } = await googleVerify(id_token);

      let user = await User.findOne({ email }).lean();

      if (!user) {
        user = new User({
          email,
          userName: name + uuid().slice(0, 5),
          password: uuid(),
          google: true,
        });

        await user.save();
      }

      const token = generateJWT(user._id);

      io.to(socket_id).emit("google-login", {
        userInfo: user,
        auth: true,
        token,
      });

      const response = { msg: "¡Exito!", user };

      return res.json(response);
    } catch (error) {
      next(error);
    }
  },
};
