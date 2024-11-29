const { User } = require("../models");
const { OpenAIClient } = require("../config");

module.exports = {
  daily: async (req, res, next) => {
    try {
      const { user, lastMessages, cartas } = req.body; // cartas:["El Mago", "Loco"] 
      const userDB = await User.findById(user._id).exec();
      if(user.chatCoins < 1) 
        return res.status(403).json({msg: "No tienes suficientes chatCoins"});

      const params = {
        messages: [
          {
            role: "system",
            content:
              `Eres un asistente que solo responde preguntas relacionadas con el horóscopo. Si te hacen una pregunta no relacionada con el horóscopo, debes responder: 'Lo siento, solo puedo responder preguntas relacionadas con el horóscopo. Ademas, ten en cuenta en cada respuesta que generes que ya le han tirado las cartas al usuario y son las siguientes: ${cartas.join(', ')}, responde detalladamente que significa cada una.`
              ,
          },
          // {
          //   role: "user",
          //   content: req.body.message || "¿Cuál es mi horóscopo de hoy?",
          // },
        ],
        model: "gpt-3.5-turbo",
      };
      if (Array.isArray(lastMessages) && lastMessages.length > 0) {
        params.messages = [...params.messages, ...lastMessages];
      }
      let response;
      try {
        response = await OpenAIClient.chat.completions.create(params);
      } catch (error) {
        response = null;
      }
      if(response != null && !response.choices[0].message.content.includes("Lo siento, solo puedo responder preguntas relacionadas con el horóscopo")){
        // Save user chatCoins
        userDB.chatCoins -= 1;
        await userDB.save();
      }
        return res.send({
          user,
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
