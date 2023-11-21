import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Role } from "../lib/enums";
import { User, Game, GameSetup } from "../lib/types";
import {
  updateUserAction,
  updateUserActionDoppelganger,
  updateUserRole,
  updateUserVoted,
} from "./userController";
import { fs } from "../db";

const addGameSetup = async (code: string) => {
  code = code.trim();
  try {
    await setDoc(doc(fs, "game-setup", code), {
      numbers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      discussTime: "10",
    });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

const updateGameSetup = async (
  code: string,
  numbers: number[],
  discussTime: string
) => {
  const gameSetupRef = doc(fs, "game-setup", code);
  await updateDoc(gameSetupRef, {
    numbers: numbers,
    discussTime: discussTime,
  });
};

const getGameSetup = async (code: string) => {
  const gameSetupRef = doc(fs, "game-setup", code);
  const gameSetup = await getDoc(gameSetupRef);
  return gameSetup.data() as GameSetup;
};

const isGameExist = async (code: string) => {
  const gameSetupRef = doc(fs, "game-setup", code);
  const gameSetup = await getDoc(gameSetupRef);
  return gameSetup.exists();
};

const addGame = async (
  code: string,
  players: User[],
  threeRemainCard: Role[],
  discussTime: string
) => {
  code = code.trim();

  try {
    await setDoc(doc(fs, "games", code), {
      players: players,
      threeRemainCard: threeRemainCard,
      discussTime: discussTime,
      isEnded: false,
    });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

const getGame = async (code: string) => {
  const gameRef = doc(fs, "games", code);
  const game = await getDoc(gameRef);
  if (game.data()) return game.data() as Game;
};

const removeGame = async (code: string) => {
  const gameRef = doc(fs, "games", code);
  await deleteDoc(gameRef);
};

const updateRoleGameWithPlayer = async (
  code: string,
  player1: User,
  player2: User,
  currentUser: User
) => {
  const game = await getGame(code);
  if (game) {
    const player1Role = updateUserRole(player1, player2.role);
    const player2Role = updateUserRole(player2, player1.role);

    const players = game.players.map((player) => {
      if (
        player.name === player1Role.name &&
        currentUser.name === player1Role.name
      ) {
        return {
          ...player1Role,
          action: true,
        };
      }

      if (
        player.name !== player1Role.name &&
        currentUser.name === player.name
      ) {
        return {
          ...player,
          action: true,
        };
      }

      if (player.name === player1Role.name) {
        return player1Role;
      }

      if (player.name === player2Role.name) {
        return player2Role;
      }

      return player;
    });
    const gameRef = doc(fs, "games", code);
    await updateDoc(gameRef, {
      players: players,
    });
  }
};

const updateRoleGameWithCard = async (
  code: string,
  player: User,
  index: number
) => {
  const game = await getGame(code);
  if (game) {
    const threeRemainCard = game.threeRemainCard;
    const updatePlayerAction = {
      ...player,
      action: true,
    };
    const playerRole = updateUserRole(
      updatePlayerAction,
      threeRemainCard[index]
    );
    threeRemainCard[index] = player.role as Role;
    const players = game.players.map((player) => {
      if (player.name === playerRole.name) {
        return playerRole;
      }
      return player;
    });
    const gameRef = doc(fs, "games", code);
    await updateDoc(gameRef, {
      players: players,
      threeRemainCard: threeRemainCard,
    });
  }
};

const updateStatusAction = async (code: string, player: User) => {
  const game = await getGame(code);
  if (game) {
    const userUpdate = updateUserAction(player);
    const players = game.players.map((player) => {
      if (player.name === userUpdate.name) {
        return userUpdate;
      }
      return player;
    });
    const gameRef = doc(fs, "games", code);
    await updateDoc(gameRef, {
      players: players,
    });
  }
};

const updateStatusActionDoppelganger = async (
  code: string,
  player: User,
  role: Role
) => {
  const game = await getGame(code);
  if (game) {
    const userUpdate = updateUserActionDoppelganger(player, role);
    const players = game.players.map((player) => {
      if (player.name === userUpdate.name) {
        return userUpdate;
      }
      return player;
    });
    const gameRef = doc(fs, "games", code);
    await updateDoc(gameRef, {
      players: players,
    });
  }
};

const updateStatusVoted = async (
  code: string,
  currentUser: User,
  name: string
) => {
  const game = await getGame(code);
  if (game) {
    const currentUserUpdate = updateUserVoted(currentUser, name);
    const players = game.players.map((player) => {
      if (player.name === currentUserUpdate.name) {
        return currentUserUpdate;
      }
      return player;
    });
    const playersVoted = players.filter((player) => player.voted !== undefined);
    const isEnded = playersVoted.length === players.length;
    const gameRef = doc(fs, "games", code);
    await updateDoc(gameRef, {
      players: players,
      isEnded: isEnded,
    });
  }
};

export {
  addGameSetup,
  isGameExist,
  updateGameSetup,
  getGameSetup,
  addGame,
  getGame,
  removeGame,
  updateRoleGameWithPlayer,
  updateRoleGameWithCard,
  updateStatusAction,
  updateStatusActionDoppelganger,
  updateStatusVoted,
};
