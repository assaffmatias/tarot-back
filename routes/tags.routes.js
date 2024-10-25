const Router = require("express");

const { tag: controller } = require("../controllers");

const { validateJWT, validationErrors } = require("../middlewares");

const router = Router();

router.get("/list", [validateJWT, validationErrors], controller.list);

module.exports = router;
