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
import { InternalWebSocket } from "./lib/internal-ws";
import { logger } from "./lib/logger";
import { register, requestDuration } from "./lib/metrics";
import { ChatRepository } from "./repositories/chat.repository";
import { ConnectionManager } from "./connections/manager";
import { OpenMeteoWeatherService } from "./services/weather/openmeteo";

const connectionManager = new ConnectionManager();

const app = express();
const PORT = process.env.PORT ?? "3000";

app.use(cors());
app.use(express.json());
app.use(helmet());

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on("finish", () => {
    end({ method: req.method, route: req.path });
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

const server = app.listen(PORT, () => logger.info("server running"));

const wss = new Server({ server });
wss.on("connection", async (ws) => {
  const connectionId = randomUUID();
  const internalWebSocket = new InternalWebSocket(ws);
  const chatRepo = new ChatRepository();
  const weatherService = new OpenMeteoWeatherService()

  const flowManager = await handleNewConnection(internalWebSocket, { chatRepo, weatherService });

  connectionManager.addConnection(connectionId, {
    ws: internalWebSocket,
    weatherService,
    flowManager,
    chatRepo,
  });

  logger.info(
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
    logger.info(
      `Connection closed (${connectionId}). Total connections: ${connectionManager.getConnectionsCount()}`
    );
  });

  ws.on("error", (error) => {
    logger.error(`WebSocket error on connection ${connectionId}:`, error);
    connectionManager.removeConnection(connectionId);
  });
});
