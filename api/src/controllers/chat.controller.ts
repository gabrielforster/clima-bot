
import { Router } from "express";
import { RawData } from "ws"
import { InternalWebSocket } from "../../lib/internal-ws";
import { Message, messageSchema, SimpleMessage } from "../schemas/message";
import { ChatRepository } from "../repositories/chat.repository";

export const chatController = Router();

const WELCOME_MESSAGE: SimpleMessage = {
  type: "text",
  content: "Boas vindas ao chat!",
}
const MENU_QUESTION: SimpleMessage = {
  identifier: "menu",
  type: "question",
  content: "O que você deseja de fazer?",
  answers: [
    { identifier: "clima", content: "Consultar clima" },
    { identifier: "exit", content: "Sair" },
  ],
}

const CITY_QUESTION: SimpleMessage = {
  identifier: "city-question",
  type: "question",
  content: "Qual cidade você deseja consultar?",
  answers: [],
}

const EXIT_MESSAGE: SimpleMessage = {
  type: "error",
  content: "Saindo do chat...",
}

chatController.get("/", (req, res) => {
  return res.status(200).json({ data: [] });
})

export async function handleWebSocketMessage (ws: InternalWebSocket, data: RawData, { chatRepo }: { chatRepo: ChatRepository }) {
  let message: SimpleMessage
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
    if (!message.answerIdentifier) {
      return ws.sendMessage({ error: "answerIdentifier is required" })
    }

    const currentMessages = chatRepo.getMessages()
    const answeredMessage = currentMessages.find((msg) => msg.id === message.answeringId)

    const newMessage: SimpleMessage = {
      type: "answer",
      content: message.content,
      answeringId: message.answeringId,
      answerIdentifier: message.answerIdentifier,
    }
    chatRepo.addMessage(newMessage, "user")

    if (answeredMessage !== undefined) {
      if (answeredMessage.identifier === "menu") {
        if (message.answerIdentifier === "clima") {
          const cityMessage = chatRepo.addMessage(CITY_QUESTION, "system")
          ws.sendMessage(cityMessage)
        } else if (message.answerIdentifier === "exit") {
          const exitMessage = chatRepo.addMessage(EXIT_MESSAGE, "system")
          ws.sendMessage(exitMessage)
        }
      } else if (answeredMessage.identifier === "city-question") {
        const responseMessage = chatRepo.addMessage({ type: "text", content: `Clima em ${message.content}: 25ºC, ensolarado` }, "system")
        ws.sendMessage(responseMessage)
      }
    }
  } else {
    return ws.sendMessage({ error: "Unknown message type" })
  }
}

export async function handleNewConnection (ws: InternalWebSocket, { chatRepo }: { chatRepo: ChatRepository }) {
  const message = chatRepo.addMessage(WELCOME_MESSAGE, "system")
  ws.sendMessage(message)
  const menuMessage = chatRepo.addMessage(MENU_QUESTION, "system")
  ws.sendMessage(menuMessage)
}
