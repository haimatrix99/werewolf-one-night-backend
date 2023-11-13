import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Server as SocketIO } from "socket.io";
import http from "http";
import cors from "cors";
import {
  addUser,
  getUserById,
  getUsersInRoom,
  removeAllUsersInRoom,
  removeUserByName,
} from "./controllers/userController";

import {
  addGame,
  addGameSetup,
  getGame,
  getGameSetup,
  removeGame,
  updateGameSetup,
  updateRoleGameWithCard,
  updateRoleGameWithPlayer,
  updateStatusAction,
  updateStatusVoted,
} from "./controllers/gameController";
import { postMessage } from "./controllers/messageController";
import audio from "./routers/audio";
import users from "./routers/users";

const PORT = process.env.PORT || 5000;
const REACT_ENDPOINT = process.env.REACT_ENDPOINT || "http://localhost:3000";

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors());
app.use(audio);
app.use(users);

const io = new SocketIO(server, {
  pingInterval: 24 * 60 * 60 * 1000,
  pingTimeout: 3 * 24 * 60 * 60 * 1000,
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
  socket.on("room:create", async ({ name, code }) => {
    await addGameSetup(code);
    await addUser({ id: socket.id, name, code, master: true });
    socket.join(code);
    io.to(code).emit("room:users", {
      users: await getUsersInRoom(code),
    });
  });
  socket.on("room:join", async ({ name, code }, callback) => {
    const error = await addUser({ id: socket.id, name, code, master: false });
    if (error) return callback(error);
    socket.join(code);
    socket.broadcast.to(code).emit("room:message", {
      user: "",
      text: `${name} has joined the room`,
    });
    io.to(code).emit("room:users", {
      users: await getUsersInRoom(code),
    });
    const { numbers, discussTime } = await getGameSetup(code);
    io.to(code).emit("game:get:setup", {
      code,
      numbers,
      discussTime,
    });
  });
  socket.on("room:user-message", async (payload, callback) => {
    await postMessage(payload.code, payload.name, payload.message);
    io.to(payload.code).emit("room:message", {
      user: payload.name,
      text: payload.message,
    });
    callback();
  });
  socket.on("game:initial", async (payload) => {
    io.to(payload.code).emit("game:start", {
      startGame: true,
    });
    addGame(
      payload.code,
      payload.players,
      payload.threeRemainCard,
      payload.discussTime
    );
  });

  socket.on("game:get:info", async (payload) => {
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", {
        game,
      });
    }
  });

  socket.on("game:patch:role-player", async (payload) => {
    await updateRoleGameWithPlayer(
      payload.code,
      payload.player1,
      payload.player2,
      payload.currentUser
    );
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", {
        game,
      });
    }
  });

  socket.on("game:patch:role-card", async (payload) => {
    await updateRoleGameWithCard(payload.code, payload.player, payload.index);
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", {
        game,
      });
    }
  });

  socket.on("game:patch:status-action", async (payload) => {
    await updateStatusAction(payload.code, payload.user);
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", {
        game,
      });
    }
  });

  socket.on("game:patch:status-voted", async (payload) => {
    await updateStatusVoted(payload.code, payload.currentUser, payload.name);
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", {
        game,
      });
    }
  });

  socket.on("game:patch:setup", async (payload) => {
    await updateGameSetup(payload.code, payload.numbers, payload.discussTime);
    io.to(payload.code).emit("game:get:setup", payload);
  });

  socket.on("game:restart", (payload) => {
    removeGame(payload.code);
    removeAllUsersInRoom(payload.code);
  });

  socket.on("room:leave", async (payload) => {
    await removeUserByName(payload.code, payload.name);
    socket.leave(payload.code);
    io.to(payload.code).emit("room:message", {
      user: "",
      text: `${payload.name} left the chat`,
    });
    io.to(payload.code).emit("room:users", {
      users: await getUsersInRoom(payload.code),
    });
  });

  socket.on("disconnect", async (reason) => {
    const user = await getUserById(socket.id);
    if (user) {
      socket.leave(user.code);
      await removeUserByName(user.code, user.name);
      io.to(user.code).emit("room:message", {
        user: "",
        text: `${user.name} left the chat`,
      });
      io.to(user.code).emit("room:users", {
        users: await getUsersInRoom(user.code),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
