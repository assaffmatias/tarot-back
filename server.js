const { conn, transporter } = require("./config");
const { join } = require("path");
const cors = require("cors");
const express = require("express");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const routes = require("./routes");

const { httpErrors, WSAuth } = require("./middlewares");
const { httpServer, app, io } = require("./config");

const {notification : notificationController } = require("./controllers");

class Server {
  constructor() {
    this.app = app;
    this.port = process.env.PORT;

    // DB connection
    this.conn = conn();

    // Emails
    // this.emailReady();

    // Middlewares
    this.middlewares();

    // Routes;
    this.routes();

    // Configura Socket.IO
    this.setupSockets();
  }

  middlewares() {
    this.app.use(cors({ origin: "*" }));

    this.app.use(express.json());

    this.app.use(
      fileUpload({
        createParentPath: true,
        useTempFiles: true,
        tempFileDir: "./uploads/temp",
        limits: { fileSize: 50 * 1024 * 1024 }, // 50mb
      })
    );

    this.app.use(express.static(join(__dirname, "public")));

    this.app.use("/app", express.static(join(__dirname, "dist")));

    this.app.use(morgan("tiny"));
  }

  routes() {
    Object.entries(routes).forEach(([key, value]) => {
      this.app.use(`/api/${key}`, value);
    });

    this.app.use(httpErrors);
  }

  emailReady() {
    transporter.verify((err) => {
      if (!err) {
        console.log("La aplicación está lista para enviar emails".bgGreen);
      } else {
        console.log("Node-mailer - error de configuración".bgRed);
      }
    });
  }

  setupSockets() {
    const userConnectedToApp = new Map();
    const userMap = new Map();
    io.use(WSAuth);

    io.on("connection", (socket) => {

      
      console.log(socket.id,"this is the socket", io.engine.clientsCount); //Count of connected clients


      socket.on("addUsersAppActive", (data) => {
        console.log('Usuario entro a la app', data.userId);

        
        socket.join(data.role) //Join room based on role
        userConnectedToApp.set(data.userId,data.id);
      });

      socket.on("addUsersActive", (data) => {
        console.log('Usuario entro a un chat', data.userId);        
        userMap.set(data.userId,data.id);
      });
      
      socket.on("deleteUsersActive", (data) => {

        socket.leave(data.role) //Join room based on role
        if(userMap.delete(data.userId))
          console.log('Usuario salio del chat', data.userId);
        

      });

      //Only for testing
      socket.on("sendNotification", async (data) => {
        try{
          // console.log('message received',data);
          const notificationId = await notificationController.createNotification({user:data.userId, type:0, message:data.message})
          console.log("socket id is: "+userConnectedToApp.get(data.userId), data);
          io.to(userConnectedToApp.get(data.userId)).emit("addNotification", {id: notificationId , message:data.message});
        }catch(error){
          console.error('Error al crear la notificación', error);
        }
      });

      socket.on("newMessage", async (data)=>{
        try{
        console.log("llegomensajebro",userMap.has(data.to))
        if(userMap.has(data.to))
          socket.to(userMap.get(data.to)).emit("receiveMessage", data.message)
        else{
          console.log('El usuario no está conectado', data.to);
          const message = `Tienes un chat pendiente con ${data.userName}`;
          //Anadir notificacion de mensaje pendiente en la base de datos
          const notificationId = await notificationController.createNotification({user:data.to, type:1,  sender:data.userId, message})
          //Anadir notificacion de mensaje pendiente en cliente
          io.to(userConnectedToApp.get(data.to)).emit("addNotification", {id: notificationId , message:"Tenes un chat pendiente", type:1});
        }
        }catch(error){
          console.error('Error al crear la notificación', error);
        }
      })
      
      //Cambiar estado de la notificacion
        socket.on("changePendingNotification", (data) => {
        // console.log('change pending notification',data);
        notificationController.changePendingNotification(data.id,data.value)
      })
      

    });
  }

  listen() {
    httpServer.listen(this.port, () =>
      console.log(`Your server is running on ${this.port}`.rainbow)
    );
  }
}

module.exports = Server;
