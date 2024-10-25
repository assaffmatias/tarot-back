const { io } = require("../config");
const { Message, Transaction } = require("../models");
const { storage } = require("../config");
const { v4: uuid } = require("uuid");

const messagePopulate = [
  { path: "from", select: "userName img" },
  { path: "to", select: "userName img" },
  {
    path: "transaction",
    select: "service",
    populate: [{ path: "service", select: "name description img" }],
  },
];

module.exports = {
  sendMessage: async (req, res, next) => {
    try {
      const { message } = req.body;

      // Obtén los archivos del request
      const audioFile = req.files?.audio;
      const imgFile = req.files?.img;

      const [seller] = await Transaction.distinct("seller", {
        _id: req.params.id,
      });

      // Crea el nuevo mensaje
      const msg = new Message({
        from: req.uid,
        message,
        to: seller,
        transaction: req.params.id,
      });

      // Verifica si hay archivos para cargar (audio o imagen)
      if (audioFile || imgFile) {
        const file = audioFile || imgFile; // Usa el archivo disponible
        const filePath = file.tempFilePath;

        // Sube el archivo a Cloud Storage
        const [, response] = await storage
          .bucket("gs://tarotarcano-bfb91.appspot.com")
          .upload(filePath, {
            public: true,
            uploadType: "media",
            destination: uuid() + "." + file.name.split(".").pop(),
          });

        // Asigna el media en el mensaje según el tipo de archivo
        if (audioFile) {
          msg.media = {
            audio: response.mediaLink, // Guarda el enlace del archivo como audio
          };
        } else if (imgFile) {
          msg.media = {
            img: response.mediaLink, // Guarda el enlace del archivo como imagen
          };
        }
      }

      // Guarda el mensaje en la base de datos
      await msg.save();

      // Poblamos el mensaje para incluir la información relacionada
      const [populatedMessage] = await Message.populate([msg], messagePopulate);

      // Emitimos el mensaje a ambos usuarios
      io.to([req.uid, seller]).emit("new_message", populatedMessage);

      // Retornamos el mensaje poblado como respuesta
      return res.send(populatedMessage);
    } catch (error) {
      next(error);
    }
  },
  getMessages: async (req, res, next) => {
    try {
      const messages = await Message.find({
        transaction: req.params.id,
      })
        .sort({ createdAt: -1 })
        .populate(messagePopulate)
        .lean();

      return res.send(messages);
    } catch (error) {
      next(error);
    }
  },
};
