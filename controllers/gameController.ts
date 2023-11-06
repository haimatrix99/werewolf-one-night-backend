import { Role } from "../lib/enums";
import { User, Game } from "../lib/types";
import {
  updateUserAction,
  updateUserRole,
  updateUserVoted,
} from "./userController";

const games: Game[] = [];

const addGame = (
  code: string,
  players: User[],
  threeRemainCard: Role[],
  discussTime: number
) => {
  code = code.trim();

  const game = {
    code,
    players,
    threeRemainCard,
    discussTime,
    isEnded: false,
  };
  games.push(game);
  return game;
};

const removeGame = (code: string): Game | undefined => {
  const index = games.findIndex((game) => game.code === code);
  if (index !== -1) return games.splice(index, 1)[0];
};

const getGame = (code: string): Game | undefined => {
  return games.find((game) => game.code === code);
};

const updateRoleGameWithPlayer = (
  code: string,
  player1: User,
  player2: User,
  currentUser: User
): Game | undefined => {
  const game = getGame(code);
  removeGame(code);
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

    games.push({
      ...game,
      players,
    });
    return {
      ...game,
      players,
    };
  }
};

const updateRoleGameWithCard = (
  code: string,
  player: User,
  index: number
): Game | undefined => {
  const game = getGame(code);
  removeGame(code);
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
    games.push({
      ...game,
      players,
      threeRemainCard,
    });
    return {
      ...game,
      players,
      threeRemainCard,
    };
  }
};

const updateStatusAction = (code: string, player: User): Game | undefined => {
  const game = getGame(code);
  removeGame(code);
  if (game) {
    const userUpdate = updateUserAction(player);
    const players = game.players.map((player) => {
      if (player.name === userUpdate.name) {
        return userUpdate;
      }
      return player;
    });
    games.push({ ...game, players });
    return {
      ...game,
      players,
    };
  }
};

const updateStatusVoted = (
  code: string,
  currentUser: User,
  name: string
): Game | undefined => {
  const game = getGame(code);
  removeGame(code);
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
    games.push({ ...game, players, isEnded });
    return {
      ...game,
      players,
      isEnded,
    };
  }
};

export {
  addGame,
  getGame,
  removeGame,
  updateRoleGameWithPlayer,
  updateRoleGameWithCard,
  updateStatusAction,
  updateStatusVoted,
};
