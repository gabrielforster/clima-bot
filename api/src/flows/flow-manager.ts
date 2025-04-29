
import { InternalWebSocket } from "../../lib/internal-ws";
import { ChatRepository } from "../repositories/chat.repository";
import { Message, SimpleMessage } from "../schemas/message";

export type FlowContext = {
  ws: InternalWebSocket;
  chatRepo: ChatRepository;
  currentFlow: string;
};

export type FlowStep = {
  execute: (context: FlowContext, message?: Message) => Promise<void>;
};

export class FlowManager {
  private flows: Record<string, FlowStep[]> = {};
  private currentStepIndex: number = 0;

  constructor(
    private context: FlowContext,
    private readonly invalidMessageHandler: (context: FlowContext) => Promise<void>
  ) {}

  registerFlow(name: string, steps: FlowStep[]) {
    this.flows[name] = steps;
  }

  async handleMessage(message: Message) {
    const currentFlow = this.flows[this.context.currentFlow];
    if (!currentFlow) {
      throw new Error(`Flow ${this.context.currentFlow} not found`);
    }

    if (message.type === "answer") {
      const answeredMessage = this.context.chatRepo
        .getMessages()
        .find((msg) => msg.id === message.answeringId);

      if (!answeredMessage) {
        await this.invalidMessageHandler(this.context);
        return;
      }

      if (answeredMessage.identifier === "menu") {
        switch (message.answerIdentifier) {
          case "clima":
            this.context.currentFlow = "weatherFlow";
            this.currentStepIndex = 0;
            break;
          case "exit":
            this.context.currentFlow = "exitFlow";
            this.currentStepIndex = 0;
            break;
          default:
            await this.invalidMessageHandler(this.context);
            return;
        }
      }
    }

    const currentStep = currentFlow[this.currentStepIndex];
    await currentStep.execute(this.context, message);
    this.currentStepIndex++;

    if (this.currentStepIndex >= currentFlow.length) {
      this.context.currentFlow = "mainFlow";
      this.currentStepIndex = 0;
      await this.flows["mainFlow"][0].execute(this.context);
    }
  }
}
