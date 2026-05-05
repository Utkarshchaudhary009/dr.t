import { createRedisState } from "@chat-adapter/state-redis";
import { createTelegramAdapter } from "@chat-adapter/telegram";
import type { TelegramRawMessage } from "@chat-adapter/telegram";
import { Chat, toAiMessages } from "chat";
import { getAgents } from "./ai";
import { upsertTelegramUser } from "./users";

// ─── Webhook origin resolution ─────────────────────────────────────────────

/**
 * Determine the public-facing origin to use when registering the Telegram webhook.
 *
 * Priority:
 * 1. `WEBHOOK_URL` env var (explicit override)
 * 2. Origin of the incoming request URL (works on any custom domain)
 * 3. `VERCEL_URL` env var (Vercel auto-injects this for preview deployments)
 */
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

// ─── Types ─────────────────────────────────────────────────────────────────

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

function logTelegramFlow(step: string, data: Record<string, unknown> = {}) {
  console.info(`[onSubscribedMessage] ${step}`, data);
}

function getThreadId(message: TelegramRawMessage): string {
  if ("chat" in message && message.chat?.id !== undefined) {
    return `telegram:${message.chat.id}`;
  }
  return "telegram:unknown";
}

function registerTelegramHandlers(
  bot: Chat<{ telegram: ReturnType<typeof createTelegramAdapter> }>,
) {
  /**
   * Entry point: user sends a DM to the bot.
   *
   * 1. Subscribe so subsequent messages in this chat hit onSubscribedMessage.
   * 2. Extract identity from message.raw.from (the authoritative TelegramUser).
   * 3. Upsert into DB — creates the user on first contact, updates on repeat.
   * 4. Reply with a personalised greeting.
   */
  bot.onDirectMessage(async (thread, message) => {
    const raw = message.raw as TelegramRawMessage;
    logTelegramFlow("direct_message_received", { threadId: getThreadId(raw) });

    await thread.subscribe();
    logTelegramFlow("direct_message_subscribed", {
      threadId: getThreadId(raw),
    });

    const from = raw.from;

    // Channel posts don't carry a `from` field.
    if (!from) {
      await thread.post(
        "Sorry, I can only respond to direct personal messages.",
      );
      return;
    }

    const dbUser = await upsertTelegramUser({
      telegramId: from.id, // number — maps directly to BIGINT
      firstName: from.first_name,
      lastName: from.last_name,
      username: from.username,
      languageCode: from.language_code,
    });

    await thread.post(
      `Hello, ${dbUser.first_name}! 👋 Send me a photo of your food and I'll analyse its sugar content for you.`,
    );
  });

  /**
   * Follow-up messages in an already-subscribed chat.
   * The user's identity is already persisted from the first contact —
   * look them up by author.userId (which is telegram_id as string).
   */
  bot.onSubscribedMessage(async (thread, message) => {
    const raw = message.raw as TelegramRawMessage;
    logTelegramFlow("message_received", {
      threadId: getThreadId(raw),
      messageId: raw.message_id,
    });
    const from = raw.from;

    if (!from) return;

    // Keep user profile up to date (name/username may change over time).
    const dbUser = await upsertTelegramUser({
      telegramId: from.id,
      firstName: from.first_name,
      lastName: from.last_name,
      username: from.username,
      languageCode: from.language_code,
    });

    const result = await thread.adapter.fetchMessages(thread.id, { limit: 20 });
    const history = await toAiMessages(result.messages);

    const { geminiAgent, ollamaAgent } = getAgents(dbUser.id);
    logTelegramFlow("agents_initialized", { userId: dbUser.id });
    const defaultProvider = process.env.AI_PROVIDER || "gemini";
    const primaryAgent =
      defaultProvider === "ollama" ? ollamaAgent : geminiAgent;
    const fallbackAgent =
      defaultProvider === "ollama" ? geminiAgent : ollamaAgent;

    try {
      logTelegramFlow("primary_stream_start", { provider: defaultProvider });
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
        const fallbackResponse = await fallbackAgent.stream({
          prompt: history,
        });
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
    onLockConflict: "force",
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
