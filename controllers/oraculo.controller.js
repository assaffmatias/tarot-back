const { OpenAIClient } = require("../config");

module.exports = {
  daily: async (req, res, next) => {
    try {
      const params = {
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente que solo responde preguntas relacionadas con el horóscopo. Si te hacen una pregunta no relacionada con el horóscopo, debes responder: 'Lo siento, solo puedo responder preguntas relacionadas con el horóscopo.'",
          },
          {
            role: "user",
            content: req.body.message || "¿Cuál es mi horóscopo de hoy?",
          },
        ],
        model: "gpt-3.5-turbo",
      };

      let response;
      try {
        response = await OpenAIClient.chat.completions.create(params);
      } catch (error) {
        response = null;
      }

      return res.send({
        msg: "OK",
        response: response?.choices[0].message.content ?? "No disponible, intente nuevamente más adelante",
      });
    } catch (error) {
      next(error);
    }
  },
};
