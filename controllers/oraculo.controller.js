const { OpenAIClient } = require("../config");

module.exports = {
  daily: async (req, res, next) => {
    try {
      const { lastMessages, cartas } = req.body; // cartas: ["El Mago", "Loco"] 
      const params = {
        messages: [
          {
            role: "system",
            content:
              `Eres un asistente que responde preguntas relacionadas con el horóscopo. Ya le han tirado las cartas al usuario y son las siguientes: ${cartas.join(', ')}. Responde detalladamente qué significa cada una de ellas.`,
          },
          // {
          //   role: "user",
          //   content: req.body.message || "¿Cuál es mi horóscopo de hoy?",
          // },
        ],
        model: "gpt-3.5-turbo",
      };

      // Si hay mensajes previos, añádelos a los parámetros
      if (Array.isArray(lastMessages) && lastMessages.length > 0) {
        params.messages = [...params.messages, ...lastMessages];
      }

      let response;
      try {
        // Solicitar una respuesta del modelo de OpenAI
        response = await OpenAIClient.chat.completions.create(params);
      } catch (error) {
        response = null;
      }

      // Devolver la respuesta obtenida
      return res.send({
        msg: "OK",
        response:
          response?.choices[0].message.content ??
          "No disponible, intente nuevamente más adelante",
      });
    } catch (error) {
      next(error);
    }
  },
};
