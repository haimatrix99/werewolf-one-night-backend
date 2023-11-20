import express, { Request, Response } from "express";
const audio = express.Router();
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { ConnectionDetailsBody } from "../lib/types";
import * as dotenv from "dotenv";
dotenv.config();

audio.post("/api/voice/connection", async (req: Request, res: Response) => {
  const { code, name } = req.body as ConnectionDetailsBody;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return res.status(500).json({ error: "Server misconfigured" });
  }
  if (!name) return res.status(400).json({ error: "Missing name" });
  if (!code) return res.status(400).json({ error: "Missing code" });
  const livekitHost = wsUrl?.replace("wss://", "https://");

  const at = new AccessToken(apiKey, apiSecret, { identity: name });
  const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);

  try {
    await roomService.getParticipant(code, name);
    return res.status(401).json({ error: "Username already exists in room" });
  } catch {
    // If participant doesn't exist, we can continue
  }

  at.addGrant({
    room: code,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  res.status(200).json({ token: at.toJwt(), ws_url: wsUrl });
});

export default audio;
