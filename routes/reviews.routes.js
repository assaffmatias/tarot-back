// Librarys
const Router = require("express");
const { check } = require("express-validator");

// Middlewares
const { validateJWT, validationErrors } = require("../middlewares");

// Controller
const { review: controller } = require("../controllers");
const { haveAdquiredTheService } = require("../helpers");

const router = Router();

router.get(
  "/:id",
  [
    validateJWT,
    check("id", "Debe ser un ID válido").notEmpty().isMongoId(),
    validationErrors,
  ],
  controller.getTen
);

router.post(
  "/:id",
  [
    check("rate", "Rate inválido").isNumeric().isIn([1, 2, 3, 4, 5]),
    check("message", "No puedes publicar una reseña vacía").notEmpty(),
    check("id", "ID no válido").isMongoId(),
    check().custom((_, { req }) => haveAdquiredTheService(req)),
    validateJWT,
  ],
  controller.post
);

module.exports = router;
