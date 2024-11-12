const Router = require("express");
const { card: controller } = require("../controllers");

const router = Router();

// Ruta para crear una nueva carta
router.post("/", controller.postCard);

router.get("/", controller.getAllCards);

module.exports = router;
