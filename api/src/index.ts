
import express, { Request, Response } from "express"
import helmet from "helmet"
import cors from "cors"
import { Server } from "ws"

import { chatController, handleNewConnection, handleWebSocketMessage } from "./controllers/chat.controller"
import { InternalWebSocket } from "../lib/internal-ws"
import { ChatRepository } from "./repositories/chat.repository"

let connection: InternalWebSocket | null = null
const chatRepo = new ChatRepository()

const app = express()
const PORT = process.env.PORT ?? "3000"

app.use(cors())
app.use(express.json())
app.use(helmet())

app.use((req: Request, res: Response, next) => {
  const start = Date.now()
  res.on("finish", () => {
    const duration = Date.now() - start
    console.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`)
  })
  next()
})

app.get("/health", (req, res) => {
  return res.status(200).json({ status: "ok", message: "Server is healthy" })
})

app.use("/chat", chatController)

const server = app.listen(PORT, () => console.info("server running"))

const wss = new Server({ server })
wss.on("connection", async (ws) => {
  if (connection && connection.ws.readyState === ws.OPEN) {
    console.warn("WebSocket connection already open, closing new connection");
    ws.close(3001, "connection_already_open");
    return;
  }

  const internalWebSocket = new InternalWebSocket(ws);
  connection = internalWebSocket;

  const flowManager = await handleNewConnection(connection, { chatRepo });

  ws.on("message", (message) =>
    handleWebSocketMessage(connection!, message, { chatRepo, flowManager })
  );

  ws.on("close", () => {
    connection?.ws.close();
    connection = null;
    console.info("WebSocket connection closed");
  });
});
