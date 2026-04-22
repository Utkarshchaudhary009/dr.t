import { Chat } from "chat";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createMemoryState } from "@chat-adapter/state-memory";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

export const bot = new Chat({
  userName: "dr_t_bot",
  adapters: {
    telegram: createTelegramAdapter({
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
    }),
  },
  state: createMemoryState(),
});

// Basic 'hi' response
bot.onNewMention(async (thread, message) => {
  await thread.subscribe();
  await thread.post("Hi! I'm dr.t, your smart food advisor. Send me a picture of your food!");
});

bot.onDirectMessage(async (thread, message) => {
  await thread.subscribe();
  await thread.post("Hi! I'm dr.t, your smart food advisor. Send me a picture of your food!");
});

bot.onSubscribedMessage(async (thread, message) => {
  if (message.text.toLowerCase().includes("hi") || message.text.toLowerCase().includes("hello")) {
    await thread.post("Hi there! How can I help you today?");
  }
});
