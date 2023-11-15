import { Role } from "./enums";

type GameSetup = {
  numbers: number[];
  discussTime: string;
};

type Game = {
  players: User[];
  threeRemainCard: Role[];
  discussTime: string;
  isEnded: boolean;
};

type User = {
  id: string;
  name: string;
  code: string;
  master: boolean;
  voted?: string;
  role?: Role;
  firstRole?: Role;
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
