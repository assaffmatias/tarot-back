const Router = require("express");

const { validationErrors, validateJWT } = require("../middlewares");

const { check } = require("express-validator");

const { service: controller } = require("../controllers");

const { serviceIsValid } = require("../helpers");

const router = Router();

router.post("/create", 
  [
    // validateJWT, 
    validationErrors
  ], 
  controller.create
);

router.put(
  "/update/:id",
  [
    validateJWT,
    check("id", "ID inválido").isMongoId().custom(serviceIsValid),
    validationErrors,
  ],
  controller.update
);

router.delete(
  "/delete/:id",
  [
    validateJWT,
    check("id", "ID inválido").isMongoId().custom(serviceIsValid),
    validationErrors,
  ],
  controller.delete
);

router.get("/list_all", [validateJWT], controller.list_all);

router.get("/list_user", [validateJWT], controller.list_user);

router.get("/last_adquires", [validateJWT], controller.last_adquires);

module.exports = router;
