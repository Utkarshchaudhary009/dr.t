import { createMemoryState } from "@chat-adapter/state-memory";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import { Chat } from "chat";

export const TELEGRAM_HARDCODED_REPLY =
  "dr.t received your message. Hardcoded backend reply for now: please wait while we connect the food analysis flow.";

type TelegramEnv = {
  botToken?: string;
  secretToken?: string;
};

type TelegramRuntimeEnv = Record<string, string | undefined>;

let botInstance:
  | Chat<{ telegram: ReturnType<typeof createTelegramAdapter> }>
  | null
  | undefined;

export function getTelegramEnv(
  env: TelegramRuntimeEnv = process.env,
): TelegramEnv {
  return {
    botToken: env.TELEGRAM_BOT_TOKEN,
    secretToken: env.TELEGRAM_WEBHOOK_SECRET,
  };
}

export function getTelegramHardcodedReply(): string {
  return TELEGRAM_HARDCODED_REPLY;
}

export function resolveTelegramWebhookOrigin(
  requestUrl: string,
  env: TelegramRuntimeEnv = process.env,
): string {
  if (env.WEBHOOK_URL) {
    return env.WEBHOOK_URL;
  }

  const requestOrigin = new URL(requestUrl).origin;
  if (requestOrigin) {
    return requestOrigin;
  }

  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  throw new Error("Unable to resolve webhook origin");
}

function registerTelegramHandlers(
  bot: Chat<{ telegram: ReturnType<typeof createTelegramAdapter> }>,
) {
  const reply = getTelegramHardcodedReply();

  bot.onNewMention(async (thread) => {
    await thread.subscribe();
    await thread.post(reply);
  });

  bot.onDirectMessage(async (thread) => {
    await thread.subscribe();
    await thread.post(reply);
  });

  bot.onSubscribedMessage(async (thread) => {
    await thread.post(reply);
  });
}

function createTelegramBot(
  env: TelegramEnv,
): Chat<{ telegram: ReturnType<typeof createTelegramAdapter> }> {
  if (!env.botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }

  const bot = new Chat({
    userName: "dr_t_bot",
    adapters: {
      telegram: createTelegramAdapter({
        botToken: env.botToken,
        secretToken: env.secretToken,
      }),
    },
    state: createMemoryState(),
  });

  registerTelegramHandlers(bot);

  return bot;
}

export function getBot(): Chat<{
  telegram: ReturnType<typeof createTelegramAdapter>;
}> | null {
  if (botInstance !== undefined) {
    return botInstance;
  }

  const env = getTelegramEnv();
  botInstance = env.botToken ? createTelegramBot(env) : null;

  return botInstance;
}
