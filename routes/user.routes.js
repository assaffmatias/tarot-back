const Router = require("express");

const { check } = require("express-validator");

const { validateJWT, validationErrors } = require("../middlewares");

const { user: controller } = require("../controllers");
const { userAlreadyExist } = require("../helpers");

const router = Router();

// TODO: Terminar válidaciones
router.put(
  "/update",
  [
    validateJWT,
    check("email", "El email no es válido")
      .optional()
      .isEmail()
      .custom(userAlreadyExist),
    check("role", "El rol no es válido")
      .optional()
      .isIn(["USER_REGULAR", "USER_TAROT", "USER_ADMIN"]),
    validationErrors,
  ],
  controller.update
);

// router.get("/:id", [validateJWT], controller.getUserData);
router.get("/:id", controller.getUserData);


module.exports = router;
