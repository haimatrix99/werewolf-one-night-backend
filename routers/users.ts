import express, { Request, Response } from "express";
const users = express.Router();
import * as dotenv from "dotenv";
import { getUser, getUsersInRoom } from "../controllers/userController";
dotenv.config();


export default users;
