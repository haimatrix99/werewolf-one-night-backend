import { Role } from "../lib/enums";
import { User } from "../lib/types";
import { updateUserAction, updateUserRole } from "./userController";

type Game = {
  code: string;
  rolesPlayer: User[];
  threeRemainCard: Role[];
};

const games: Game[] = [];

const addGame = (
  code: string,
  rolesPlayer: User[],
  threeRemainCard: Role[]
) => {
  code = code.trim().toLowerCase();

  const game = { code, rolesPlayer, threeRemainCard };
  games.push(game);
  return game;
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
  if (game) {
    const player1Role = updateUserRole(player1, player2.role);
    const player2Role = updateUserRole(player2, player1.role);

    const rolesPlayer = game.rolesPlayer.map((user) => {
      if (
        user.name === player1Role.name &&
        currentUser.name === player1Role.name
      ) {
        return {
          ...player1Role,
          action: true,
        };
      }
      if (
        user.name === player1Role.name &&
        currentUser.name !== player1Role.name
      ) {
        return player1Role;
      }

      if (user.name === player2Role.name) {
        return player2Role;
      }

      if (currentUser.name === user.name) {
        return {
          ...user,
          action: true,
        };
      }

      return user;
    });

    return {
      ...game,
      rolesPlayer,
    };
  }
};

const updateRoleGameWithCard = (
  code: string,
  player: User,
  index: number
): Game | undefined => {
  const game = getGame(code);
  if (game) {
    const updatePlayerAction = {
      ...player,
      action: true,
    };
    const playerRole = updateUserRole(
      updatePlayerAction,
      game.threeRemainCard[index]
    );
    game.threeRemainCard[index] = player.role as Role;
    const rolesPlayer = game.rolesPlayer.map((user) => {
      if (user.name === playerRole.name) {
        return playerRole;
      }
      return user;
    });
    return {
      ...game,
      rolesPlayer,
    };
  }
};

const updateStatusAction = (code: string, player: User): Game | undefined => {
  const game = getGame(code);
  if (game) {
    const userUpdate = updateUserAction(player);
    const rolesPlayer = game.rolesPlayer.map((user) => {
      if (user.name === userUpdate.name) {
        return userUpdate;
      }
      return user;
    });
    return {
      ...game,
      rolesPlayer,
    };
  }
};

export {
  addGame,
  getGame,
  updateRoleGameWithPlayer,
  updateRoleGameWithCard,
  updateStatusAction,
};
