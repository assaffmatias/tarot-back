const Router = require("express");

const { validateJWT, validationErrors } = require("../middlewares");

const { questionnaire: controller } = require("../controllers");

const router = Router();

router.get("/", [validateJWT, validationErrors], controller.getQuestionnaire);

router.post(
  "/:id",
  [validateJWT, validationErrors],
  controller.answerQuestionnaire
);

module.exports = router;
