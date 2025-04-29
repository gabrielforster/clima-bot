
import { FlowContext, FlowStep } from "./flow-manager";
import { SimpleMessage } from "../schemas/message";
import { WeatherService } from "../services/weather";

const MESSAGES = {
  MENU: {
    identifier: "menu",
    type: "question",
    content: "O que você deseja fazer?",
    answers: [
      { identifier: "clima", content: "Consultar clima" },
      { identifier: "exit", content: "Sair" },
    ],
  } as SimpleMessage,

  CITY_QUESTION: {
    identifier: "city-question",
    type: "question",
    content: "Qual cidade você deseja consultar?",
    answers: [],
  } as SimpleMessage,

  INVALID_OPTION: {
    type: "error",
    content: "Opção inválida! Por favor, escolha uma opção válida.",
  } as SimpleMessage,

  EXIT: {
    type: "text",
    content: "Certo! Até mais!",
  } as SimpleMessage,
};

export const mainFlowSteps: FlowStep[] = [
  {
    async execute(context) {
      const menuMsg = context.chatRepo.addMessage(MESSAGES.MENU, "system");
      await context.ws.sendMessage(menuMsg);
    },
  },
];

export const weatherFlowSteps: FlowStep[] = [
  {
    async execute(context) {
      const cityQuestion = context.chatRepo.addMessage(
        MESSAGES.CITY_QUESTION,
        "system"
      );
      await context.ws.sendMessage(cityQuestion);
    },
  },
  {
    async execute(context, message) {
      if (!message) return;

      const weatherService = new WeatherService();
      const weather = await weatherService.getWeather(message.content);

      if (!weather) {
        const errorMsg = context.chatRepo.addMessage(
          {
            type: "error",
            content: "Não foi possível obter o clima para esta cidade.",
          },
          "system"
        );
        await context.ws.sendMessage(errorMsg);
        return;
      }

      const weatherMsg = context.chatRepo.addMessage(
        {
          type: "text",
          content: `Clima em ${message.content}: ${weather.temperature}ºC, ${weather.condition}`,
        },
        "system"
      );
      await context.ws.sendMessage(weatherMsg);
    },
  },
];

export const exitFlowSteps: FlowStep[] = [
  {
    async execute(context) {
      const exitMsg = context.chatRepo.addMessage(MESSAGES.EXIT, "system");
      await context.ws.sendMessage(exitMsg);
      context.ws.ws.close();
    },
  },
];

export const handleInvalidMessage = async (context: FlowContext) => {
  const invalidMsg = context.chatRepo.addMessage(MESSAGES.INVALID_OPTION, "system");
  await context.ws.sendMessage(invalidMsg);
  const menuMsg = context.chatRepo.addMessage(MESSAGES.MENU, "system");
  await context.ws.sendMessage(menuMsg);
};
