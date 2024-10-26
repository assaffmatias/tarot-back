const express = require("express");
const { transaction: controller } = require("../controllers");
const { validateJWT } = require("../middlewares");
const { check } = require("express-validator");

const router = express.Router();

router.get("/user/:id", [validateJWT], controller.getTransactions);
router.post(
  "/",
  [
    validateJWT,
    check("amount", "Debes enviar un valor").isString().notEmpty(),
    check("currency", "Debe enviarse un valor valido").isIn(["USD"]).notEmpty(),
  ],
  controller.newTransaction
);

router.post("/success", [validateJWT], controller.registerSuccesTransaction);

module.exports = router;
