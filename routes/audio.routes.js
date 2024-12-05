const Router = require("express");
const { audio: controller } = require("../controllers");

const router = Router();

// Ruta para crear una nueva carta
router.post("/save", controller.storeAudio);

// router.get("/load", controller.getAllCards);

module.exports = router;