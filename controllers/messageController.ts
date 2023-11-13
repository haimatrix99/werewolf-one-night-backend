import { addDoc, collection } from "firebase/firestore";
import { fs } from "../db";

const postMessage = async (code: string, name: string, message: string) => {
  try {
    await addDoc(collection(fs, "messages"), {
      code: code,
      name: name,
      message: message,
    });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

export { postMessage };
