// Library's
const Router = require("express");
const { check } = require("express-validator");

// Controller
const { auth: controller } = require("../controllers");

// Middlewares
const { validationErrors } = require("../middlewares");

// Helpers
const {
  userAlreadyExist,
  passwordIsValid,
  emailExist,
  userNameExist,
} = require("../helpers");

const router = Router();

router.post(
  "/register",
  [
    check("email", "Debe ser un email válido")
      .isEmail()
      .custom(userAlreadyExist),
    check("userName", "Debe ser un usuario válido")
      .notEmpty()
      .custom(userNameExist),
    check("password", "Debe ser una contraseña válida")
      .notEmpty()
      .custom(passwordIsValid),
    check("role", "El rol no es válido").isIn(["USER_REGULAR"]),
    validationErrors,
  ],
  controller.register
);

router.post(
  "/login",
  [
    check("email").isEmail().custom(emailExist),
    check("password").notEmpty(),
    validationErrors,
  ],
  controller.login
);

router.post(
  "/recover",
  [
    check("email", "Debe ser un email válido").notEmpty().isEmail(),
    validationErrors,
  ],
  controller.email_recover
);

router.post(
  "/code",
  [
    check("code", "Debe ser un número de 6 digitos")
      .notEmpty()
      .isLength(6)
      .isNumeric(),
    validationErrors,
  ],
  controller.login_code
);

router.post(
  "/google",
  [
    check("id_token", "id_token es necesario").notEmpty(),
    check("socket_id", "el socket_id es necesario").notEmpty(),
    validationErrors,
  ],
  controller.google
);

module.exports = router;
