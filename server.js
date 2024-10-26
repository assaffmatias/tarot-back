const { conn, transporter } = require("./config");
const { join } = require("path");
const cors = require("cors");
const express = require("express");
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const routes = require("./routes");

const { httpErrors, WSAuth } = require("./middlewares");
const { httpServer, app, io } = require("./config");

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
    io.use(WSAuth);

    io.on("connection", (socket) => {
      if (socket.uid) socket.join(socket.uid);
    });
  }

  listen() {
    httpServer.listen(this.port, () =>
      console.log(`Your server is running on ${this.port}`.rainbow)
    );
  }
}

module.exports = Server;
