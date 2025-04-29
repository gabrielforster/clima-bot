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
    await ws.sendMessage({ error: "Invalid message format" });
  }
}

export async function handleNewConnection(
  ws: InternalWebSocket,
  { chatRepo }: { chatRepo: ChatRepository }
) {
  const flowManager = new FlowManager(
    {
      ws,
      chatRepo,
      currentFlow: "mainFlow",
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

  await flowManager.handleMessage(welcomeMsg);

  return flowManager;
}

