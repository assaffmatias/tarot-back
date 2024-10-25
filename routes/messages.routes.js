const Router = require("express");
const { check } = require("express-validator");

const { message: controller } = require("../controllers");

const { validateJWT } = require("../middlewares");

const { haveAdquiredTheService } = require("../helpers");

const router = Router();

// El id es de la transacción.
router.post(
  "/:id",
  [
    validateJWT,
    check("id", "El ID es inválido").isMongoId(),
    check("message", "Debes enviar un mensaje").not().isEmpty(),
    check().custom((_, { req }) => haveAdquiredTheService(req)),
  ],
  controller.sendMessage
);

router.get(
  "/:id",
  [
    validateJWT,
    check("id", "El ID es inválido").isMongoId(),
    check().custom((_, { req }) => haveAdquiredTheService(req)),
  ],
  controller.getMessages
);

module.exports = router;
