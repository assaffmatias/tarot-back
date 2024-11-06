const Router = require("express");
const { check } = require("express-validator");

const { notification: controller } = require("../controllers");

const { validateJWT } = require("../middlewares");

const { haveAdquiredTheService } = require("../helpers");

const router = Router();

// El id es de la transacción.
router.get(
  "/:id",
  [
    validateJWT,
    check("id", "El ID es inválido").isMongoId(),
    // check().custom((_, { req }) => haveAdquiredTheService(req)),
  ],
  controller.getNotificationsByUser
);

module.exports = router;
