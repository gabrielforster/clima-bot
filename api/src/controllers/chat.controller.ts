
import { Router } from "express";
import { RawData, WebSocket } from "ws"
import { z } from "zod"
import { InternalWebSocket } from "../../lib/internal-ws";

const messageSchema = z.object({
  type: z.enum(["text", "answer"]),
  answeringId: z.string().optional(),
  content: z.string(),
});
type Message = z.infer<typeof messageSchema>;

export const chatController = Router();

chatController.get("/", (req, res) => {
  return res.status(200).json({ data: [] });
})

export async function handleWebSocketMessage (ws: InternalWebSocket, data: RawData) {
  let message: Message
  try {
    const msgString = data.toString()
    const parsedMessage = JSON.parse(msgString)
    message = messageSchema.parse(parsedMessage)
  } catch (err) {
    console.error("Error parsing message:", err)
    return ws.sendMessage({ error: "Invalid message format" })
  }

  if (message.type === "text") {
    ws.sendMessage({ type: "text", content: `message received: ${message.content}`, from: "system" })
  } else if (message.type === "answer") {
    if (!message.answeringId) {
      return ws.sendMessage({ error: "answeringId is required" })
    }
  } else {
    return ws.sendMessage({ error: "Unknown message type" })
  }
}
