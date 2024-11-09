const { Transaction } = require("../models");
const axios = require("axios");
const {notification : notificationController } = require("./index");
const {
  io,
  getSocketId_connected,
  setSocketId_connected,
  removeSocketId_connected,
  getSocketId_inChat,
  setSocketId_inChat,
  removeSocketId_inChat,
} = require("../config");

const PAYPAL_CLIENT =
  "ASop4SvcdJt7V8LuLD_5xp_vZ5H-4d8nR1N13TIdXwbbUvvM6P7GucdbhXxYfZTye_LNGIQPfqBE-AVs";
const PAYPAL_SECRET =
  "EMqpoMPNmlAMaRjE9hhrmueMnQ_mmzlasg7HTnSLjATjiGe657p6JQ2VoLnqlkNTR2hVLYdTbh6v4fhe";
const PAYPAL_API = "https://api-m.sandbox.paypal.com"; // Usa `api-m.paypal.com` en producción

module.exports = {
  getTransactions: async (req, res, next) => {
    req;
  },

  newTransaction: async (req, res, next) => {
    try {
      // Autenticación con PayPal para obtener el token de acceso
      const { data: auth } = await axios.post(
        `${PAYPAL_API}/v1/oauth2/token`,
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          auth: {
            username: PAYPAL_CLIENT,
            password: PAYPAL_SECRET,
          },
        }
      );

      // Crear el pago con los datos proporcionados por el cliente
      const { amount, currency } = req.body;
      
      // console.log('BODY:', req.body);
      
      
      const paymentData = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount,
            },
          },
        ],
        application_context: {
          return_url: "https://example.com/success", // URL de retorno al completar el pago
          cancel_url: "https://example.com/cancel", // URL en caso de cancelar el pago
        },
      };

      // Llamada a la API de PayPal para crear el pedido
      const { data: payment } = await axios.post(
        `${PAYPAL_API}/v2/checkout/orders`,
        paymentData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth.access_token}`,
          },
        }
      );

      // Encontrar el approval_url en los enlaces de respuesta
      const approvalUrl = payment.links.find(
        (link) => link.rel === "approve"
      ).href;

      // // Crear una notificación para el cliente
      // const messageClient = `Tu transacción de ${amount} ${currency} está pendiente.`;
      // const notificationClient = await notificationController.createNotification({
      //   user: client,
      //   type: 0, // Tipo de notificación (puedes modificar esto según el tipo de notificación que quieras)
      //   message: messageClient,
      // });

      // // Crear una notificación para el vendedor
      // const messageSeller = `El cliente ${client} ha realizado una compra de ${amount} ${currency}.`;
      // const notificationSeller = await notificationController.createNotification({
      //   user: seller,
      //   type: 0, // Puedes usar otro tipo si es necesario
      //   message: messageSeller,
      // });

      // Responder con el approval_url para abrirlo en el frontend
      res.status(200).json({ approvalUrl });
    } catch (error) {
      next(error?.response?.data);
    }
  },

  registerSuccesTransaction: async (req, res, next) => {
    try {
      const create = await Transaction.create(req.body);
      // console.log(req.body)
      create.save();

      const notificationId =
      await notificationController.createNotification({
        user: req.body.client,
        type: 0,
        message: 'Tu pago se efectuó',
      });

      io.to(getSocketId_connected(req.body.client)).emit("addNotification", {
        _id: notificationId,
        message: 'Tu pago se efectuó',
      });

      const notificationSellerId =
      await notificationController.createNotification({
        user: req.body.seller,
        type: 0,
        message: 'Contrataron tu servicio',
      });

      io.to(getSocketId_connected(req.body.seller)).emit("addNotification", {
        _id: notificationSellerId,
        message: 'Contrataron tu servicio',
      });


      res.status(201);
    } catch (error) {
      next(error);
    }
  },

  findClientTransactions: async (req, res, next) => {
    try {
      const client = req.params.id;

      const find = await Transaction.find({ client })
        .populate("client")
        .populate("seller")
        .populate("service")
        .populate("messages")
        .lean()
        .exec();

      res.status(200).send(find);
    } catch (error) {
      next(error);
    }
  },

  findSellerTransactions: async (req, res, next) => {
    try {
      const seller = req.params.id;

      const find = await Transaction.find({ seller })
        .populate("client")
        .populate("seller")
        .populate("service")
        .populate("messages")
        .lean()
        .exec();

      res.status(200).send(find);
    } catch (error) {
      next(error);
    }
  },
};
