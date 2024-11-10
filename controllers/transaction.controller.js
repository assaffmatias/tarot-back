const { Transaction, User, Payout } = require("../models");
const axios = require("axios");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { createNotification } = require("./notification.controller");
const {
  io,
  getSocketId_connected,
  setSocketId_connected,
  removeSocketId_connected,
  getSocketId_inChat,
  setSocketId_inChat,
  removeSocketId_inChat,
} = require("../config");

const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API = process.env.PAYPAL_API;

module.exports = {
  getTransactions: async (req, res, next) => {
    req;
  },

  newTransaction: async (req, res, next) => {
    try {
      // Autenticación con PayPal para obtener el token de acceso
      const params = new URLSearchParams();
      params.append("grant_type", "client_credentials");
      const { data: auth } = await axios.post(
        `${PAYPAL_API}/v1/oauth2/token`,
        params,
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
      console.log("paymentid", payment.id);

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
      // console.error(error);
      next(error?.response?.data);
    }
  },

  registerSuccesTransaction: async (req, res, next) => {
    try {
      const params = new URLSearchParams();
      params.append("grant_type", "client_credentials");
      const { data: auth } = await axios.post(
        `${PAYPAL_API}/v1/oauth2/token`,
        params,
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
      //Capturar orden
      console.log(req.body);

      const { paypal_id, token, seller, price } = req.body;
      console.log("lo que llega", token);
      const { data: captureResponse } = await axios.post(
        `${PAYPAL_API}/v2/checkout/orders/${token}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        }
      );

      //Guardo en la base en la transaccion
      const transaction = await Transaction.create(req.body);

      //**Pago al tarot user
      //****Encuentro el email para pagar
      const tarotUser = await User.findOne({ _id: seller });
      //****Calculo el pago
      const paymentValue = price * 0.85; // 85% del precio | 15% para el admin
      //****Realizo el pago

      if (!tarotUser.paypal_email) {
        //Si el seller no tiene paypal_email
        const payout = await Payout.create({
          user: tarotUser._id,
          payed: false,
          amount: paymentValue,
          transaction: transaction._id,
        });
        console.log("El seller no tiene paypal_email, se cargo en db");
        // return res.status(201).json({message: "El pago se ha realizado correctamente", transaction});
        return res.status(201);
      } else {
        const payout = await Payout.create({
          user: tarotUser._id,
          payed: true,
          amount: paymentValue,
          transaction: transaction._id,
        });
        const response = await axios.post(
          `${PAYPAL_API}/v1/payments/payouts`,
          {
            sender_batch_header: {
              sender_batch_id: `Payout_${token}`,
              email_subject: "Tienes un pago!",
              email_message:
                "Recibiste un pago de tarot. Gracias por usar nuestro servicio.",
            },
            items: [
              {
                recipient_type: "EMAIL",
                amount: { value: paymentValue, currency: "USD" },
                note: "Gracias por usar nuestro servicio!",
                sender_item_id: `Payout_${token}`,
                receiver: tarotUser.paypal_email,
              },
            ],
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${auth.access_token}`,
            },
          }
        );
        console.log("Se envio el pago al seller y se guardo en db");
        // const responsePaymentTry = await axios.get(
        //   response.data.links[0].href,
        //   {
        //     headers: {
        //       Authorization: `Bearer ${auth.access_token}`,
        //     },
        //   }
        // );
        // console.log("response of payout", responsePaymentTry.data);

        const notificationId = await createNotification({
          user: req.body.client,
          type: 0,
          message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con ${req.body.seller_name}`,
        });

        io.to(getSocketId_connected(req.body.client)).emit("addNotification", {
          _id: notificationId,
          message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con ${req.body.seller_name}`,
        });

        const notificationSellerId = await createNotification({
          user: req.body.seller,
          type: 0,
          message: `${req.body.client_name} contrató tus servicios, envíale un mensaje`,
        });

        io.to(getSocketId_connected(req.body.seller)).emit("addNotification", {
          _id: notificationSellerId,
          message: `${req.body.client_name} contrató tus servicios, envíale un mensaje`,
        });

        return res.status(201);
      }
    } catch (error) {
      console.log(error);

      next(error?.response?.data);
    }
  },

  newTransactionCreditCard: async (req, res, next) => {
    try {
      const { amount, currency } = req.body;
      // console.log(amount);

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
            price_data: {
              product_data: { name: "Tarot", description: "Servicio de tarot" },
              currency: currency,
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        // success_url: `${YOUR_DOMAIN}?success=true`,
        // cancel_url: `${YOUR_DOMAIN}?canceled=true`,
        success_url: `https://example.com/success/cc`,
        cancel_url: `https://example.com/canceled/cc`,
      });
      // console.log(session);
      const approvalUrl = session.url;
      return res.json({ approvalUrl });
    } catch (error) {
      next(error);
    }

    // res.redirect(303, session.url);
  },
  registerSuccesTransactionCreditCard: async (req, res, next) => {
    
    try {
      const transaction = await Transaction.create({...req.body,paypal_id:"credit_card"});
      const notificationId = await createNotification({
        user: req.body.client,
        type: 0,
        message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con ${req.body.seller_name}`,
      });
      
      io.to(getSocketId_connected(req.body.client)).emit("addNotification", {
        _id: notificationId,
        message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con ${req.body.seller_name}`,
      });
      
      const notificationSellerId = await createNotification({
        user: req.body.seller,
        type: 0,
        message: `${req.body.client_name} contrató tus servicios, envíale un mensaje`,
      });
      
      io.to(getSocketId_connected(req.body.seller)).emit("addNotification", {
        _id: notificationSellerId,
        message: `${req.body.client_name} contrató tus servicios, envíale un mensaje`,
      });
      console.log('Pago registrado');
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
      next(error.message);
    }
  },
};
