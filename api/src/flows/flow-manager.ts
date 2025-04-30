
import { InternalWebSocket } from "../../lib/internal-ws";
import { ChatRepository } from "../repositories/chat.repository";
import { Message } from "../schemas/message";
import { WeatherService } from "../services/weather/interface";

export type FlowContext = {
  ws: InternalWebSocket;
  chatRepo: ChatRepository;
  weatherService: WeatherService;
  currentFlow: string;
  connectionId: string;
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
  ) { }

  registerFlow(name: string, steps: FlowStep[]) {
    this.flows[name] = steps;
  }

  getCurrentFlow() {
    return this.context.currentFlow;
  }

  async startFlow(flowName: string) {
    this.context.currentFlow = flowName;
    this.currentStepIndex = 1;
    const flow = this.flows[flowName];
    if (!flow) {
      throw new Error(`Flow ${flowName} not found`);
    }
    await flow[0].execute(this.context);
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
            await this.startFlow("weatherFlow");
            return;
          case "exit":
            await this.startFlow("exitFlow");
            return;
          default:
            await this.invalidMessageHandler(this.context);
            return;
        }
      }
    }

    const currentStep = currentFlow[this.currentStepIndex];
    if (!currentStep) {
      await this.invalidMessageHandler(this.context);
      return;
    }

    await currentStep.execute(this.context, message);
    this.currentStepIndex++;

    if (this.currentStepIndex >= currentFlow.length) {
      await this.startFlow("mainFlow");
    }
  }
}

