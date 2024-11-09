const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const userConnectedToApp = new Map();
const userMap_inChat = new Map();
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {});

module.exports = {
  app,
  httpServer,
  io,
  getSocketId_connected: (userId) => userConnectedToApp.get(userId),
  setSocketId_connected: (userId, socketId) => userConnectedToApp.set(userId, socketId),
  removeSocketId_connected: (userId) => userConnectedToApp.delete(userId),
  getSocketId_inChat: (userId) => userMap_inChat.get(userId),
  setSocketId_inChat: (userId, socketId) => userMap_inChat.set(userId, socketId),
  removeSocketId_inChat: (userId) => userMap_inChat.delete(userId),
};
