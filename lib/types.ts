import { FieldValue } from "firebase/firestore";
import { Role } from "./enums";

type GameSetup = {
  numbers: number[];
  discussTime: string;
  timestamp: FieldValue;
};

type Game = {
  players: User[];
  threeRemainCard: Role[];
  discussTime: string;
  isEnded: boolean;
  timestamp: FieldValue;
};

type User = {
  id: string;
  name: string;
  code: string;
  master: boolean;
  voted?: string;
  role?: Role;
  firstRole?: Role;
  doppelgangerRole?: Role;
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
