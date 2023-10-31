import { Role } from "./enums";

type User = {
  id: string;
  name: string;
  code: string;
  master: boolean;
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

export { User };
