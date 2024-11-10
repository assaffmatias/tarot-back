const { Transaction, User } = require("../models");
const axios = require("axios");
require("dotenv").config();

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
      console.log("payment is: ", payment);
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
      console.log("capture:", captureResponse);

      //**Pago al tarot user
      //****Encuentro el email para pagar
      const tarotUser = await User.findOne({ _id: seller });
      //****Calculo el pago
      const paymentValue = price * 0.85; // 85% del precio | 15% para el admin
      //****Realizo el pago

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
              receiver: "sb-cjlzf33918318@personal.example.com",
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

      console.log("linkardopolis",response.data.links[0].href);

      const responsePaymentTry = await axios.get(
        response.data.links[0].href,
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        }
      );
      console.log("response of payout", responsePaymentTry.data);

      const create = await Transaction.create(req.body);
      create.save();

      res.status(201);
    } catch (error) {
      console.log(error);

      next(error?.response?.data);
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
