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

export { User };
