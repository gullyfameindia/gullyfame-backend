// Real-time chat delivery. REST (/chat/sendChat etc.) remains the source of
// truth; this just pushes the same payloads to whichever socket room(s) the
// two participants are connected to, so the Chats screen updates live
// instead of only refreshing on next poll.
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const JWTSECRET = process.env.JWTSECRET;
let io = null;

const userRoom = (userId) => `user:${userId}`;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("invalid_token"));
      const payload = jwt.verify(token, JWTSECRET);
      socket.userId = payload.userId;
      next();
    } catch (ex) {
      next(new Error("invalid_token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.userId));
    console.log(`socket.js => user ${socket.userId} connected (${socket.id})`);

    socket.on("disconnect", () => {
      console.log(`socket.js => user ${socket.userId} disconnected`);
    });
  });

  return io;
};

const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
};

module.exports = { initSocket, emitToUser };
