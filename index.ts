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
  removeUser,
} from "./controllers/userController";

import {
  addGame,
  getGame,
  updateRoleGameWithCard,
  updateRoleGameWithPlayer,
  updateStatusAction,
} from "./controllers/gameController";

const PORT = process.env.PORT || 5000;
const REACT_ENDPOINT = process.env.REACT_ENDPOINT || "http://localhost:3000";

const app = express();
const server = http.createServer(app);
app.use(cors);

const io = new SocketIO(server, {
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
    socket.emit("message", {
      user: "",
      text: `Welcome ${user.name} in room ${user.code}.`,
    });
    io.to(user.code).emit("users-online", {
      users: getUsersInRoom(user.code),
    });
  });
  socket.on("join", ({ name, code }, callback) => {
    const user = addUser({ id: socket.id, name, code, master: false });
    if (user.error) return callback(user.error);
    socket.join(user.code);
    socket.emit("message", {
      user: "",
      text: `Welcome ${user.name} in room ${user.code}.`,
    });
    socket.broadcast
      .to(user.code)
      .emit("message", { user: "", text: `${user.name} has joined the room` });
    io.to(user.code).emit("users-online", {
      users: getUsersInRoom(user.code),
    });
  });
  socket.on("user-message", (message, callBack) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.code).emit("message", { user: user.name, text: message }); // send this message to the room
      callBack();
    }
  });
  socket.on("game", (payload) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.code).emit("start-game", {
        startGame: true,
      });
      addGame(user.code, payload.rolesPlayer, payload.threeRemainCard);
    }
  });

  socket.on("get-game-info", (payload) => {
    const game = getGame(payload.code);
    if (game) {
      const user = getUser(socket.id);
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
      const user = getUser(socket.id);
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
      const user = getUser(socket.id);
      if (user) {
        io.to(user.code).emit("game-info", {
          game,
        });
      }
    }
  });

  socket.on("update-status-action", (payload) => {
    const game = updateStatusAction(
      payload.code,
      payload.user,
    );
    if (game) {
      const user = getUser(socket.id);
      if (user) {
        io.to(user.code).emit("game-info", {
          game,
        });
      }
    }
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
