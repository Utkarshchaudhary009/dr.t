import { createRedisState } from "@chat-adapter/state-redis";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import type { TelegramRawMessage } from "@chat-adapter/telegram";
import { Chat, toAiMessages } from "chat";
import { getAgents } from "./ai";
import { upsertTelegramUser } from "./users";

export function resolveTelegramWebhookOrigin(
  requestUrl: string,
  env: Record<string, string | undefined> = process.env,
): string {
  if (env.WEBHOOK_URL) return env.WEBHOOK_URL;

  const { origin } = new URL(requestUrl);
  if (origin && origin !== "null") return origin;

  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;

  throw new Error(
    "Cannot determine webhook origin. Set WEBHOOK_URL or deploy to Vercel.",
  );
}

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

export function shouldSendWelcomeMessage(message: TelegramRawMessage): boolean {
  if (!("text" in message)) return false;
  const text = message.text?.trim().toLowerCase();
  return text === "/start";
}

function logTelegramFlow(step: string, data: Record<string, unknown> = {}) {
  console.info(`[telegram] ${step}`, data);
}

function getThreadId(message: TelegramRawMessage): string {
  if ("chat" in message && message.chat?.id !== undefined) {
    return `telegram:${message.chat.id}`;
  }
  return "telegram:unknown";
}

async function respondWithAi(
  bot: Chat<{ telegram: ReturnType<typeof createTelegramAdapter> }>,
  thread: Parameters<Parameters<typeof bot.onSubscribedMessage>[0]>[0],
  raw: TelegramRawMessage,
  userId: string,
) {
  const result = await thread.adapter.fetchMessages(thread.id, { limit: 20 });

  // Log message history and attachments for debugging
  logTelegramFlow("fetched_messages", {
    count: result.messages.length,
    messages: result.messages.map((m) => ({
      id: m.id,
      text: m.text,
      attachments: m.attachments?.map((a) => ({
        type: a.type,
        mimeType: a.mimeType,
        size: a.size,
        hasFetchData: !!a.fetchData,
      })),
    })),
  });

  // Workaround: toAiMessages filters out messages with empty text.
  // We ensure messages with attachments have at least a placeholder text.
  const messagesToConvert = result.messages.map((m) => {
    if (!m.text.trim() && (m.attachments?.length ?? 0) > 0) {
      // Create a shallow copy and override text
      return Object.assign(Object.create(Object.getPrototypeOf(m)), m, {
        text: "See the Attachement",
      });
    }
    return m;
  });

  const history = await toAiMessages(messagesToConvert);

  // Log converted history to see what's being sent to AI
  logTelegramFlow("history_converted", {
    messageCount: history.length,
    history: history.map((h) => ({
      role: h.role,
      contentLength:
        typeof h.content === "string" ? h.content.length : undefined,
      parts: Array.isArray(h.content)
        ? h.content.map((p) => ({
            type: p.type,
            hasData:
              p.type !== "text" &&
              (("data" in p && !!p.data) || ("image" in p && !!p.image)),
          }))
        : undefined,
    })),
  });

  const { geminiAgent, ollamaAgent } = getAgents(userId);
  logTelegramFlow("agents_initialized", { userId });
  const defaultProvider = process.env.AI_PROVIDER || "gemini";
  const primaryAgent = defaultProvider === "ollama" ? ollamaAgent : geminiAgent;
  const fallbackAgent =
    defaultProvider === "ollama" ? geminiAgent : ollamaAgent;

  try {
    logTelegramFlow("primary_stream_start", {
      provider: defaultProvider,
      threadId: getThreadId(raw),
    });
    const response = await primaryAgent.stream({ prompt: history });
    await thread.post(response.fullStream);
  } catch (e) {
    console.warn(
      `Primary provider (${defaultProvider}) failed, falling back to alternative provider.`,
      e,
    );
    try {
      logTelegramFlow("fallback_stream_start", {
        provider: defaultProvider === "ollama" ? "gemini" : "ollama",
      });
      const fallbackResponse = await fallbackAgent.stream({ prompt: history });
      await thread.post(fallbackResponse.fullStream);
    } catch (fallbackError) {
      console.error(
        "Both primary and fallback AI providers failed.",
        fallbackError,
      );
      await thread.post(
        "I'm sorry, my AI services are currently unavailable. Please try again later.",
      );
    }
  }
}

function registerTelegramHandlers(
  bot: Chat<{ telegram: ReturnType<typeof createTelegramAdapter> }>,
) {
  bot.onDirectMessage(async (thread, message) => {
    const raw = message.raw as TelegramRawMessage;
    logTelegramFlow("direct_message_received", { threadId: getThreadId(raw) });

    await thread.subscribe();

    const from = raw.from;

    if (!from) {
      await thread.post(
        "Sorry, I can only respond to direct personal messages.",
      );
      return;
    }

    const dbUser = await upsertTelegramUser({
      telegramId: from.id,
      firstName: from.first_name,
      lastName: from.last_name,
      username: from.username,
      languageCode: from.language_code,
    });

    if (shouldSendWelcomeMessage(raw)) {
      await thread.post(
        `Hello, ${dbUser.first_name}! 👋 Send me a photo of your food and I'll analyse its sugar content for you.`,
      );
      return;
    }

    await respondWithAi(bot, thread, raw, dbUser.id);
  });

  bot.onSubscribedMessage(async (thread, message) => {
    const raw = message.raw as TelegramRawMessage;
    logTelegramFlow("subscribed_message_received", {
      threadId: getThreadId(raw),
      messageId: raw.message_id,
    });
    const from = raw.from;

    if (!from) return;

    const dbUser = await upsertTelegramUser({
      telegramId: from.id,
      firstName: from.first_name,
      lastName: from.last_name,
      username: from.username,
      languageCode: from.language_code,
    });

    await respondWithAi(bot, thread, raw, dbUser.id);
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
    state: createRedisState(),
    concurrency: { strategy: "debounce", debounceMs: 1000 },
    streamingUpdateIntervalMs: 1000,
    get fallbackStreamingPlaceholderText() {
      const thoughts = [
        "Dr. T is putting on his glasses... 👓",
        "Calculating the sweetness factor... 🍬",
        "Dr. T is thinking hard... 🧠",
        "Dr. T is scrubbing in... 🧼",
        "Analyzing carbohydrate count... 🍞",
        "Reviewing clinical guidelines... 📚",
        "Dr. T is adjusting his stethoscope... 🩺",
        "Cross-referencing your history... 🕒",
        "Processing data... ⚡",
        "Dr. T is checking his clinical notes... 📝",
        "Adjusting the lab coat for maximum focus... 🥼",
        "Dr. T is pondering your query... 🤔",
        "Searching the medical journals... 📖",
        "Dr. T is tapping his chin thoughtfully... 🖐️",
        "Checking the latest research data... 💻",
        "Dr. T is tidying his desk for a better answer... 🧹",
        "Staring intently at the monitor... 🖥️",
        "Dr. T is taking a quick sip of water... 💧",
        "Gathering all the facts... 📚✨",
      ];
      return thoughts[Math.floor(Math.random() * thoughts.length)];
    },
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
