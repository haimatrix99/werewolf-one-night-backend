import { Role } from "../lib/enums";
import { User } from "../lib/types";

const users: User[] = [];

const addUser = ({
  id,
  name,
  code,
  master,
}: {
  id: string;
  name: string;
  code: string;
  master: boolean;
}): User => {
  name = name.trim().toLowerCase();
  code = code.trim().toLowerCase();

  const existingUser = users.find(
    (user) => user.code === code && user.name === name
  );

  if (existingUser) return { id, name, code, master, error: "Username is taken." };

  const user = { id, name, code, master };
  users.push(user);
  return user;
};

const removeUser = (id: string): User | undefined => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
};

const getUser = (id: string): User | undefined => {
  return users.find((user) => user.id === id);
};

const getUsersInRoom = (code: string): User[] => {
  return users.filter((user) => user.code === code);
};

const updateUserRole = (user: User, role: Role | undefined): User => {
  const updateUser = {
    ...user,
    role,
  }
  return updateUser
};

const updateUserAction = (user: User) => {
  const updateUser = {
    ...user,
    action: true
  }
  return updateUser
}

export { addUser, removeUser, getUser, getUsersInRoom, updateUserRole, updateUserAction };
