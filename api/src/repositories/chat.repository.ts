import { randomUUID } from "node:crypto";
import { Message, messageSchema, SimpleMessage } from "../schemas/message";

export class ChatRepository {
  private messages: Message[] = [];

  constructor() {
    this.messages = [];
  }

  public addMessage(simpleMessage: SimpleMessage, from: "system" | "user"): Message {
    const message: Message = {
      ...simpleMessage,
      from,
      id: randomUUID(),
      createdAt: new Date(),
    }
    this.messages.push(message);
    return message;
  }

  public getMessages(): Message[] {
    return this.messages;
  }

  public getMessageById(id: string): Message | undefined {
    return this.messages.find((message) => message.id === id);
  }

  public clear () {
    this.messages = []
  }
}
