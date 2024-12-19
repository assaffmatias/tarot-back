const { questionsTypes } = require("../helpers/constants.helper");
const { Answer, Questionnaire, Question } = require("../models");
const { OpenAIClient } = require("../config");

const paramsFormat = ({ hint, answer }) => ({
  messages: [
    {
      role: "system",
      content: `Eres un corrector de exámenes especializado en tarot. A continuación, se te proporcionará una pista (guía) y una respuesta de un estudiante. Debes determinar si la respuesta es correcta o incorrecta con base en la pista. Esta es la pista: "${hint}". Evalúa solo la relevancia y corrección de la respuesta con respecto a la pista. Si la respuesta es correcta, devuelve el número 1, de lo contrario, devuelve el número 0. Solo responde con el número 1 o 0, sin ningún otro texto.`,
    },
    {
      role: "user",
      content: `La respuesta del estudiante es: "${answer}".`,
    },
  ],
  model: "gpt-3.5-turbo",
});

module.exports = {
  getQuestionnaire: async (req, res, next) => {
    try {
      const hasAnswer = await Answer.findOne({
        user: req.uid,
        date: { $lt: Date.now() - 86400000 * 15 },
      });

      if (hasAnswer) {
        return res
          .status(401)
          .json({ msg: "Todavía no puedes responder nuevamente" });
      }

      const questionnaire = await Questionnaire.findOne({
        _id: { $ne: hasAnswer?.questionnaire },
      })
        .select("questions")
        .populate([{ path: "questions", select: "-correct_answer -guide" }])
        .lean({ virtuals: true });

      return res.send(questionnaire);
    } catch (error) {
      next(error);
    }
  },
  answerQuestionnaire: async (req, res, next) => {
    try {
      const { questions } = req.body;

      // const FIFTEEN_DAYS_MS = 86400000 * 15;

      // const recentAnswer = await Answer.findOne({
      //   date: { $gt: new Date(Date.now() - FIFTEEN_DAYS_MS) },
      // }).lean();

      // if (recentAnswer) {
      //   throw new Error(
      //     `Debes esperar 15 días. Realizaste la prueba el ${recentAnswer.date.toLocaleDateString()}`
      //   );
      // }

      const format = Object.entries(questions).map(([key, value]) => ({
        id: key,
        value,
      }));

      const correctQuestions = [];

      const incorrectQuestions = [];

      let finalPoints = 0;

      await Promise.all(
        format.map(async ({ id, value }) => {
          const { correct_answer, guide, points, type } =
            await Question.findById(id).lean();

          if (type === questionsTypes.multipleChoice) {
            if (value === correct_answer) {
              correctQuestions.push(id);
              finalPoints += points;
            } else incorrectQuestions.push(id);
          }

          if (type === questionsTypes.open) {
            const params = paramsFormat({ hint: guide, answer: value });

            const response = await OpenAIClient.chat.completions.create(params);

            const data = response?.choices[0];

            if (data?.message.content === "1") {
              correctQuestions.push(id);
              finalPoints += points;
            } else incorrectQuestions.push(id);
          }
        })
      );

      const answer = new Answer({
        user: req.uid,
        questionnaire: req.params.id,
        correctQuestions,
        incorrectQuestions,
        points: finalPoints,
        date: new Date(),
      });

      await answer.save();

      const populatedDoc = await answer.populate([
        { path: "correctQuestions" },
        { path: "incorrectQuestions" },
      ]);

      const response = {
        data: populatedDoc,
        msg: "",
        title: "",
        status: ""
      };

      if (finalPoints < 15) {
        response.title =
          "¡No te desanimes!. Puedes volver a intentarlo en 15 días";
        response.msg = `Tu puntaje fue ${finalPoints}, no es suficiente para pasar.`;
      } else {
        response.title = "¡Felicidades ! Has pasado la prueba.";
        response.msg = `Tu puntaje fue ${finalPoints}, lo suficiente para pasar.`;
        response.status = "ok"
      }

      return res.send(response);
    } catch (error) {
      next(error);
    }
  },
};
