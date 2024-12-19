const { io } = require("../config");
const { Message, Transaction } = require("../models");
const { storage } = require("../config");
const { v4: uuid } = require("uuid");
const bucket = require('./bucket.controller');
const { FieldValue } = require("firebase-admin/firestore");

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
    console.log("In message controller:",req.body);
    
    try {
      const { message, to, from } = req.body;

      // Obtener file
      const file = req.files

      // Crea el nuevo mensaje
      const msg = new Message({
        from,
        message,
        to,
        transaction: req.params.id,
      });

      // Verifica si hay archivos para cargar (audio o imagen)
      if (file) {
        try {
          if (file.audio) {
            const result = await bucket.putObject(file.audio, 'audio/mp3');
            const audioUrl = result.url;
            msg.media = {
              audio: audioUrl
            };
          }
          
          if (file.img) {
            const result = await bucket.putObject(file.img,'image/jpeg');
            const imageUrl = result.url;
            msg.media = {
              ...msg.media,
              img: imageUrl
            };
          }
        } catch (error) {
          return res.status(400).json({ 
            error: `Error uploading file: ${error.message}` 
          });
        }
      }

      // Guarda el mensaje en la base de datos
      await msg.save();

      // Poblamos el mensaje para incluir la información relacionada
      const [populatedMessage] = await Message.populate([msg], messagePopulate);

      // Emitimos el mensaje a ambos usuarios
      // io.to([req.uid, seller]).emit("new_message", populatedMessage);

      // Se actualiza el hisotiral del chat
      console.log(msg._id);
      await Transaction.updateOne(
        { _id: req.params.id },
        { $push: { messages: msg._id } }
      );

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
