const express = require("express"); // Cambiado a 'express' correctamente
const { transaction: controller } = require("../controllers");
const { validateJWT } = require("../middlewares");

const router = express.Router(); // Instanciamos el enrutador correctamente

router.get("/list", [validateJWT], controller.getTransactions);
router.post("/", [validateJWT], controller.newTransaction);

module.exports = router; // Exportamos el enrutador
