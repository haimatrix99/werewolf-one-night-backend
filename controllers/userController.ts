import { Role } from "../lib/enums";
import { User } from "../lib/types";
import { isGameExist } from "./gameController";
import { fs } from "../db";
import {
  DocumentData,
  DocumentReference,
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

const usersRef = collection(fs, "users");

const addUser = async ({
  id,
  name,
  code,
  master,
}: {
  id: string;
  name: string;
  code: string;
  master: boolean;
}) => {
  name = name.trim();
  code = code.trim();

  const user = await getUser(code, name);
  if (user) {
    return "Username is taken.";
  }
  const gameExist = await isGameExist(code);
  if (!gameExist) return "Code is not be exist.";

  try {
    await addDoc(usersRef, {
      id: id,
      code: code,
      name: name,
      master: master,
    });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

const removeUserByName = async (code: string, name: string) => {
  const userRef = await getUserRef(code, name);
  if (userRef) {
    await deleteDoc(userRef);
  }
};

const getUserRef = async (code: string, name: string) => {
  const q = query(
    usersRef,
    where("code", "==", code),
    where("name", "==", name)
  );
  const querySnapshot = await getDocs(q);
  const userRef = querySnapshot.docs.map((doc) => {
    return doc.ref;
  });
  if (userRef) {
    return userRef[0];
  }
};

const updateUserMaster = async (userRef: DocumentReference<DocumentData, DocumentData>) => {
  await updateDoc(userRef, {
    master: true,
  });
};

const getUser = async (code: string, name: string) => {
  const q = query(
    usersRef,
    where("code", "==", code),
    where("name", "==", name)
  );
  const querySnapshot = await getDocs(q);
  const user = querySnapshot.docs.map((doc) => {
    return doc.data() as User;
  });
  if (user) {
    return user[0];
  }
};

const getUserById = async (id: string) => {
  const q = query(usersRef, where("id", "==", id));
  const querySnapshot = await getDocs(q);
  const user = querySnapshot.docs.map((doc) => {
    return doc.data() as User;
  });
  if (user) {
    return user[0];
  }
};

const getUsersInRoom = async (code: string) => {
  const q = query(usersRef, where("code", "==", code));
  const querySnapshot = await getDocs(q);
  const users = querySnapshot.docs.map((doc) => {
    return doc.data() as User;
  });
  if (users) {
    return users;
  }
};

const updateUserRole = (user: User, role: Role | undefined): User => {
  const updateUser = {
    ...user,
    role,
  };
  return updateUser;
};

const updateUserAction = (user: User) => {
  const updateUser = {
    ...user,
    action: true,
  };
  return updateUser;
};

const updateUserActionDoppelganger = (user: User, role: Role) => {
  const updateUser = {
    ...user,
    doppelgangerRole: role,
  };
  return updateUser;
};

const updateUserVoted = (currentUser: User, name: string) => {
  const updateUser = {
    ...currentUser,
    voted: name,
  };
  return updateUser;
};


export {
  addUser,
  removeUserByName,
  getUser,
  getUserById,
  getUserRef,
  getUsersInRoom,
  updateUserRole,
  updateUserAction,
  updateUserVoted,
  updateUserMaster,
  updateUserActionDoppelganger,
};
