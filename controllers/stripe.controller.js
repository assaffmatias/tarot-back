const { Transaction, User, Payout, Payment } = require("../models");
const axios = require("axios");
require("dotenv").config();
const STRIPE_WHSEC = process.env.STRIPE_WHSEC;
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const { createNotification } = require("./notification.controller");
const {
  io,
  getSocketId_connected,
} = require("../config/socket.js");

const COMISION = process.env.COMISION;

async function fulfillCheckout(sessionId) {
  // Set your secret key. Remember to switch to your live secret key in production.
  // See your keys here: https://dashboard.stripe.com/apikeys
//   const stripe = require("stripe")(
//     "sk_test_51QJj9TGonenHpml29DOOLWF7Cwj6YbaXNkJzPnRxqLcet2ZUB9UxzZtBu1BBeVHFyBUwZVOpdM7mDJuDA3IthM95007pEP97xE"
//   );

  console.log("Fulfilling Checkout Session " + sessionId);

  // TODO: Make this function safe to run multiple times,
  // even concurrently, with the same session ID

  // TODO: Make sure fulfillment hasn't already been
  // peformed for this Checkout Session
  const payment = await Payment.findOne({paymentId: sessionId}).exec();
  if(payment == null) 
    return res.status(403).send(`Payment not found.`);
  
  payment.status = "payed";
  const transaction = await Transaction.findOne({payment:payment._id}).exec();
  let message="mensaje default";
  if(payment.type === "hire") {
    //hired minutes
    const hiredMinutes =  payment.quantity;
    const hiredUntil = new Date();
    hiredUntil.setSeconds(hiredUntil.getSeconds() + 15); //Add 15 seconds because of processing time.
    hiredUntil.setMinutes(hiredUntil.getMinutes() + parseInt(hiredMinutes));
    payment.hiredUntil = hiredUntil;
    await payment.save();

  }else if(payment.type === "coins") {
    //add coins
    const coins =  payment.quantity;
    const user = await User.findById(transaction.client).exec();
    console.log(user);
    
    user.chatCoins += coins;
    await user.save();
  }
  
  //Guardo en db que se debe pagar al tarot user
  const paymentValue = payment.price * (1-(COMISION/100));
  const payout = await Payout.create({
    user: transaction.seller,
    payed: false,
    amount: paymentValue,
    transaction: transaction._id,
  });


 
  //Notificacion handler
  if(payment.type === "hire") {
    //Notificacion al cliente
    const notificationId = await createNotification({
      user: transaction.client,
      type: 0,
      message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con ${transaction.seller}`,
    });
    io.to(getSocketId_connected(transaction.client.valueOf())).emit("addNotification", {
      _id: notificationId,
      message: `Tu pago fué exitoso, ahora puedes iniciar una conversación con ${transaction.seller}`,
    });
    
    //Notificacion al vendedor
    const notificationSellerId = await createNotification({
      user: transaction.seller,
      type: 0,
      message: `${transaction.client} contrató tus servicios, envíale un mensaje`,
    });
    
    io.to(getSocketId_connected(transaction.seller.valueOf())).emit("addNotification", {
      _id: notificationSellerId,
      message: `${transaction.client} contrató tus servicios, envíale un mensaje`,
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
  console.log(`Payment with paymentId ${sessionId} fullfiled!`);


  //Pago al tarotista
  // const paymentValue = price * (1-(COMISION/100));
  //     const payout = await Payout.create({
  //       user: tarotUser._id,
  //       payed: false,
  //       amount: paymentValue,
  //       transaction: transaction._id,
  //     });
    //************************************SEND MESSAGE TO USER AND ADD NOTIFICATION.



  // Retrieve the Checkout Session from the API with line_items expanded
  // const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
  //   expand: ["line_items"],
  // });

  // Check the Checkout Session's payment_status property
  // to determine if fulfillment should be peformed
  // if (checkoutSession.payment_status !== "unpaid") {
  //   // TODO: Perform fulfillment of the line items
  //   // TODO: Record/save fulfillment status for this
  //   // Checkout Session
  // }
}

module.exports = {
  eventHandler: async (req, res, next) => {
    const payload = req.body;
    const sig = req.headers["stripe-signature"];
    
    let event;

    try {
        event = stripe.webhooks.constructEvent(payload, sig, STRIPE_WHSEC);
    } catch (err) {
      console.error(`Error with webhook: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (
        event.type === 'checkout.session.completed'
        || event.type === 'checkout.session.async_payment_succeeded'
      ) {
        fulfillCheckout(event.data.object.id);
      }
    
      res.status(200).end();
  },
};
