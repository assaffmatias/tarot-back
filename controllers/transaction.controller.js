const { Transaction, User, Payout, Payment } = require("../models");
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
const COMISION = process.env.COMISION;

module.exports = {
  getTransactions: async (req, res, next) => {
    console.log('gsgsgs');
    
    req;
  },

  newTransaction: async (req, res, next) => {
    try {
      // console.log(req.body);
      
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
      const { amount, currency, client, seller, service, quantity, type } = req.body;

      // console.log('BODY:', req.body);

      const paymentData = {
        intent: "CAPTURE",
        purchase_units: [
          {
            items: [{name:type, quantity, unit_amount: { currency_code: currency, value: amount/quantity }}],
            amount: {
              breakdown:{item_total: { currency_code: currency, value: amount }},
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
      console.log(approvalUrl);
      
      return res.status(200).json({ approvalUrl });
    } catch (error) {
      // console.error(error);
      next(error?.response?.data);
    }
  },

  registerSuccesTransaction: async (req, res, next) => {
    // req.body = {
    //   client: '6733c336c1d06872252e844c',
    //   seller: '6733c336c1d06872252e844b',
    //   price: '375.00',
    //   service: '6733c336c1d06872252e8451',
    //   token: '44D94727XF080974X',
    //   paypal_id: 'Z5Q4LRQFVELFG'
    // }
    console.log(req.body);
    
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
      const { paypal_id, token, seller, price } = req.body;
      const userName = req.body.userName
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

      const {data: purchaseData} = await axios.get(
      captureResponse.links.find((link) => link.rel === "self").href,
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
      )
     console.log("purchase data:",purchaseData.purchase_units[0]);

      const paymentObj = {
        type : purchaseData.purchase_units[0].items[0].name, 
        price : purchaseData.purchase_units[0].amount.value, 
        quantity : purchaseData.purchase_units[0].items[0].quantity
       }
      paymentObj.status = "payed";
      paymentObj.paymentMethod = "paypal";
      paymentObj.paymentId = token;
      //Creo el pago exitoso
      if(paymentObj.type === "hire") {
        const hiredUntil = new Date();
        const hiredMinutes = paymentObj.quantity;
        hiredUntil.setMinutes(hiredUntil.getMinutes() + parseInt(hiredMinutes));
        paymentObj.hiredUntil = hiredUntil;
      }else if(paymentObj.type === "coins") {
        const coins =  paymentObj.quantity;
        const user = await User.findById(req.body.client).exec();
        console.log(user);
        user.chatCoins += parseInt(coins);
        await user.save();
      }
      const payment = await Payment.create(paymentObj);
      //Nueva transaccion con precio
      req.body.price = paymentObj.price
      //Guardo en la base en la transaccion
      console.log(req.body);
      
      const transaction = await Transaction.create({...req.body, payment: payment._id });

      console.log('TRANSACTION:', transaction);
      


      if(payment.type === "hire") {
        //Notificacion al cliente
        const notificationId = await createNotification({
          user: transaction.client,
          type: 0,
          message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con el tarotista`,
        });
        io.to(getSocketId_connected(transaction.client.valueOf())).emit("addNotification", {
          _id: notificationId,
          message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con el tarotista`,
        });
        
        //Notificacion al vendedor
        const notificationSellerId = await createNotification({
          user: transaction.seller,
          type: 0,
          message: `Alguien contrató tus servicios`,
        });
        
        io.to(getSocketId_connected(transaction.seller.valueOf())).emit("addNotification", {
          _id: notificationSellerId,
          message: `Alguien contrató tus servicios`,
          type: 0
        });
      }else if(payment.type === "coins") {
        const notificationId = await createNotification({
          user: transaction.client,
          type: 1,
          message: `Tu pago fué exitoso, tienes mas monedas en tu perfil!`,
        });
        io.to(getSocketId_connected(transaction.client.valueOf())).emit("addNotification", {
          _id: notificationId,
          message: `Tu pago fué exitoso, tienes mas monedas en tu perfil!`,
          type: 1,
        });
      } 
      console.log("el type es:",payment.type);
      if(payment.type === "hire") {
        //**Pago al tarot user
        //****Encuentro el email para pagar
        const tarotUser = await User.findOne({ _id: seller });
        //****Calculo el pago
        const paymentValue = price * (1-(COMISION/100));
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
        }
      }
        // const responsePaymentTry = await axios.get(
        //   response.data.links[0].href,
        //   {
        //     headers: {
        //       Authorization: `Bearer ${auth.access_token}`,
        //     },
        //   }
        // );
        // console.log("response of payout", responsePaymentTry.data);

        if(payment.type === "hire") {
          //Notificacion al cliente
          const notificationId = await createNotification({
            user: transaction.client,
            type: 0,
            message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con el tarotista`,
          });
          io.to(getSocketId_connected(transaction.client.valueOf())).emit("addNotification", {
            _id: notificationId,
            message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con el tarotista`,
          });
          
          //Notificacion al vendedor
          const notificationSellerId = await createNotification({
            user: transaction.seller,
            type: 0,
            message: `Alguien contrató tus servicios`,
          });
          
          io.to(getSocketId_connected(transaction.seller.valueOf())).emit("addNotification", {
            _id: notificationSellerId,
            message: `Alguien contrató tus servicios`,
            type: 0
          });
        }else if(payment.type === "coins") {
          console.log('creating notiff brooo');
          
          const notificationId = await createNotification({
            user: transaction.client,
            type: 1,
            message: `Tu pago fué exitoso, tienes mas monedas en tu perfil!`,
          });
          io.to(getSocketId_connected(transaction.client.valueOf())).emit("addNotification", {
            _id: notificationId,
            message: `Tu pago fué exitoso, tienes mas monedas en tu perfil!`,
            type: 1,
          });
        } 
        return res.status(201).send({ message: "El pago se ha realizado correctamente", transaction });

    }catch (error) {
      console.log(error);

      next(error?.response?.data);
    }
  },

  newTransactionCreditCard: async (req, res, next) => {
    try {
      // client: 
      // seller: 
      // price: 
      // service:
      // payment:
      
      const { amount, currency, quantity, type, client, seller, service } = req.body;
      const paymentValue = amount * (1-(COMISION/100));
      console.log(paymentValue,amount,COMISION);
      
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
            price_data: {
              product_data: { name: "Tarot", description: "Servicio de tarot", metadata:{type} },
              currency: currency,
              unit_amount: amount * 100,
            },
            quantity,
          },
        ],
        mode: "payment",
        // success_url: `${YOUR_DOMAIN}?success=true`,
        // cancel_url: `${YOUR_DOMAIN}?canceled=true`,
        success_url: `https://example.com/success/cc`,
        cancel_url: `https://example.com/canceled/cc`,
      });
      
      const payment = await Payment.create({price:amount, quantity, type, paymentMethod: "credit_card", paymentId:session.id });
      
      const transactionObj = {client,seller,price:amount,payment:payment._id, service:service};
      const transaction = await Transaction.create(transactionObj);
      const approvalUrl = session.url;
      console.log(approvalUrl);
      
      return res.json({ approvalUrl });
    } catch (error) {
      next(error);
    }

    // res.redirect(303, session.url);
  },

  findClientTransactions: async (req, res, next) => {
    try {
      const client = req.params.id;

      const transactions = await Transaction.find({ client })
        .populate("client")
        .populate("seller")
        .populate("service")
        .populate("messages")
        .populate("payment")
        .lean()
        .exec();

        if(transactions.length === 0)
          return res.status(202).send(transactions);

        const now = new Date();
        console.log(transactions);
        
        const find = transactions.filter((transaction) => {
          console.log(transaction);
          return transaction.payment.status === "payed" && transaction.payment.hiredUntil > now});
        console.log(find);

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
