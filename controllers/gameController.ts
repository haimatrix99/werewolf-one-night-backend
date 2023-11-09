import { Role } from "../lib/enums";
import { User, Game, GameSetup } from "../lib/types";
import {
  updateUserAction,
  updateUserRole,
  updateUserVoted,
} from "./userController";

const games: Game = {};

const gameSetup: GameSetup = {};

const addGameSetup = (code: string) => {
  code = code.trim();
  gameSetup[code] = {
    numbers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    discussTime: "10",
  };
};

const updateGameSetup = (
  code: string,
  numbers: number[],
  discussTime: string
) => {
  gameSetup[code] = {
    numbers,
    discussTime,
  };
};

const getGameSetup = (
  code: string
): { numbers: number[]; discussTime: string } => {
  return gameSetup[code];
};

const isGameExist = (code: string) => {
  return gameSetup[code] ? true : false;
};

const addGame = (
  code: string,
  players: User[],
  threeRemainCard: Role[],
  discussTime: number
) => {
  code = code.trim();

  const game = {
    players,
    threeRemainCard,
    discussTime,
    isEnded: false,
  };
  games[code] = game;
  return game;
};

const removeGame = (code: string) => {
  delete games[code];
};

const getGame = (code: string) => {
  return games[code];
};

const updateRoleGameWithPlayer = (
  code: string,
  player1: User,
  player2: User,
  currentUser: User
) => {
  const game = getGame(code);
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

    games[code] = {
      ...game,
      players,
    };

    return {
      ...game,
      players,
    };
  }
};

const updateRoleGameWithCard = (code: string, player: User, index: number) => {
  const game = getGame(code);
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
    games[code] = {
      ...game,
      players,
      threeRemainCard,
    };
    return {
      ...game,
      players,
      threeRemainCard,
    };
  }
};

const updateStatusAction = (code: string, player: User) => {
  const game = getGame(code);
  if (game) {
    const userUpdate = updateUserAction(player);
    const players = game.players.map((player) => {
      if (player.name === userUpdate.name) {
        return userUpdate;
      }
      return player;
    });
    games[code] = { ...game, players };
    return {
      ...game,
      players,
    };
  }
};

const updateStatusVoted = (code: string, currentUser: User, name: string) => {
  const game = getGame(code);
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
    games[code] = { ...game, players, isEnded };
    return {
      ...game,
      players,
      isEnded,
    };
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
  updateStatusVoted,
};
