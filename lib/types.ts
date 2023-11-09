import { Role } from "./enums";

type GameSetup = {
  [key: string]: {
    numbers: number[];
    discussTime: string;
  };
};

type Game = {
  [key: string]: {
    players: User[];
    threeRemainCard: Role[];
    discussTime: number;
    isEnded: boolean;
  };
};

type User = {
  id: string;
  name: string;
  code: string;
  master: boolean;
  voted?: string;
  role?: Role;
  firstRole?: Role;
  error?: string;
  action?: boolean;
};

export type ConnectionDetailsBody = {
  code: string;
  name: string;
};

export type ConnectionDetails = {
  token: string;
  ws_url: string;
};

export { User, Game, GameSetup };
