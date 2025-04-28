
import { Router } from "express";

export const chatController = Router();

chatController.post("/message", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message_is_required_in_request_body" });
  }

  const response = `You said: ${message}`;

  return res.status(200).json({ response });
})
