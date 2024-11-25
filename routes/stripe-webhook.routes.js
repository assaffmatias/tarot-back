const express = require("express");
const Router = express.Router;

const { check } = require("express-validator");

const { validateJWT, validationErrors } = require("../middlewares");

const { stripeWebhook: controller } = require("../controllers");

const router = Router();

// TODO: Terminar válidaciones
router.post("/", express.raw({type:'application/json'}), controller.eventHandler);

// router.get("/:id", [validateJWT], controller.getUserData);

module.exports = router;
