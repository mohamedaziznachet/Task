// backend/socket.js
let ioInstance = null;

function initSocket(server) {
  const { Server } = require('socket.io');
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
  });

  ioInstance.on('connection', (socket) => {
    // Permet à chaque utilisateur connecté de rejoindre son canal personnel
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      // Nettoyage automatique par socket.io
    });
  });

  return ioInstance;
}

function getIO() {
  return ioInstance;
}

module.exports = { initSocket, getIO };
