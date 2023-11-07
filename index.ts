import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Server as SocketIO } from "socket.io";
import http from "http";
import cors from "cors";
import {
  addUser,
  getUser,
  getUsersInRoom,
  removeAllUsersInRoom,
  removeUser,
} from "./controllers/userController";

import {
  addGame,
  getGame,
  getGameSetup,
  removeGame,
  updateGameSetup,
  updateRoleGameWithCard,
  updateRoleGameWithPlayer,
  updateStatusAction,
  updateStatusVoted,
} from "./controllers/gameController";
import router from "./routers/audio";

const PORT = process.env.PORT || 5000;
const REACT_ENDPOINT = process.env.REACT_ENDPOINT || "http://localhost:3000";

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors());
app.use(router);

const io = new SocketIO(server, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  path: "/api/socket/io",
  addTrailingSlash: false,
  cors: {
    origin: REACT_ENDPOINT,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("create-room", ({ name, code }) => {
    const user = addUser({ id: socket.id, name, code, master: true });
    socket.join(user.code);
    io.to(user.code).emit("users-online", {
      users: getUsersInRoom(user.code),
    });
  });
  socket.on("join", ({ name, code }, callback) => {
    const user = addUser({ id: socket.id, name, code, master: false });
    if (user.error) return callback(user.error);
    socket.join(user.code);
    socket.broadcast
      .to(user.code)
      .emit("message", { user: "", text: `${user.name} has joined the room` });
    io.to(user.code).emit("users-online", {
      users: getUsersInRoom(user.code),
    });
    const { numbers, discussTime } = getGameSetup(user.code);
    io.to(user.code).emit("game-setup", {
      code: user.code,
      numbers,
      discussTime,
    });
  });
  socket.on("user-message", (payload, callBack) => {
    const user = getUser(socket.id, payload.code);
    if (user) {
      io.to(user.code).emit("message", {
        user: user.name,
        text: payload.message,
      });
      callBack();
    }
  });
  socket.on("game", (payload) => {
    const user = getUser(socket.id, payload.code);
    if (user) {
      io.to(user.code).emit("start-game", {
        startGame: true,
      });
      addGame(
        user.code,
        payload.players,
        payload.threeRemainCard,
        payload.discussTime
      );
    }
  });

  socket.on("get-game-info", (payload) => {
    const game = getGame(payload.code);
    if (game) {
      const user = getUser(socket.id, payload.code);
      if (user) {
        io.to(user.code).emit("game-info", {
          game,
        });
      }
    }
  });

  socket.on("update-role-player", (payload) => {
    const game = updateRoleGameWithPlayer(
      payload.code,
      payload.player1,
      payload.player2,
      payload.currentUser
    );
    if (game) {
      const user = getUser(socket.id, payload.code);
      if (user) {
        io.to(user.code).emit("game-info", {
          game,
        });
      }
    }
  });

  socket.on("update-role-card", (payload) => {
    const game = updateRoleGameWithCard(
      payload.code,
      payload.player,
      payload.index
    );
    if (game) {
      const user = getUser(socket.id, payload.code);
      if (user) {
        io.to(user.code).emit("game-info", {
          game,
        });
      }
    }
  });

  socket.on("update-status-action", (payload) => {
    const game = updateStatusAction(payload.code, payload.user);
    if (game) {
      const user = getUser(socket.id, payload.code);
      if (user) {
        io.to(user.code).emit("game-info", {
          game,
        });
      }
    }
  });

  socket.on("update-status-voted", (payload) => {
    const game = updateStatusVoted(
      payload.code,
      payload.currentUser,
      payload.name
    );
    if (game) {
      const user = getUser(socket.id, payload.code);
      if (user) {
        io.to(user.code).emit("game-info", {
          game,
        });
      }
    }
  });

  socket.on("get-game-setup", (payload) => {
    updateGameSetup(payload.code, payload.numbers, payload.discussTime);
    const user = getUser(socket.id, payload.code);
    if (user) {
      io.to(user.code).emit("game-setup", payload);
    }
  });

  socket.on("restart-game", (payload) => {
    removeGame(payload.code);
    removeAllUsersInRoom(payload.code);
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.code).emit("message", {
        user: "",
        text: `${user.name} left the chat`,
      });
      io.to(user.code).emit("users-online", {
        users: getUsersInRoom(user.code),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
