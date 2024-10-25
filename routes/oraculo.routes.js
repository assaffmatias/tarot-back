const Router = require("express");

const { oraculo: controller } = require("../controllers");
const { validateJWT, validationErrors } = require("../middlewares");

const router = Router();
router.post("/", [validateJWT, validationErrors], controller.daily);

module.exports = router;
