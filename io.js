const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://vimetop.ru',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

module.exports = {
  io,
  server,
  app,
};
