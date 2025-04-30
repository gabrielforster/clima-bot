
import { randomUUID } from "node:crypto";
import { Router } from "express";
import { RawData } from "ws";
import { InternalWebSocket } from "../../lib/internal-ws";
import { messageSchema } from "../schemas/message";
import { ChatRepository } from "../repositories/chat.repository";
import { FlowManager } from "../flows/flow-manager";
import {
  mainFlowSteps,
  weatherFlowSteps,
  exitFlowSteps,
  handleInvalidMessage,
} from "../flows/steps";
import { WeatherService } from "../services/weather/interface";

export const chatController = Router();

export async function handleWebSocketMessage(
  ws: InternalWebSocket,
  data: RawData,
  { chatRepo, flowManager }: { chatRepo: ChatRepository; flowManager: FlowManager }
) {
  try {
    const msgString = data.toString();
    const parsedMessage = JSON.parse(msgString);
    const message = messageSchema.parse(parsedMessage);

    const fullMessage = chatRepo.addMessage(message, "user");

    await flowManager.handleMessage(fullMessage);
  } catch (err) {
    console.error("Error handling message:", err);
    await ws.sendMessage({ type: "error", content: "Invalid message format" });
  }
}

export async function handleNewConnection(
  ws: InternalWebSocket,
  { chatRepo, weatherService }: { chatRepo: ChatRepository, weatherService: WeatherService }
) {
  const connectionId = randomUUID();

  const flowManager = new FlowManager(
    {
      ws,
      chatRepo,
      weatherService,
      currentFlow: "mainFlow",
      connectionId,
    },
    handleInvalidMessage
  );

  flowManager.registerFlow("mainFlow", mainFlowSteps);
  flowManager.registerFlow("weatherFlow", weatherFlowSteps);
  flowManager.registerFlow("exitFlow", exitFlowSteps);

  const welcomeMsg = chatRepo.addMessage(
    { type: "text", content: "Boas vindas ao chat!" },
    "system"
  );
  await ws.sendMessage(welcomeMsg);

  await flowManager.startFlow("mainFlow");

  return flowManager;
}
