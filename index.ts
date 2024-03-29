import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Server as SocketIO } from "socket.io";
import cors from 'cors';
import http from "http";
import {
  addUser,
  getUser,
  getUserById,
  getUserRef,
  getUsersInRoom,
  removeUserByName,
  updateUserMaster,
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
  updateStatusActionDoppelganger,
  updateStatusVoted,
} from "./controllers/gameController";
import { postMessage } from "./controllers/messageController";
import audio from "./routers/audio";

const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors());
app.use(audio);

const io = new SocketIO(server, {
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
  path: "/api/socket/io",
  addTrailingSlash: false,
  cors: {
    origin: "*",
    methods: ["*"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("room:create", async ({ name, code }) => {
    await addGameSetup(code, name);
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
  socket.on("room:rejoin", async ({ name, code }) => {
    await addUser({ id: socket.id, name, code, master: false });
    socket.join(code);
    socket.broadcast.to(code).emit("room:message", {
      user: "",
      text: `${name} has rejoined the room`,
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
      payload.name,
      payload.players,
      payload.threeRemainCard,
      payload.discussTime
    );
  });

  socket.on("game:get:info", async (payload) => {
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", game);
    }
  });

  socket.on("game:patch:role-player", async (payload, callback) => {
    await updateRoleGameWithPlayer(
      payload.code,
      payload.player1,
      payload.player2,
      payload.currentUser
    ).then();
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", game);
      callback();
    }
  });

  socket.on("game:patch:role-card", async (payload) => {
    await updateRoleGameWithCard(payload.code, payload.player, payload.index);
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", game);
    }
  });

  socket.on("game:patch:status-action", async (payload) => {
    await updateStatusAction(payload.code, payload.user);
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", game);
    }
  });

  socket.on("game:patch:status-action-doppelganger", async (payload) => {
    await updateStatusActionDoppelganger(
      payload.code,
      payload.user,
      payload.role
    );
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", game);
    }
  });

  socket.on("game:patch:status-voted", async (payload) => {
    await updateStatusVoted(payload.code, payload.currentUser, payload.name);
    const game = await getGame(payload.code);
    if (game) {
      io.to(payload.code).emit("game:info", game);
    }
  });

  socket.on("game:patch:setup", async (payload) => {
    await updateGameSetup(payload.code, payload.numbers, payload.discussTime);
    io.to(payload.code).emit("game:get:setup", payload);
  });

  socket.on("game:restart", async (payload) => {
    await removeGame(payload.code);
  });

  socket.on("room:leave", async (payload) => {
    const user = await getUser(payload.code, payload.name);
    await removeUserByName(payload.code, payload.name);
    socket.leave(payload.code);
    io.to(payload.code).emit("room:message", {
      user: "",
      text: `${payload.name} left the chat`,
    });
    if (user) {
      const users = await getUsersInRoom(user.code);
      if (user.master && users && users.length > 0) {
        const nextUser = users[0];
        const nextUserRef = await getUserRef(nextUser.code, nextUser.name);
        if (nextUserRef) {
          await updateUserMaster(nextUserRef);
        }
        io.to(user.code).emit("room:message", {
          user: "",
          text: `${nextUser.name} is the room master now`,
        });
      }
    }
    io.to(payload.code).emit("room:users", {
      users: await getUsersInRoom(payload.code),
    });
  });

  socket.on("disconnect", async () => {
    const user = await getUserById(socket.id);
    if (user) {
      socket.leave(user.code);
      await removeUserByName(user.code, user.name);
      io.to(user.code).emit("room:message", {
        user: "",
        text: `${user.name} left the chat`,
      });
      const users = await getUsersInRoom(user.code);
      if (user.master && users && users.length > 0) {
        const nextUser = users[0];
        const nextUserRef = await getUserRef(nextUser.code, nextUser.name);
        if (nextUserRef) {
          await updateUserMaster(nextUserRef);
        }
        io.to(user.code).emit("room:message", {
          user: "",
          text: `${nextUser.name} is the room master now`,
        });
      }
      io.to(user.code).emit("room:users", {
        users: await getUsersInRoom(user.code),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
