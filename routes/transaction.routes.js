const express = require("express");
const { transaction: controller } = require("../controllers");
const { validateJWT } = require("../middlewares");
const { check } = require("express-validator");

const router = express.Router();

router.get("/client/:id", [validateJWT], controller.findClientTransactions);
router.get("/seller/:id", [validateJWT], controller.findSellerTransactions);
router.post(
  "/",
  [
    validateJWT,
    check("amount", "Debes enviar un valor").isString().notEmpty(),
    check("currency", "Debe enviarse un valor valido").isIn(["USD"]).notEmpty(),
    check("quantity", "Debe enviarse un valor").isNumeric().isIn([1,60]).notEmpty()
  ],
  controller.newTransaction
);
router.post(
  "/cc",
  [
    validateJWT,
    check("amount", "Debes enviar un valor").isString().notEmpty(),
    check("currency", "Debe enviarse un valor valido").isIn(["USD"]).notEmpty(),
  ],
  controller.newTransactionCreditCard
);

router.post("/success", [validateJWT], controller.registerSuccesTransaction);

module.exports = router;
