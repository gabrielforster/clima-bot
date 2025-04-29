import { randomUUID } from "node:crypto";
import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import { Server } from "ws";

import {
  chatController,
  handleNewConnection,
  handleWebSocketMessage,
} from "./controllers/chat.controller";
import { InternalWebSocket } from "../lib/internal-ws";
import { ChatRepository } from "./repositories/chat.repository";
import { ConnectionManager } from "./connections/manager";

const connectionManager = new ConnectionManager();

const app = express();
const PORT = process.env.PORT ?? "3000";

app.use(cors());
app.use(express.json());
app.use(helmet());

app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    message: "Server is healthy",
    connections: connectionManager.getConnectionsCount(),
  });
});

app.use("/chat", chatController);
app.get("/connections", (req, res) => {
  const connections = connectionManager.getAllConnections().map((conn) => ({
    currentFlow: conn.flowManager.getCurrentFlow(),
    messagesCount: conn.chatRepo.getMessages().length,
  }));

  return res.json({
    totalConnections: connectionManager.getConnectionsCount(),
    connections,
  });
});

const server = app.listen(PORT, () => console.info("server running"));

const wss = new Server({ server });
wss.on("connection", async (ws) => {
  const connectionId = randomUUID();
  const internalWebSocket = new InternalWebSocket(ws);
  const chatRepo = new ChatRepository();

  const flowManager = await handleNewConnection(internalWebSocket, { chatRepo });

  connectionManager.addConnection(connectionId, {
    ws: internalWebSocket,
    flowManager,
    chatRepo,
  });

  console.info(
    `New connection established (${connectionId}). Total connections: ${connectionManager.getConnectionsCount()}`
  );

  ws.on("message", (message) => {
    const connection = connectionManager.getConnection(connectionId);
    if (connection) {
      handleWebSocketMessage(connection.ws, message, {
        chatRepo: connection.chatRepo,
        flowManager: connection.flowManager,
      });
    }
  });

  ws.on("close", () => {
    connectionManager.removeConnection(connectionId);
    console.info(
      `Connection closed (${connectionId}). Total connections: ${connectionManager.getConnectionsCount()}`
    );
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error on connection ${connectionId}:`, error);
    connectionManager.removeConnection(connectionId);
  });
});
